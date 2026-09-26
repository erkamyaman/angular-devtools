import type { ActiveRoute, NavigationRecord, RouterSnapshot } from '../router.ts';
import { code, UNTRUSTED } from './forms-tools.ts';

export interface RouterReport {
  pageId: string;
  snapshot: RouterSnapshot | null;
  navigations: NavigationRecord[];
}

export interface RouterPage extends RouterReport {
  reportedAt: number;
  changedAt: number;
}

export interface RouterState {
  pages: RouterPage[];
}

type Pages = Map<string, RouterPage>;

const STALE_AFTER_MS = 10_000;
const PAGE_EXPIRES_MS = 150_000;
const MAX_NAVIGATIONS = 50;
const MAX_PAGES = 20;
const MAX_RESOURCE_CHARS = 100_000;
const MAX_TEXT = 4_000;
const MAX_TOOL_CHARS = 20_000;
const MAX_ROUTES = 1_000;
const MAX_CHILDREN = 200;
const MAX_ROUTE_DEPTH = 13;
const OUTCOMES = ['pending', 'succeeded', 'redirected', 'cancelled', 'failed', 'skipped'];

function isRecord(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === 'string' && value.length <= max;
}

function optional(value: unknown, check: (v: unknown) => boolean): boolean {
  return value === undefined || check(value);
}

function isNames(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 100 && value.every((v) => isText(v, 300));
}

function isNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPlain(value: unknown, budget: { n: number }, depth = 0): boolean {
  if (--budget.n < 0 || depth > 8) return false;
  if (value === null || typeof value === 'boolean' || isNumber(value)) return true;
  if (typeof value === 'string') return value.length <= MAX_TEXT;
  if (Array.isArray(value)) return value.every((item) => isPlain(item, budget, depth + 1));
  return (
    isRecord(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.values(value).every((item) => isPlain(item, budget, depth + 1))
  );
}

function isRoute(value: unknown, budget: { n: number }, depth = 0): boolean {
  if (!isRecord(value) || depth >= MAX_ROUTE_DEPTH || ++budget.n > MAX_ROUTES) return false;
  const route: Partial<ActiveRoute> = value;
  return (
    isText(route.path) &&
    isText(route.url) &&
    isText(route.outlet, 300) &&
    optional(route.component, (v) => isText(v, 300)) &&
    optional(route.title, isText) &&
    optional(route.lazy, (v) => typeof v === 'boolean') &&
    optional(route.resolvers, isNames) &&
    optional(route.guards, (v) => isRecord(v) && Object.values(v).every(isNames)) &&
    isRecord(route.params) &&
    isPlain(route.params, { n: 2_000 }) &&
    isRecord(route.data) &&
    isPlain(route.data, { n: 2_000 }) &&
    Array.isArray(route.children) &&
    route.children.length <= MAX_CHILDREN &&
    route.children.every((child) => isRoute(child, budget, depth + 1))
  );
}

function isSnapshot(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  const snapshot: Partial<RouterSnapshot> = value;
  return (
    isText(snapshot.url) &&
    isRecord(snapshot.queryParams) &&
    isPlain(snapshot.queryParams, { n: 2_000 }) &&
    (snapshot.fragment === null || isText(snapshot.fragment)) &&
    isRoute(snapshot.root, { n: 0 })
  );
}

function isNavigation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const nav: Partial<NavigationRecord> = value;
  return (
    isNumber(nav.id) &&
    isText(nav.url) &&
    isText(nav.trigger, 50) &&
    isNumber(nav.startedAt) &&
    OUTCOMES.includes(nav.outcome as string) &&
    optional(nav.endedAt, isNumber) &&
    optional(nav.finalUrl, isText) &&
    optional(nav.reason, isText) &&
    optional(nav.code, (v) => isText(v, 100)) &&
    optional(nav.beforeConnect, (v) => typeof v === 'boolean') &&
    optional(nav.earlier, isNumber) &&
    optional(nav.lazyLoaded, isNames) &&
    optional(
      nav.guards,
      (v) =>
        isRecord(v) &&
        isNames((v as { names?: unknown }).names) &&
        optional((v as { passed?: unknown }).passed, (p) => typeof p === 'boolean') &&
        optional((v as { ms?: unknown }).ms, isNumber),
    ) &&
    optional(
      nav.resolvers,
      (v) =>
        isRecord(v) &&
        isNames((v as { names?: unknown }).names) &&
        optional((v as { ms?: unknown }).ms, isNumber),
    )
  );
}

export function isRouterReport(value: unknown): value is RouterReport {
  if (!isRecord(value)) return false;
  const report: Partial<RouterReport> = value;
  return (
    isText(report.pageId, 50) &&
    isSnapshot(report.snapshot) &&
    Array.isArray(report.navigations) &&
    report.navigations.length <= MAX_NAVIGATIONS &&
    report.navigations.every(isNavigation)
  );
}

function stateOf(pages: Pages): RouterState {
  return {
    pages: Array.from(pages.values()).sort(
      (a, b) => b.changedAt - a.changedAt || b.reportedAt - a.reportedAt,
    ),
  };
}

