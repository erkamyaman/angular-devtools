import { REDACTED, isSensitive, serializeFormValue } from './forms.ts';

export interface RouteGuards {
  canActivate?: string[];
  canActivateChild?: string[];
  canDeactivate?: string[];
  canMatch?: string[];
}

export interface ActiveRoute {
  path: string;
  url: string;
  outlet: string;
  component?: string;
  title?: string;
  params: Record<string, unknown>;
  data: Record<string, unknown>;
  guards?: RouteGuards;
  resolvers?: string[];
  lazy?: boolean;
  children: ActiveRoute[];
}

export interface RouterSnapshot {
  url: string;
  queryParams: Record<string, unknown>;
  fragment: string | null;
  root: ActiveRoute;
}

export type NavigationOutcome =
  'pending' | 'succeeded' | 'redirected' | 'cancelled' | 'failed' | 'skipped';

export interface NavigationRecord {
  id: number;
  url: string;
  trigger: string;
  startedAt: number;
  endedAt?: number;
  outcome: NavigationOutcome;
  finalUrl?: string;
  guards?: { names: string[]; passed?: boolean; ms?: number };
  resolvers?: { names: string[]; ms?: number };
  lazyLoaded?: string[];
  reason?: string;
  code?: string;
  beforeConnect?: boolean;
  earlier?: number;
}

export interface RouterDebugApi {
  getInjector?(el: Element): unknown;
  getComponent?(el: Element): unknown;
  ɵgetRouterInstance?(injector: unknown): unknown;
  ɵgetInjectorProviders?(injector: unknown): { token: unknown }[];
  ɵgetInjectorResolutionPath?(injector: unknown): unknown[];
}

type AnyRecord = Record<string, any>;

const MAX_DEPTH = 12;
const MAX_REASON = 300;
const MAX_URL = 2000;
const URL_SECRET_KEY =
  /^(code|key|sig|signature|session|session_?id|sid|auth|authorization|jwt|credentials?|x-amz-(signature|credential|security-token)|x-goog-(signature|credential))$/i;
const GUARD_KINDS = ['canActivate', 'canActivateChild', 'canDeactivate', 'canMatch'] as const;
const CANCEL_CODES = [
  'Redirect',
  'SupersededByNewNavigation',
  'NoDataFromResolver',
  'GuardRejected',
  'Aborted',
];
const SKIP_CODES = ['IgnoredSameUrlNavigation', 'IgnoredByUrlHandlingStrategy'];

const EventType = {
  NavigationStart: 0,
  NavigationEnd: 1,
  NavigationCancel: 2,
  NavigationError: 3,
  RoutesRecognized: 4,
  ResolveStart: 5,
  ResolveEnd: 6,
  GuardsCheckStart: 7,
  GuardsCheckEnd: 8,
  RouteConfigLoadStart: 9,
  ChildActivationStart: 11,
  ActivationStart: 13,
  NavigationSkipped: 16,
} as const;

const navSecrets = new WeakMap<NavigationRecord, string[]>();
const knownSecrets = new Set<string>();
const phaseStarts = new WeakMap<NavigationRecord, { guards?: number; resolvers?: number }>();
const checkedResolvers = new WeakMap<NavigationRecord, string[]>();
const lazyConfigs = new WeakMap<NavigationRecord, object[]>();

function markStart(nav: NavigationRecord, phase: 'guards' | 'resolvers', now: number) {
  phaseStarts.set(nav, { ...phaseStarts.get(nav), [phase]: now });
}

function elapsed(nav: NavigationRecord, phase: 'guards' | 'resolvers', now: number) {
  const start = phaseStarts.get(nav)?.[phase];
  return start === undefined ? undefined : now - start;
}

function read<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function nameOf(value: unknown): string {
  if (typeof value === 'function') return value.name || 'anonymous function';
  if (value && typeof value === 'object') {
    const ctor = read(() => (value as AnyRecord)['constructor'] as { name?: string }, undefined);
    if (ctor?.name && ctor.name !== 'Object') return ctor.name;
  }
  return String(value);
}

