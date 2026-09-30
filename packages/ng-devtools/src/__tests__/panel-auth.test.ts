// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  NO_TOKEN,
  connectToken,
  requestCode,
  scopeTrustUpdates,
  saveToken,
  savedToken,
  serverOrigin,
  submitCode,
  trustState,
  watchTrust,
  type TrustClient,
  type TrustState,
} from '../../../../app/src/auth.ts';

const PANEL = 'chrome-extension://abcdefghijklmnop';
const SERVER = 'http://myapp.test:5173';

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

function mockClient(overrides: Partial<Record<string, unknown>> = {}) {
  const listeners = new Map<string, Set<() => void>>();
  const state = {
    isTrusted: false as boolean | null,
    status: 'connecting' as TrustClient['status'],
    authToken: undefined as string | undefined,
  };
  const client = {
    get isTrusted() {
      return state.isTrusted;
    },
    get status() {
      return state.status;
    },
    get connection() {
      return { authToken: state.authToken };
    },
    events: {
      on(event: string, listener: () => void) {
        const set = listeners.get(event) ?? new Set();
        set.add(listener);
        listeners.set(event, set);
        return () => set.delete(listener);
      },
    },
    requestAuthCode: vi.fn(async () => {}),
    requestTrustWithCode: vi.fn(async (code: string) => {
      if (code !== '123456') return false;
      state.isTrusted = true;
      state.status = 'connected';
      state.authToken = 'token-1';
      return true;
    }),
    ...overrides,
  } as unknown as TrustClient;
  const emit = (event: string) => listeners.get(event)?.forEach((listener) => listener());
  return { client, state, emit, listeners };
}

describe('trustState', () => {
  it('asks for a code only once the server refuses trust', () => {
    expect(trustState({ isTrusted: false, status: 'connecting' })).toBe('pending');
    expect(trustState({ isTrusted: null, status: 'disconnected' })).toBe('pending');
    expect(trustState({ isTrusted: false, status: 'unauthorized' })).toBe('needs-code');
    expect(trustState({ isTrusted: true, status: 'connected' })).toBe('trusted');
    expect(trustState({ isTrusted: true, status: 'disconnected' })).toBe('trusted');
  });
});

describe('watchTrust', () => {
  it('reports the current state, every change, and stops when unsubscribed', () => {
    const { client, state, emit, listeners } = mockClient();
    const seen: TrustState[] = [];
    const stop = watchTrust(client, (value) => seen.push(value));
    state.status = 'unauthorized';
    emit('connection:status');
    state.isTrusted = true;
    emit('rpc:is-trusted:updated');
    expect(seen).toEqual(['pending', 'needs-code', 'trusted']);
    stop();
    expect([...listeners.values()].every((set) => set.size === 0)).toBe(true);
  });
});

describe('serverOrigin', () => {
  it('resolves the server from the base URL, or the page itself', () => {
    expect(serverOrigin(`${SERVER}/__devframes/ng-devtools/`, `${PANEL}/ui/index.html`)).toBe(
      SERVER,
    );
    expect(serverOrigin('/__ng-devtools/', 'http://localhost:4000/app')).toBe(
      'http://localhost:4000',
    );
    expect(serverOrigin(undefined, 'http://localhost:4000/__devframes/ng-devtools/')).toBe(
      'http://localhost:4000',
    );
  });
});

describe('saved tokens', () => {
  it('keeps one token per server origin for a panel on another origin', () => {
    const storage = memoryStorage();
    saveToken(SERVER, PANEL, 'a', storage);
    saveToken('http://localhost:4200', PANEL, 'b', storage);
    expect(savedToken(SERVER, PANEL, storage)).toBe('a');
    expect(savedToken('http://localhost:4200', PANEL, storage)).toBe('b');
    expect(savedToken('http://other.test', PANEL, storage)).toBeUndefined();
  });

  it('leaves same origin pages to devframe', () => {
    const storage = memoryStorage();
    saveToken(SERVER, SERVER, 'a', storage);
    expect(storage.getItem('ng-devtools:auth-tokens')).toBeNull();
    const stored = memoryStorage({ 'ng-devtools:auth-tokens': JSON.stringify({ [SERVER]: 'a' }) });
    expect(savedToken(SERVER, SERVER, stored)).toBeUndefined();
    expect(savedToken(SERVER, PANEL, stored)).toBe('a');
  });

  it('survives missing, broken or blocked storage', () => {
    expect(savedToken(SERVER, PANEL, null)).toBeUndefined();
    expect(
      savedToken(SERVER, PANEL, memoryStorage({ 'ng-devtools:auth-tokens': 'not json' })),
    ).toBeUndefined();
    const blocked = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(() => saveToken(SERVER, PANEL, 'a', blocked)).not.toThrow();
  });
});