function contentOf(report: RouterReport): string {
  return JSON.stringify([report.snapshot, report.navigations]);
}

export function currentRouter(pages: Pages): RouterState {
  return stateOf(pages);
}

export function expireRouterPages(pages: Pages, now = Date.now()): RouterState | null {
  let expired = false;
  for (const [id, page] of pages) {
    if (now - page.reportedAt > PAGE_EXPIRES_MS) {
      pages.delete(id);
      expired = true;
    }
  }
  return expired ? stateOf(pages) : null;
}

export function mergeRouterReport(pages: Pages, report: RouterReport, now = Date.now()) {
  const previous = pages.get(report.pageId);
  const changedAt =
    previous && contentOf(previous) === contentOf(report) ? previous.changedAt : now;
  pages.set(report.pageId, { ...report, reportedAt: now, changedAt });
  expireRouterPages(pages, now);
  if (pages.size > MAX_PAGES) {
    const oldest = [...pages.values()].sort((a, b) => a.reportedAt - b.reportedAt);
    for (const page of oldest.slice(0, pages.size - MAX_PAGES)) pages.delete(page.pageId);
  }
  return stateOf(pages);
}

function freshness(page: RouterPage, now: number): string {
  const age = now - page.reportedAt;
  return age > STALE_AFTER_MS
    ? `\n\n_Last reported ${Math.round(age / 1000)}s ago. The page may have closed or navigated away._`
    : '';
}

function pickPage(state: RouterState, pageId?: string): RouterPage | undefined {
  if (pageId) return state.pages.find((p) => p.pageId === pageId);
  return state.pages.find((p) => p.snapshot) ?? state.pages[0];
}

function otherPages(state: RouterState, page: RouterPage): string {
  const others = state.pages.filter((p) => p !== page);
  if (!others.length) return '';
  const list = others.map((p) => `${code(p.pageId)} (${code(p.snapshot?.url ?? '?')})`).join(', ');
  return `\n\n${others.length} other page(s) report too: ${list}. Pass \`page\` to see one.`;
}

function json(value: unknown): string {
  const text = JSON.stringify(value);
  return code(text.length > 500 ? `${text.slice(0, 500)}…` : text);
}

function capped(text: string): string {
  return text.length > MAX_TOOL_CHARS
    ? `${text.slice(0, MAX_TOOL_CHARS)}… (truncated; pass \`page\`, \`url\` or a smaller \`limit\`)`
    : text;
}

function list(names: string[]): string {
  return names.map(code).join(', ');
}

function routeLines(route: ActiveRoute, depth: number, out: string[]) {
  const pad = '  '.repeat(depth);
  const name = route.path === '' && depth === 0 ? '(root)' : `/${route.path}`;
  const parts = [code(name)];
  if (route.component) parts.push(`→ ${code(route.component)}`);
  if (route.outlet !== 'primary') parts.push(`(outlet ${code(route.outlet)})`);
  if (route.lazy) parts.push('(lazy)');
  out.push(`${pad}- ${parts.join(' ')}`);
  if (Object.keys(route.params).length) out.push(`${pad}  - params: ${json(route.params)}`);
  if (Object.keys(route.data).length) out.push(`${pad}  - data: ${json(route.data)}`);
  if (route.title) out.push(`${pad}  - title: ${code(route.title)}`);
  for (const [kind, names] of Object.entries(route.guards ?? {})) {
    out.push(`${pad}  - ${kind}: ${list(names)}`);
  }
  if (route.resolvers) out.push(`${pad}  - resolve: ${list(route.resolvers)}`);
  for (const child of route.children) routeLines(child, depth + 1, out);
}

export function inspectRouteText(
  state: RouterState,
  args: { page?: string },
  now = Date.now(),
): string {
  const page = pickPage(state, args.page);
  if (!page) return `No page ${code(args.page ?? '')} is reporting router state.`;
  if (!page.snapshot) {
    return `${UNTRUSTED}\n\nPage ${code(page.pageId)} reports no Router. The app may not use the Angular router, or it is not a development build.${otherPages(state, page)}${freshness(page, now)}`;
  }
  const { snapshot } = page;
  const lines = [`**URL** ${code(snapshot.url)}`];
  if (Object.keys(snapshot.queryParams).length) {
    lines.push(`**Query params** ${json(snapshot.queryParams)}`);
  }
  if (snapshot.fragment) lines.push(`**Fragment** ${code(snapshot.fragment)}`);
  lines.push('', '**Active routes**');
  routeLines(snapshot.root, 0, lines);
  return capped(
    `${UNTRUSTED}\n\n${lines.join('\n')}${otherPages(state, page)}${freshness(page, now)}`,
  );
}

export function guardResult(nav: NavigationRecord): string {
  const passed = nav.guards?.passed;
  if (passed === true) return 'passed';
  if (passed === false) return nav.outcome === 'redirected' ? 'redirected' : 'blocked';
  return nav.outcome === 'pending' ? 'still running' : `did not finish, navigation ${nav.outcome}`;
}