function isSecretKey(key: string): boolean {
  return isSensitive(key) || URL_SECRET_KEY.test(key);
}

function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

const TEXT_PAIR = /(^|[?&#;])([^=&#;?\s"'/]+)=([^&#;\s"']*)/g;
const URL_PAIR = /(^|[?&#;])([^=&#;?\s/]+)=([^&#;\s]*)/g;

function segmentForm(secret: string): string {
  return encodeURIComponent(secret)
    .replace(/%40/g, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%26/gi, '&')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

/**
 * Hides the values of secret-looking query, matrix and fragment keys
 * (`?token=…`, `;api_key=…`, `#access_token=…`) and any of the given secret
 * route param values, wherever they appear in a URL or a message. In `url`
 * mode a value runs to the next separator; in messages it also stops at quotes.
 */
export function redactText(
  text: string,
  secrets: Iterable<string> = [],
  mode: 'url' | 'text' = 'text',
  depth = 0,
): string {
  let out = text.replace(
    mode === 'url' ? URL_PAIR : TEXT_PAIR,
    (match, sep: string, key: string, value: string) => {
      if (isSecretKey(decode(key))) return `${sep}${key}=${REDACTED}`;
      const decoded = decode(value);
      if (depth > 1 || decoded === value || !decoded.includes('=')) return match;
      const inner = redactText(decoded, secrets, mode, depth + 1);
      return inner === decoded ? match : `${sep}${key}=${encodeURIComponent(inner)}`;
    },
  );
  for (const secret of secrets) {
    if (secret.length < 3) continue;
    for (const form of new Set([secret, encodeURIComponent(secret), segmentForm(secret)])) {
      out = out.split(form).join(REDACTED);
    }
  }
  return out;
}

function secretParamsOf(root: AnyRecord | null): string[] {
  const secrets = chainOf(root).flatMap((route) =>
    Object.entries(read(() => route['params'] as Record<string, unknown>, {}))
      .filter(([key, value]) => isSecretKey(key) && typeof value === 'string')
      .map(([, value]) => value as string),
  );
  for (const secret of secrets) knownSecrets.add(secret);
  if (knownSecrets.size > 100) knownSecrets.delete(knownSecrets.values().next().value!);
  return secrets;
}

function redactUrl(url: string, secrets: string[] = []): string {
  return clip(redactText(url, [...secrets, ...knownSecrets], 'url'), MAX_URL);
}

function redactValue(value: unknown, secrets: string[]): unknown {
  if (typeof value === 'string') return redactText(value, secrets);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, secrets));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSecretKey(key) ? REDACTED : redactValue(item, secrets),
    ]),
  );
}

function redactRecord(value: unknown, secrets: string[] = []): Record<string, unknown> {
  return redactValue(asRecord(value), [...secrets, ...knownSecrets]) as Record<string, unknown>;
}

