import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import type { DevframeRpcClient } from 'devframe/client';

interface ActiveRoute {
  path: string;
  url: string;
  outlet: string;
  component?: string;
  title?: string;
  params: Record<string, unknown>;
  data: Record<string, unknown>;
  guards?: Record<string, string[]>;
  resolvers?: string[];
  lazy?: boolean;
  children: ActiveRoute[];
}

interface NavigationRecord {
  id: number;
  url: string;
  trigger: string;
  startedAt: number;
  endedAt?: number;
  outcome: string;
  finalUrl?: string;
  guards?: { names: string[]; passed?: boolean; ms?: number };
  resolvers?: { names: string[]; ms?: number };
  lazyLoaded?: string[];
  reason?: string;
  code?: string;
  beforeConnect?: boolean;
  earlier?: number;
}

interface RouterPage {
  pageId: string;
  reportedAt: number;
  changedAt?: number;
  snapshot: {
    url: string;
    queryParams: Record<string, unknown>;
    fragment: string | null;
    root: ActiveRoute;
  } | null;
  navigations: NavigationRecord[];
}

interface RouteRow {
  route: ActiveRoute;
  depth: number;
}

@Component({
  selector: 'app-live-route',
  imports: [JsonPipe],
  template: `
    @if (failed()) {
      <p class="muted">Could not load the live router state.</p>
    } @else if (loading()) {
      <p class="muted">Loading the live router state…</p>
    } @else if (!page()) {
      <p class="muted">No page is reporting router state yet. Open the app in a browser.</p>
    } @else {
      @if (pages().length > 1) {
        <label class="page-pick">
          Page
          <select (change)="pickPage($event)">
            @for (p of pages(); track p.pageId) {
              <option [value]="p.pageId" [selected]="p.pageId === page()?.pageId">
                {{ p.snapshot?.url ?? p.pageId }} ({{ p.pageId }})
              </option>
            }
          </select>
        </label>
      }

      <section aria-labelledby="current-route">
        <h2 id="current-route">Current route</h2>
        @if (page()?.snapshot; as snapshot) {
          <p class="url">
            <code>{{ snapshot.url }}</code>
          </p>
          <div class="table-scroll" role="region" aria-label="Active routes" tabindex="0">
            <table>
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Component</th>
                  <th scope="col">Params</th>
                  <th scope="col">Data</th>
                  <th scope="col">Guards and resolvers</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track $index) {
                  <tr>
                    <td class="path" [style.padding-left.px]="12 + row.depth * 16">
                      {{ row.depth === 0 && !row.route.path ? '(root)' : '/' + row.route.path }}
                      @if (row.route.outlet !== 'primary') {
                        <span class="tag">{{ row.route.outlet }}</span>
                      }
                      @if (row.route.lazy) {
                        <span class="tag">lazy</span>
                      }
                    </td>
                    <td>{{ row.route.component ?? '—' }}</td>
                    <td>
                      @if (hasKeys(row.route.params)) {
                        <code>{{ row.route.params | json }}</code>
                      } @else {
                        —
                      }
                    </td>
                    <td>
                      @if (hasKeys(row.route.data)) {
                        <code class="data">{{ row.route.data | json }}</code>
                      } @else {
                        —
                      }
                    </td>
                    <td>
                      @for (guard of guardList(row.route); track guard) {
                        <span class="tag">{{ guard }}</span>
                      }
                      @for (resolver of row.route.resolvers ?? []; track resolver) {
                        <span class="tag resolver">resolve {{ resolver }}</span>
                      }
                      @if (!guardList(row.route).length && !row.route.resolvers) {
                        —
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (hasKeys(snapshot.queryParams)) {
            <p class="meta">
              Query params <code>{{ snapshot.queryParams | json }}</code>
            </p>
          }
        } @else {
          <p class="muted">This page reports no Router.</p>
        }
      </section>

      <section aria-labelledby="navigations">
        <h2 id="navigations">Navigations</h2>
        @if (navigations().length) {
          <ol class="navs">
            @for (nav of navigations(); track nav.id) {
              <li>
                <div class="nav-head">
                  @if (!nav.beforeConnect) {
                    <time>{{ time(nav.startedAt) }}</time>
                  }
                  <code>{{ nav.url }}</code>
                  @if (nav.finalUrl && nav.finalUrl !== nav.url) {
                    <span aria-hidden="true">→</span>
                    <span class="visually-hidden">redirected to</span>
                    <code>{{ nav.finalUrl }}</code>
                  }
                  <span class="badge" [attr.data-outcome]="nav.outcome">{{ nav.outcome }}</span>
                  @if (nav.beforeConnect) {
                    <span class="muted">{{
                      nav.endedAt === undefined && nav.outcome !== 'pending'
                        ? 'before DevTools connected'
                        : 'started before DevTools connected'
                    }}</span>
                  } @else if (nav.endedAt !== undefined) {
                    <span class="muted">{{ nav.endedAt - nav.startedAt }}ms</span>
                  }
                </div>
                @if (nav.guards && (nav.guards.names.length || nav.guards.passed === false)) {
                  <div class="detail">
                    Guards {{ nav.guards.names.join(', ') || 'none' }}: {{ guardResult(nav) }}
                  </div>
                }
                @if (nav.resolvers?.names?.length) {
                  <div class="detail">Resolvers {{ nav.resolvers?.names?.join(', ') }}</div>
                }
                @if (nav.earlier) {
                  <div class="detail">
                    {{ nav.earlier }} earlier navigation(s) happened before DevTools connected
                  </div>
                }
                @if (nav.lazyLoaded?.length) {
                  <div class="detail">Lazy loaded {{ nav.lazyLoaded?.join(', ') }}</div>
                }
                @if (nav.reason) {
                  <div class="detail reason">
                    {{ nav.code ? nav.code + ': ' : '' }}{{ nav.reason }}
                  </div>
                }
              </li>
            }
          </ol>
        } @else {
          <p class="muted">
            No navigations since DevTools connected; earlier ones are not visible. Click a link in
            the app.
          </p>
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 20px;
      margin-bottom: 28px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 15px;
      color: #e4e4e7;
    }
    .muted {
      color: #a1a1aa;
      font-size: 13px;
    }
    .url code {
      font-size: 14px;
      color: var(--accent);
    }
    .meta {
      font-size: 13px;
      color: #d4d4d8;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .page-pick {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      color: #d4d4d8;
    }
    select {
      max-width: 100%;
      min-width: 0;
      padding: 4px 8px;
      background: #18181b;
      border: 1px solid #52525b;
      border-radius: 6px;
      color: #e4e4e7;
    }
    .table-scroll {
      overflow-x: auto;
    }
    .table-scroll:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      text-align: left;
      padding: 6px 12px;
      color: #a1a1aa;
      font-size: 12px;
      border-bottom: 1px solid #27272a;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #1e1e22;
      vertical-align: top;
    }
    .path {
      font-family: monospace;
      color: var(--accent);
      white-space: nowrap;
    }
    code {
      font-family: monospace;
      color: #d4d4d8;
      overflow-wrap: anywhere;
    }
    .data {
      display: block;
      max-width: 360px;
    }
    .tag {
      display: inline-block;
      margin: 0 4px 4px 0;
      padding: 1px 6px;
      border: 1px solid #52525b;
      border-radius: 4px;
      color: #d4d4d8;
      font-size: 11px;
      font-family: monospace;
    }
    .navs {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 6px;
    }
    .navs li {
      padding: 8px 10px;
      border: 1px solid #27272a;
      border-radius: 6px;
      font-size: 13px;
    }
    .nav-head {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    time {
      color: #a1a1aa;
      font-size: 12px;
    }
    .detail {
      margin-top: 4px;
      color: #d4d4d8;
      font-size: 12px;
    }
    .reason {
      color: #fecaca;
    }
    .badge {
      padding: 1px 6px;
      border-radius: 4px;
      background: #3f3f46;
      color: #e4e4e7;
      font-size: 11px;
      font-weight: 600;
    }
    .badge[data-outcome='succeeded'] {
      background: #14532d;
      color: #bbf7d0;
    }
    .badge[data-outcome='redirected'],
    .badge[data-outcome='pending'] {
      background: #713f12;
      color: #fef08a;
    }
    .badge[data-outcome='cancelled'],
    .badge[data-outcome='failed'] {
      background: #7f1d1d;
      color: #fecaca;
    }
  `,
})
export class LiveRoute {
  rpc = input<DevframeRpcClient | null>(null);