function describeNavigation(nav: NavigationRecord): string {
  const took =
    nav.beforeConnect && nav.endedAt === undefined && nav.outcome !== 'pending'
      ? ' (before DevTools connected, no details)'
      : nav.beforeConnect
        ? ' (started before DevTools connected)'
        : nav.endedAt === undefined
          ? ''
          : ` in ${nav.endedAt - nav.startedAt}ms`;
  const target =
    nav.finalUrl && nav.finalUrl !== nav.url ? ` (redirected to ${code(nav.finalUrl)})` : '';
  const lines = [
    `- #${nav.id} ${code(nav.url)}${target}: **${nav.outcome}**${took}, trigger ${code(nav.trigger)}`,
  ];
  if (nav.earlier) {
    lines.push(`  - ${nav.earlier} earlier navigation(s) happened before DevTools connected`);
  }
  if (nav.guards && (nav.guards.names.length || nav.guards.passed === false)) {
    const names = nav.guards.names.length ? list(nav.guards.names) : 'none on the route';
    const result = guardResult(nav);
    const ms = nav.guards.ms === undefined ? '' : ` (${nav.guards.ms}ms)`;
    lines.push(`  - guards: ${names}: ${result}${ms}`);
  }
  if (nav.resolvers?.names.length) {
    const ms =
      nav.resolvers.ms !== undefined
        ? ` (${nav.resolvers.ms}ms)`
        : nav.outcome === 'pending'
          ? ' (still running)'
          : ` (did not finish, navigation ${nav.outcome})`;
    lines.push(`  - resolvers: ${list(nav.resolvers.names)}${ms}`);
  }
  if (nav.lazyLoaded?.length) lines.push(`  - lazy loaded: ${list(nav.lazyLoaded)}`);
  if (nav.code || nav.reason) {
    const why = [nav.code, nav.reason].filter(Boolean).join(': ');
    lines.push(`  - reason: ${code(why)}`);
  }
  return lines.join('\n');
}

export function explainNavigationText(
  state: RouterState,
  args: { page?: string; url?: string; limit?: number },
  now = Date.now(),
): string {
  const page = pickPage(state, args.page);
  if (!page) return `No page ${code(args.page ?? '')} is reporting router state.`;
  const requested = Number.isFinite(args.limit) ? Math.floor(args.limit as number) : 5;
  const limit = Math.max(1, Math.min(requested, MAX_NAVIGATIONS));
  const needle = args.url?.toLowerCase();
  const matching = page.navigations.filter(
    (nav) =>
      !needle ||
      nav.url.toLowerCase().includes(needle) ||
      !!nav.finalUrl?.toLowerCase().includes(needle),
  );
  if (!matching.length) {
    return needle
      ? `No recent navigation matches ${code(args.url ?? '')}.${otherPages(state, page)}${freshness(page, now)}`
      : `No navigations recorded since DevTools connected on page ${code(page.pageId)}; earlier ones are not visible.${otherPages(state, page)}${freshness(page, now)}`;
  }
  const recent = matching.slice(-limit).reverse();
  const header = `Most recent ${recent.length} of ${matching.length} navigation(s), newest first. Guards lists the candidates: canDeactivate guards of the page being left (marked "leaving") and canActivate/canActivateChild guards of the target. The router reports one result for all of them, not which one blocked, and skips guards of routes that did not change.`;
  return capped(
    `${UNTRUSTED}\n\n${header}\n\n${recent.map(describeNavigation).join('\n')}${otherPages(state, page)}${freshness(page, now)}`,
  );
}

function slim(nav: NavigationRecord) {
  const clipUrl = (url?: string) => (url && url.length > 300 ? `${url.slice(0, 300)}…` : url);
  return {
    id: nav.id,
    url: clipUrl(nav.url),
    finalUrl: clipUrl(nav.finalUrl),
    outcome: nav.outcome,
    code: nav.code,
    startedAt: nav.startedAt,
    endedAt: nav.endedAt,
  };
}

export function routerResourceText(state: RouterState): string {
  const json = JSON.stringify(state);
  if (json.length <= MAX_RESOURCE_CHARS) return json;
  const out = {
    truncated: true,
    note: 'The router state is too large for this resource. Use inspect-route and explain-navigation instead.',
    pages: [] as {
      pageId: string;
      url: string | null;
      reportedAt: number;
      navigations: ReturnType<typeof slim>[];
    }[],
  };
  let size = JSON.stringify(out).length;
  for (const page of state.pages) {
    const url = page.snapshot?.url ?? null;
    const entry = {
      pageId: page.pageId,
      url: url && url.length > 300 ? `${url.slice(0, 300)}…` : url,
      reportedAt: page.reportedAt,
      navigations: [] as ReturnType<typeof slim>[],
    };
    size += JSON.stringify(entry).length + 1;
    if (size > MAX_RESOURCE_CHARS) break;
    out.pages.push(entry);
    for (const nav of page.navigations.slice(-10).reverse()) {
      const item = slim(nav);
      size += JSON.stringify(item).length + 1;
      if (size > MAX_RESOURCE_CHARS) return JSON.stringify(out);
      entry.navigations.push(item);
    }
  }
  return JSON.stringify(out);
}
