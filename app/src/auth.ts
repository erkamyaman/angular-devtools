import type { DevframeRpcClient } from 'devframe/client';

/** What the panel needs from the devframe client to run the one-time code flow. */
export type TrustClient = Pick<
  DevframeRpcClient,
  'isTrusted' | 'status' | 'events' | 'connection' | 'requestAuthCode' | 'requestTrustWithCode'
>;

export type TrustState = 'pending' | 'trusted' | 'needs-code';

export type CodeResult = 'trusted' | 'empty' | 'wrong' | 'unreachable';

type TokenStorage = Pick<Storage, 'getItem' | 'setItem'>;

const TOKENS_KEY = 'ng-devtools:auth-tokens';
export const NO_TOKEN = 'ng-devtools:no-token';

export function trustState(client: Pick<TrustClient, 'isTrusted' | 'status'>): TrustState {
  if (client.isTrusted) return 'trusted';
  return client.status === 'unauthorized' ? 'needs-code' : 'pending';
}

/** Reports the trust state now and on every change; returns the unsubscribe. */
export function watchTrust(client: TrustClient, onChange: (state: TrustState) => void): () => void {
  const emit = () => onChange(trustState(client));
  const offStatus = client.events.on('connection:status', emit);
  const offTrust = client.events.on('rpc:is-trusted:updated', emit);
  emit();
  return () => {
    offStatus();
    offTrust();
  };
}

/** The origin of the devtools server the panel connects to. */
export function serverOrigin(baseURL: string | string[] | undefined, page: string): string {
  const base = Array.isArray(baseURL) ? baseURL[0] : baseURL;
  try {
    return new URL(base ?? './', page).origin;
  } catch {
    return new URL(page).origin;
  }
}

function defaultStorage(): TokenStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readTokens(storage: TokenStorage | null): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(TOKENS_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * The token saved for a server on another origin, such as the dev server seen
 * from the extension panel. A page on the server's own origin already shares
 * devframe's stored token, so it gets none here.
 */
export function savedToken(
  server: string,
  pageOrigin: string,
  storage = defaultStorage(),
): string | undefined {
  if (server === pageOrigin) return undefined;
  const token = readTokens(storage)[server];
  return typeof token === 'string' && token ? token : undefined;
}

export function connectToken(
  server: string,
  pageOrigin: string,
  storage = defaultStorage(),
): string | undefined {
  if (server === pageOrigin) return undefined;
  return savedToken(server, pageOrigin, storage) ?? NO_TOKEN;
}

export function scopeTrustUpdates(
  client: Pick<DevframeRpcClient, 'requestTrustWithToken'>,
  server: string,
  pageOrigin: string,
  storage = defaultStorage(),
): void {
  if (server === pageOrigin) return;
  const requestTrustWithToken = client.requestTrustWithToken;
  client.requestTrustWithToken = async (token) =>
    token === savedToken(server, pageOrigin, storage) ? requestTrustWithToken(token) : false;
}

export function saveToken(
  server: string,
  pageOrigin: string,
  token: string | undefined,
  storage = defaultStorage(),
): void {
  if (server === pageOrigin || !token || !storage) return;
  try {
    storage.setItem(TOKENS_KEY, JSON.stringify({ ...readTokens(storage), [server]: token }));
  } catch {
    // Storage is full or blocked; the panel asks for a code again next time.
  }
}

/** Exchanges a one-time code for a token and saves it for the server. */
export async function submitCode(
  client: TrustClient,
  code: string,
  server: string,
  pageOrigin: string,
  storage = defaultStorage(),
): Promise<CodeResult> {
  const trimmed = code.replace(/\s+/g, '');
  if (!trimmed) return 'empty';
  let trusted: boolean;
  try {
    trusted = await client.requestTrustWithCode(trimmed);
  } catch {
    return 'unreachable';
  }
  if (!trusted) return 'wrong';
  saveToken(server, pageOrigin, client.connection.authToken, storage);
  return 'trusted';
}

/** Asks the server to print its code in the terminal; `reissue` rotates it first. */
export async function requestCode(client: TrustClient, reissue = false): Promise<boolean> {
  try {
    await client.requestAuthCode(reissue ? { reissue: true } : undefined);
    return true;
  } catch {
    return false;
  }
}
