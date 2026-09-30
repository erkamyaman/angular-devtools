// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { connectDevframe, type DevframeRpcClient } from 'devframe/client';
import ngDevtoolsVite from '../vite.ts';
import { makeProject } from './analog-fixture.ts';
import {
  savedToken,
  serverOrigin,
  submitCode,
  trustState,
  watchTrust,
  type TrustState,
} from '../../../../app/src/auth.ts';

const PANEL = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop/ui/index.html';
const PANEL_ORIGIN = new URL(PANEL).origin;

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  };
}

let server: ViteDevServer;
let baseURL: string;
const banner: string[] = [];
const clients: DevframeRpcClient[] = [];

function lastCode(): string | undefined {
  const text = banner.join('\n').replace(/\u001b\[[0-9;]*m/g, '');
  return [...text.matchAll(/auth code\s+(\d{6})/g)].at(-1)?.[1];
}

// Each panel load starts in a fresh window; drop what devframe cached on this one.
function freshWindow() {
  const scope = globalThis as Record<string, unknown>;
  for (const key of Object.keys(scope)) if (key.startsWith('__DEVFRAME_')) delete scope[key];
}

async function connect(storage: ReturnType<typeof memoryStorage>) {
  freshWindow();
  vi.stubGlobal('localStorage', storage);
  const server = serverOrigin(baseURL, PANEL);
  const client = await connectDevframe({
    baseURL,
    authToken: savedToken(server, PANEL_ORIGIN, storage),
    simpleAuth: false,
  });
  clients.push(client);
  return client;
}

function settled(client: DevframeRpcClient): Promise<TrustState> {
  return new Promise((resolve) => {
    const stop = watchTrust(client, (state) => {
      if (state === 'pending') return;
      queueMicrotask(() => stop());
      resolve(state);
    });
  });
}

function analogProject(client: DevframeRpcClient) {
  const rpc = client.scope('ng-devtools').rpc as unknown as {
    call: (name: string) => Promise<unknown>;
  };
  return rpc.call('analog-project');
}

beforeAll(async () => {
  vi.stubGlobal('location', new URL(PANEL));
  const log = console.log;
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(' ');
    if (text.includes('auth code')) banner.push(text);
    else log(...args);
  });
  const root = makeProject({ 'package.json': '{}' });
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, allowedHosts: ['myapp.test'] },
    plugins: [ngDevtoolsVite()],
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  baseURL = `http://127.0.0.1:${address.port}/__devframes/ng-devtools/`;
}, 30_000);

afterAll(async () => {
  for (const client of clients) client.close?.();
  await server?.close();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('extension panel against a Vite server that asks for the one-time code', () => {
  it('asks for the code, rejects a wrong one, then connects with the right one', async () => {
    const storage = memoryStorage();
    const client = await connect(storage);
    expect(await settled(client)).toBe('needs-code');
    await expect(analogProject(client)).rejects.toThrow(/Not authorized/);

    await client.requestAuthCode();
    const code = lastCode();
    expect(code).toMatch(/^\d{6}$/);

    const server = serverOrigin(baseURL, PANEL);
    const wrong = code === '000000' ? '111111' : '000000';
    expect(await submitCode(client, wrong, server, PANEL_ORIGIN, storage)).toBe('wrong');
    expect(trustState(client)).toBe('needs-code');
    expect(
      await submitCode(
        client,
        `${code!.slice(0, 3)} ${code!.slice(3)}`,
        server,
        PANEL_ORIGIN,
        storage,
      ),
    ).toBe('trusted');
    expect(trustState(client)).toBe('trusted');
    expect(await analogProject(client)).toMatchObject({ analog: false });
    expect(savedToken(server, PANEL_ORIGIN, storage)).toBe(client.connection.authToken);
  }, 30_000);

  it('reuses the saved token when the panel reloads', async () => {
    const storage = memoryStorage();
    const first = await connect(storage);
    expect(await settled(first)).toBe('needs-code');
    await first.requestAuthCode({ reissue: true });
    const server = serverOrigin(baseURL, PANEL);
    expect(await submitCode(first, lastCode()!, server, PANEL_ORIGIN, storage)).toBe('trusted');
    first.close?.();

    const panelOnly = memoryStorage();
    panelOnly.setItem('ng-devtools:auth-tokens', storage.getItem('ng-devtools:auth-tokens')!);
    const reloaded = await connect(panelOnly);
    expect(await settled(reloaded)).toBe('trusted');
    expect(await analogProject(reloaded)).toMatchObject({ analog: false });
  }, 30_000);
});