describe('connectToken', () => {
  it('sends only the token saved for this server across origins', () => {
    const storage = memoryStorage({
      'ng-devtools:auth-tokens': JSON.stringify({ [SERVER]: 'a' }),
      __DEVFRAME_CONNECTION_AUTH_TOKEN__: 'a',
    });
    expect(connectToken(SERVER, PANEL, storage)).toBe('a');
    expect(connectToken('http://localhost:4200', PANEL, storage)).toBe(NO_TOKEN);
    expect(connectToken(SERVER, SERVER, storage)).toBeUndefined();
  });
});

describe('scopeTrustUpdates', () => {
  it('ignores tokens for other servers across origins', async () => {
    const storage = memoryStorage({
      'ng-devtools:auth-tokens': JSON.stringify({ [SERVER]: 'a', 'http://localhost:4200': 'b' }),
    });
    const original = vi.fn(async (token: string) => token.length > 0);
    const client = { requestTrustWithToken: original };
    scopeTrustUpdates(client, SERVER, PANEL, storage);
    expect(await client.requestTrustWithToken('b')).toBe(false);
    expect(original).not.toHaveBeenCalled();
    expect(await client.requestTrustWithToken('a')).toBe(true);
    expect(original).toHaveBeenCalledWith('a');
  });

  it('leaves same origin pages to devframe', () => {
    const original = vi.fn(async (token: string) => token.length > 0);
    const client = { requestTrustWithToken: original };
    scopeTrustUpdates(client, SERVER, SERVER, memoryStorage());
    expect(client.requestTrustWithToken).toBe(original);
  });
});

describe('submitCode', () => {
  it('needs a code before asking the server', async () => {
    const { client } = mockClient();
    expect(await submitCode(client, '   ', SERVER, PANEL, memoryStorage())).toBe('empty');
    expect(client.requestTrustWithCode).not.toHaveBeenCalled();
  });

  it('reports a wrong code and saves nothing', async () => {
    const { client } = mockClient();
    const storage = memoryStorage();
    expect(await submitCode(client, '999999', SERVER, PANEL, storage)).toBe('wrong');
    expect(savedToken(SERVER, PANEL, storage)).toBeUndefined();
  });

  it('trims spaces, connects and saves the token for the server', async () => {
    const { client } = mockClient();
    const storage = memoryStorage();
    expect(await submitCode(client, ' 123 456 ', SERVER, PANEL, storage)).toBe('trusted');
    expect(client.requestTrustWithCode).toHaveBeenCalledWith('123456');
    expect(savedToken(SERVER, PANEL, storage)).toBe('token-1');
  });

  it('reports an unreachable server when the exchange throws', async () => {
    const { client } = mockClient({
      requestTrustWithCode: vi.fn(async () => {
        throw new Error('socket closed');
      }),
    });
    expect(await submitCode(client, '123456', SERVER, PANEL, memoryStorage())).toBe('unreachable');
  });
});

describe('requestCode', () => {
  it('asks the server to print the code, rotating it on request', async () => {
    const { client } = mockClient();
    expect(await requestCode(client)).toBe(true);
    expect(await requestCode(client, true)).toBe(true);
    expect(client.requestAuthCode).toHaveBeenNthCalledWith(1, undefined);
    expect(client.requestAuthCode).toHaveBeenNthCalledWith(2, { reissue: true });
  });

  it('resolves false when the server cannot be reached', async () => {
    const { client } = mockClient({
      requestAuthCode: vi.fn(async () => {
        throw new Error('down');
      }),
    });
    expect(await requestCode(client)).toBe(false);
  });
});