  readonly pages = signal<RouterPage[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly pageId = linkedSignal<RouterPage[], string | null>({
    source: this.pages,
    computation: (pages, previous) =>
      previous?.value && pages.some((p) => p.pageId === previous.value)
        ? previous.value
        : (pages[0]?.pageId ?? null),
  });

  private unsubscribe: (() => void) | null = null;
  private readonly destroyRef = inject(DestroyRef);

  readonly page = computed(() => {
    const pages = this.pages();
    return pages.find((p) => p.pageId === this.pageId()) ?? pages[0] ?? null;
  });

  readonly rows = computed(() => {
    const rows: RouteRow[] = [];
    const visit = (route: ActiveRoute, depth: number) => {
      rows.push({ route, depth });
      for (const child of route.children) visit(child, depth + 1);
    };
    const root = this.page()?.snapshot?.root;
    if (root) visit(root, 0);
    return rows;
  });

  readonly navigations = computed(() => [...(this.page()?.navigations ?? [])].reverse());

  constructor() {
    effect(() => {
      const client = this.rpc();
      if (client) this.load(client);
    });
    this.destroyRef.onDestroy(() => this.unsubscribe?.());
  }

  async load(client: DevframeRpcClient) {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const state = await client.scope('ng-devtools').rpc.sharedState('router');
      if (this.destroyRef.destroyed) return;
      const apply = (value: unknown) => {
        this.pages.set((value as { pages?: RouterPage[] } | undefined)?.pages ?? []);
      };
      apply(state.value());
      this.unsubscribe?.();
      this.unsubscribe = state.on('updated', apply);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  pickPage(event: Event) {
    this.pageId.set((event.target as HTMLSelectElement).value);
  }

  hasKeys(value: Record<string, unknown>) {
    return Object.keys(value).length > 0;
  }

  guardList(route: ActiveRoute) {
    return Object.entries(route.guards ?? {}).flatMap(([kind, names]) =>
      names.map((name) => `${kind} ${name}`),
    );
  }

  guardResult(nav: NavigationRecord) {
    const passed = nav.guards?.passed;
    if (passed === true) return 'passed';
    if (passed === false) return nav.outcome === 'redirected' ? 'redirected' : 'blocked';
    return nav.outcome === 'pending' ? 'running' : `did not finish, navigation ${nav.outcome}`;
  }

  time(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString();
  }
}