function componentName(type: unknown): string {
  const className = read(
    () => (type as AnyRecord)['ɵcmp']?.['debugInfo']?.['className'] as string | undefined,
    undefined,
  );
  return className || nameOf(type).replace(/^_+(?=\w)/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
  const out = serializeFormValue(value);
  return out && typeof out === 'object' && !Array.isArray(out)
    ? (out as Record<string, unknown>)
    : {};
}

function isRouter(value: unknown): value is AnyRecord {
  const v = value as AnyRecord | null;
  return (
    !!v &&
    typeof v === 'object' &&
    typeof read(() => v['navigateByUrl'], undefined) === 'function' &&
    !!read(() => v['events'], undefined) &&
    !!read(() => v['routerState'], undefined)
  );
}

function routerOf(ng: RouterDebugApi, injector: unknown): AnyRecord | null {
  const viaUtil = read(() => ng.ɵgetRouterInstance?.(injector), undefined);
  if (isRouter(viaUtil)) return viaUtil;
  const path = read(() => ng.ɵgetInjectorResolutionPath?.(injector) ?? [injector], [injector]);
  for (const candidate of path) {
    const providers = read(() => ng.ɵgetInjectorProviders?.(candidate) ?? [], []);
    for (const { token } of providers) {
      if (nameOf(token).replace(/^_+/, '') !== 'Router') continue;
      const router = read(() => (injector as AnyRecord)['get'](token, null), null);
      if (isRouter(router)) return router;
    }
  }
  return null;
}

function inUse(router: AnyRecord): boolean {
  return read(
    () => (router['config'] as unknown[]).length > 0 || router['navigated'] === true,
    false,
  );
}

/**
 * The app's Router, through the debug util `provideRouter()` publishes on
 * `ng`, or through the root injector's providers for apps that use
 * `RouterModule.forRoot()`. With several roots, a router that has routes or
 * has navigated wins over an empty one a router-less root created.
 */
export function findRouter(ng: RouterDebugApi, roots: Iterable<Element>): AnyRecord | null {
  const candidates: AnyRecord[] = [];
  for (const el of roots) {
    const injector = read(() => ng.getInjector?.(el), undefined);
    const router = injector ? routerOf(ng, injector) : null;
    if (router && !candidates.includes(router)) candidates.push(router);
  }
  return candidates.find(inUse) ?? candidates[0] ?? null;
}

function guardsOf(config: AnyRecord | null): RouteGuards | undefined {
  if (!config) return undefined;
  const out: RouteGuards = {};
  for (const kind of GUARD_KINDS) {
    const list = read(() => config[kind] as unknown[] | undefined, undefined);
    if (Array.isArray(list) && list.length) out[kind] = list.map(nameOf);
  }
  return Object.keys(out).length ? out : undefined;
}

function resolversOf(config: AnyRecord | null): string[] | undefined {
  const resolve = read(() => config?.['resolve'] as Record<string, unknown> | undefined, undefined);
  if (!resolve || typeof resolve !== 'object') return undefined;
  const keys = Object.keys(resolve).map((key) => `${key}: ${nameOf(resolve[key])}`);
  return keys.length ? keys : undefined;
}

export function serializeRoute(route: AnyRecord, depth = 0): ActiveRoute {
  const config = read(() => route['routeConfig'] as AnyRecord | null, null);
  const component = read(() => route['component'] ?? config?.['component'], undefined);
  const title = read(() => route['title'] as unknown, undefined);
  const segments = read(() => route['url'] as { path: string }[], []);
  const children = depth >= MAX_DEPTH ? [] : read(() => route['children'] as AnyRecord[], []);
  const secrets = secretParamsOf(route);
  const out: ActiveRoute = {
    path: read(() => (config?.['path'] as string | undefined) ?? '', ''),
    url: redactUrl(segments.map((s) => s.path).join('/'), secrets),
    outlet: read(() => route['outlet'] as string, 'primary'),
    params: redactRecord(
      read(() => route['params'], {}),
      secrets,
    ),
    data: redactRecord(
      read(() => route['data'], {}),
      secrets,
    ),
    children: children.map((child) => serializeRoute(child, depth + 1)),
  };
  if (component) out.component = componentName(component);
  if (typeof title === 'string') {
    out.title = clip(redactText(title, [...secrets, ...knownSecrets]), MAX_REASON);
  }
  const guards = guardsOf(config);
  if (guards) out.guards = guards;
  const resolvers = resolversOf(config);
  if (resolvers) out.resolvers = resolvers;
  if (config && (config['loadChildren'] || config['loadComponent'])) out.lazy = true;
  return out;
}

export function snapshotRouter(router: AnyRecord): RouterSnapshot | null {
  const root = read(() => router['routerState']['snapshot']['root'] as AnyRecord, null);
  if (!root) return null;
  const fragment = read(() => root['fragment'] as string | null, null);
  const secrets = secretParamsOf(root);
  return {
    url: redactUrl(
      read(() => String(router['url']), ''),
      secrets,
    ),
    queryParams: redactRecord(read(() => root['queryParams'], {})),
    fragment: typeof fragment === 'string' ? redactUrl(fragment) : null,
    root: serializeRoute(root),
  };
}

function chainOf(root: AnyRecord | null): AnyRecord[] {
  const out: AnyRecord[] = [];
  const visit = (route: AnyRecord, depth: number) => {
    out.push(route);
    if (depth >= MAX_DEPTH) return;
    for (const child of read(() => route['children'] as AnyRecord[], [])) visit(child, depth + 1);
  };
  if (root) visit(root, 0);
  return out;
}

function configsOf(state: unknown): AnyRecord[] {
  const root = read(() => (state as AnyRecord)['root'] as AnyRecord, null);
  return chainOf(root)
    .map((route) => read(() => route['routeConfig'] as AnyRecord | null, null))
    .filter((config): config is AnyRecord => !!config);
}

function leavingGuardsOf(target: unknown, leaving: unknown): string[] {
  const staying = new Set(configsOf(target));
  const names = configsOf(leaving)
    .filter((config) => !staying.has(config))
    .flatMap((config) => (guardsOf(config)?.canDeactivate ?? []).map((n) => `${n} (leaving)`));
  return Array.from(new Set(names));
}

function checkedGuardsOf(snapshot: AnyRecord): string[] {
  const path = read(() => snapshot['pathFromRoot'] as AnyRecord[], [snapshot]);
  const config = read(() => snapshot['routeConfig'] as AnyRecord | null, null);
  const ancestors = path
    .slice(0, -1)
    .flatMap((route) => guardsOf(read(() => route['routeConfig'], null))?.canActivateChild ?? []);
  return [...ancestors, ...(guardsOf(config)?.canActivate ?? [])];
}

function configSecretsFor(router: AnyRecord | undefined, url: string): string[] {
  if (!router) return [];
  const segments = url
    .split(/[?#(]/)[0]
    .split('/')
    .filter(Boolean)
    .map((segment) => decode(segment.split(';')[0]));
  const out: string[] = [];
  const walk = (routes: AnyRecord[], at: number, depth: number) => {
    if (depth > MAX_DEPTH || !Array.isArray(routes)) return;
    for (const route of routes) {
      const parts = read(() => String(route['path'] ?? ''), '')
        .split('/')
        .filter(Boolean);
      if (at + parts.length > segments.length) continue;
      const found: string[] = [];
      const matches = parts.every((part, i) => {
        if (!part.startsWith(':')) return part === segments[at + i];
        if (isSecretKey(part.slice(1))) found.push(segments[at + i]);
        return true;
      });
      if (!matches) continue;
      out.push(...found);
      const children = [
        ...read(() => (route['children'] as AnyRecord[]) ?? [], []),
        ...read(() => (route['_loadedRoutes'] as AnyRecord[]) ?? [], []),
      ];
      walk(children, at + parts.length, depth + 1);
    }
  };
  walk(
    read(() => router['config'] as AnyRecord[], []),
    0,
    0,
  );
  return out.filter((secret) => secret.length >= 3);
}

function errorText(error: unknown, secrets?: string[]): string {
  const text =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : nameOf(error);
  return clip(redactText(text, [...(secrets ?? []), ...knownSecrets]), MAX_REASON);
}

/**
 * Folds one router event into the navigation it belongs to. Returns true when
 * something changed.
 */
export function applyRouterEvent(
  navigations: NavigationRecord[],
  event: AnyRecord,
  now: number,
  router?: AnyRecord,
): boolean {
  const type = read(() => event['type'] as number, -1);
  const id = read(() => event['id'] as number, -1);
  if (type === EventType.NavigationStart) {
    const url = String(event['url']);
    const nav: NavigationRecord = {
      id,
      url: '',
      trigger: String(event['navigationTrigger'] ?? 'imperative'),
      startedAt: now,
      outcome: 'pending',
    };
    const secrets = configSecretsFor(router, url);
    navSecrets.set(nav, secrets);
    nav.url = redactUrl(url, secrets);
    navigations.push(nav);
    return true;
  }
  let current: NavigationRecord | undefined;
  for (let i = navigations.length - 1; i >= 0 && !current; i--) {
    if (navigations[i].outcome === 'pending') current = navigations[i];
  }
  if (type === EventType.RouteConfigLoadStart) {
    if (!current) return false;
    const config = read(() => event['route'] as object, null);
    const path = read(() => String((config as AnyRecord)['path'] ?? ''), '');
    current.lazyLoaded = [...(current.lazyLoaded ?? []), path || '(root)'];
    lazyConfigs.set(current, [...(lazyConfigs.get(current) ?? []), config ?? {}]);
    return true;
  }
  if (type === EventType.ActivationStart) {
    const snapshot = read(() => event['snapshot'] as AnyRecord, null);
    if (!current?.guards || !snapshot) return false;
    const names = checkedGuardsOf(snapshot);
    current.guards = {
      ...current.guards,
      names: [...new Set([...current.guards.names, ...names])],
    };
    const resolvers = resolversOf(read(() => snapshot['routeConfig'], null)) ?? [];
    checkedResolvers.set(current, [...(checkedResolvers.get(current) ?? []), ...resolvers]);
    return names.length > 0;
  }
  if (type === EventType.NavigationSkipped && !navigations.some((n) => n.id === id)) {
    navigations.push({
      id,
      url: redactUrl(String(event['url'])),
      trigger: 'imperative',
      startedAt: now,
      outcome: 'pending',
    });
  }
  const nav = navigations.find((n) => n.id === id);
  if (!nav) return false;
  switch (type) {
    case EventType.RoutesRecognized: {
      const secrets = [
        ...(navSecrets.get(nav) ?? []),
        ...secretParamsOf(read(() => event['state']['root'] as AnyRecord, null)),
      ];
      navSecrets.set(nav, secrets);
      nav.url = redactUrl(nav.url, secrets);
      nav.finalUrl = redactUrl(String(event['urlAfterRedirects']), secrets);
      return true;
    }
    case EventType.GuardsCheckStart: {
      markStart(nav, 'guards', now);
      const leaving = read(() => router?.['routerState']['snapshot'], undefined);
      nav.guards = { names: leavingGuardsOf(event['state'], leaving) };
      return true;
    }
    case EventType.GuardsCheckEnd:
      nav.guards = {
        names: nav.guards?.names ?? [],
        passed: !!event['shouldActivate'],
        ms: elapsed(nav, 'guards', now),
      };
      return true;
    case EventType.ResolveStart:
      markStart(nav, 'resolvers', now);
      nav.resolvers = { names: checkedResolvers.get(nav) ?? [] };
      return true;
    case EventType.ResolveEnd:
      nav.resolvers = { names: nav.resolvers?.names ?? [], ms: elapsed(nav, 'resolvers', now) };
      return true;
    case EventType.NavigationEnd: {
      nav.outcome = 'succeeded';
      nav.finalUrl = redactUrl(String(event['urlAfterRedirects']), navSecrets.get(nav));
      nav.endedAt = now;
      const loaded = lazyConfigs.get(nav);
      const active =
        router && new Set(configsOf(read(() => router['routerState']['snapshot'], null)));
      if (loaded && active && nav.lazyLoaded) {
        nav.lazyLoaded = nav.lazyLoaded.filter((_, i) => active.has(loaded[i] as AnyRecord));
        if (!nav.lazyLoaded.length) delete nav.lazyLoaded;
      }
      return true;
    }
    case EventType.NavigationCancel: {
      const code = read(() => event['code'] as number | undefined, undefined);
      nav.code = code === undefined ? undefined : (CANCEL_CODES[code] ?? String(code));
      nav.outcome = nav.code === 'Redirect' ? 'redirected' : 'cancelled';
      const byGuard = nav.code === 'Redirect' || nav.code === 'GuardRejected';
      if (byGuard && nav.guards && nav.guards.passed === undefined) {
        nav.guards = { ...nav.guards, passed: false, ms: elapsed(nav, 'guards', now) };
      }
      nav.reason = errorText(
        String(event['reason'] ?? '').replace(/^NavigationCancelingError: /, ''),
        navSecrets.get(nav),
      );
      nav.endedAt = now;
      return true;
    }
    case EventType.NavigationError:
      nav.outcome = 'failed';
      nav.reason = errorText(
        read(() => event['error'], undefined),
        navSecrets.get(nav),
      );
      nav.endedAt = now;
      return true;
    case EventType.NavigationSkipped: {
      const code = read(() => event['code'] as number | undefined, undefined);
      nav.code = code === undefined ? undefined : (SKIP_CODES[code] ?? String(code));
      nav.outcome = 'skipped';
      nav.reason = errorText(String(event['reason'] ?? ''));
      nav.endedAt = now;
      return true;
    }
    default:
      return false;
  }
}

function urlOf(router: AnyRecord, tree: unknown): string | undefined {
  if (!tree) return undefined;
  return read(() => String(router['serializeUrl'](tree)), undefined);
}

/**
 * The navigation that finished before the overlay subscribed, from
 * `router.lastSuccessfulNavigation` (a signal since Angular 20, a property
 * before). It has no timing or guard details.
 */
export function lastNavigationOf(router: AnyRecord, now: number): NavigationRecord | null {
  const raw = read(() => router['lastSuccessfulNavigation'], null);
  const last = read(() => (typeof raw === 'function' ? raw() : raw) as AnyRecord | null, null);
  if (!last) return null;
  const rawUrl = urlOf(router, last['extractedUrl']) ?? urlOf(router, last['initialUrl']);
  if (!rawUrl) return null;
  const secrets = secretParamsOf(
    read(() => router['routerState']['snapshot']['root'] as AnyRecord, null),
  );
  const url = redactUrl(rawUrl, secrets);
  return {
    id: read(() => Number(last['id']), 0),
    url,
    finalUrl: redactUrl(urlOf(router, last['finalUrl']) ?? rawUrl, secrets),
    trigger: read(() => String(last['trigger'] ?? 'imperative'), 'imperative'),
    startedAt: now,
    outcome: 'succeeded',
    beforeConnect: true,
  };
}

/**
 * The navigation in flight when the overlay subscribed, from
 * `router.currentNavigation()` (Angular 20+) or `getCurrentNavigation()`, so
 * its remaining events are not dropped.
 */
export function currentNavigationOf(router: AnyRecord, now: number): NavigationRecord | null {
  const current = read(
    () =>
      (typeof router['currentNavigation'] === 'function'
        ? router['currentNavigation']()
        : router['getCurrentNavigation']?.()) as AnyRecord | null,
    null,
  );
  if (!current) return null;
  const url = urlOf(router, current['extractedUrl']) ?? urlOf(router, current['initialUrl']);
  if (!url) return null;
  return {
    id: read(() => Number(current['id']), 0),
    url: redactUrl(url),
    trigger: read(() => String(current['trigger'] ?? 'imperative'), 'imperative'),
    startedAt: now,
    outcome: 'pending',
    beforeConnect: true,
  };
}

/**
 * Subscribes to `router.events`. `onChange` runs after each event that
 * changed a navigation. Returns the unsubscribe function, or null when the
 * router has no subscribable events.
 */
export function watchRouter(
  router: AnyRecord,
  navigations: NavigationRecord[],
  onChange: () => void,
  max = 50,
): (() => void) | null {
  const events = read(() => router['events'] as AnyRecord, null);
  if (!events || typeof events['subscribe'] !== 'function') return null;
  if (!navigations.length) {
    const last = lastNavigationOf(router, Date.now());
    if (last) {
      if (last.id > 1) last.earlier = last.id - 1;
      navigations.push(last);
    }
    const current = currentNavigationOf(router, Date.now());
    if (current && current.id !== last?.id) navigations.push(current);
  }
  const subscription = read(
    () =>
      events['subscribe']((event: AnyRecord) => {
        if (!applyRouterEvent(navigations, event, Date.now(), router)) return;
        if (navigations.length > max) navigations.splice(0, navigations.length - max);
        onChange();
      }) as { unsubscribe(): void },
    null,
  );
  return subscription ? () => subscription.unsubscribe() : null;
}
