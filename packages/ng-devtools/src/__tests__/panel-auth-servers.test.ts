// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { connectDevframe, type DevframeRpcClient } from 'devframe/client';
import ngDevtoolsVite from '../vite.ts';
import { makeProject } from './analog-fixture.ts';
import {
  NO_TOKEN,
  connectToken,
  scopeTrustUpdates,
  serverOrigin,
  submitCode,
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

const servers: ViteDevServer[] = [];
const clients: DevframeRpcClient[] = [];
const banner: string[] = [];
const sent: { url: string; data: string }[] = [];

function lastCode(): string | undefined {
  const text = banner.join('\n').replace(/\u001b\[[0-9;]*m/g, '');
  return [...text.matchAll(/auth code\s+(\d{6})/g)].at(-1)?.[1];
}

function freshWindow() {
  const scope = globalThis as Record<string, unknown>;
  for (const key of Object.keys(scope)) if (key.startsWith('__DEVFRAME_')) delete scope[key];
}

async function startServer(host: string): Promise<string> {
  const server = await createServer({
    root: makeProject({ 'package.json': '{}' }),
    configFile: false,
    logLevel: 'silent',
    server: { host, port: 0 },
    plugins: [ngDevtoolsVite({ auth: true })],
  });
  await server.listen();
  servers.push(server);
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  return `http://${host}:${address.port}/__devframes/ng-devtools/`;
}

async function connect(baseURL: string, storage: ReturnType<typeof memoryStorage>) {
  freshWindow();
  const server = serverOrigin(baseURL, PANEL);
  const client = await connectDevframe({
    baseURL,
    authToken: connectToken(server, PANEL_ORIGIN, storage),
    simpleAuth: false,
  });
  scopeTrustUpdates(client, server, PANEL_ORIGIN, storage);
  clients.push(client);
  return { client, server };
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

function presentedTo(server: string, token: string): boolean {
  return sent.some(
    ({ url, data }) =>
      new URL(url).host === new URL(server).host && `${url} ${data}`.includes(token),
  );
}

let serverA: string;
let serverB: string;

beforeAll(async () => {
  vi.stubGlobal('location', new URL(PANEL));
  const log = console.log;
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(' ');
    if (text.includes('auth code')) banner.push(text);
    else log(...args);
  });
  const Native = globalThis.WebSocket;
  vi.stubGlobal(
    'WebSocket',
    class extends Native {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        sent.push({ url: String(url), data: '' });
      }
      override send(data: Parameters<WebSocket['send']>[0]) {
        sent.push({ url: this.url, data: typeof data === 'string' ? data : String(data) });
        super.send(data);
      }
    },
  );
  serverA = await startServer('127.0.0.1');
  serverB = await startServer('localhost');
}, 30_000);

afterAll(async () => {
  for (const client of clients) client.close?.();
  for (const server of servers) await server.close();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function trustWithCode(client: DevframeRpcClient, server: string, storage: Storage) {
  await client.requestAuthCode({ reissue: true });
  expect(await submitCode(client, lastCode()!, server, PANEL_ORIGIN, storage)).toBe('trusted');
  return client.connection.authToken!;
}

describe('extension panel connected to two servers', () => {
  it('never presents the token for one server to another', async () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);

    const b = await connect(serverB, storage);
    expect(await settled(b.client)).toBe('needs-code');

    const a = await connect(serverA, storage);
    expect(await settled(a.client)).toBe('needs-code');
    const tokenA = await trustWithCode(a.client, a.server, storage as unknown as Storage);
    expect(tokenA).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(b.client.isTrusted).toBe(false);

    const reloadedB = await connect(serverB, storage);
    expect(await settled(reloadedB.client)).toBe('needs-code');
    expect(reloadedB.client.connection.authToken).not.toBe(tokenA);

    const reloadedA = await connect(serverA, storage);
    expect(await settled(reloadedA.client)).toBe('trusted');

    expect(sent.some(({ url, data }) => url.includes('localhost') && data.includes(NO_TOKEN))).toBe(
      true,
    );
    expect(presentedTo(serverA, tokenA)).toBe(true);
    expect(presentedTo(serverB, tokenA)).toBe(false);
  }, 30_000);
});
