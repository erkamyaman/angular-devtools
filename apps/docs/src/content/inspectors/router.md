---
title: Router
description: The live route, every navigation as a story, the live route config, router setup and a route lint.
---

# Router

The Routes tab and the router tools read the running app's Router, in development builds only. The Router is found through the debug helper `provideRouter()` publishes, or through the injector for `RouterModule.forRoot()` apps. Without debug utils (a production build) only navigation events are available, and the Setup view says so.

## Live router

The live section has five views:

- **Current**: the URL (and the browser URL when they differ), the navigation in flight with an Abort button, each active route with its component, params and data and where each value comes from (own, inherited, static or resolved), the route title and whether it is inherited, and the outlet tree with the inputs the router binds.
- **Navigations**: every navigation as one story: where it came from, who started it (a RouterLink, the code that called `navigate`, back/forward), extras, redirect chains and loops, a phase bar (recognize, guards, resolve, activate), guards and resolvers, lazy loads, reused components, HTTP requests, scroll, the title afterwards, router warnings, and the cancel or error reason. Turn on "Record each guard and resolver" to see each one's verdict and time (for example `authGuard returned UrlTree /login`). Replay a navigation, copy a markdown repro, or export the list as JSON.
- **Routes**: the live route config with lazy children merged in once they load and the active branch marked. Test a URL to predict which route matches it (or the nearest ones), probe it with the real matcher, navigate to any route (with its params), or read the routes of a lazy route that has not loaded.
- **Setup**: provideRouter or forRoot, effective options with set/default markers, enabled features, strategies, base href and hydration.
- **Lint**: route config mistakes (unreachable routes after `**`, a `:param` shadowing a literal, duplicate paths, empty-path redirects without `pathMatch: 'full'`, redirect cycles, deprecated class guards and `canLoad`, lazy chunks downloaded before a rejecting `canActivate`, missing or duplicate titles, param/input typos, `routerLinkActive` without `ariaCurrentWhenActive`, emails in URLs, return URLs taken from query params), each with a fix and whether Angular throws or stays silent.

Components rendered by the router show the route and outlet in the [Components tab](/inspectors/components).

## Source route config

Below the live views, the tab lists the routes declared in your source files: `*.routes.ts` and `*routing.module.ts` files, the files they lazy load, and Analog pages. It shows each path, its component or target, guards and resolvers, title and the file that declares it. Once live config is available, this table is collapsed.

## Guard verdicts

Without instrumentation, the guards listed for a navigation are candidates (the `canDeactivate` guards of the page being left and the `canActivate`/`canActivateChild` guards of the target), because the router reports one result for all of them. Instrumentation wraps each guard and resolver in the live config to record its verdict; it is off by default and undone when turned off. A navigation that finished before the devtools connected is listed without timing or guard details.

## For agents

- `ng-devtools:explain-navigation` answers "why did this navigation not work" or "why was I redirected": pass `url` or `id` to narrow it, `limit` for more than the last 5, or `perf` for the slowest navigations and preloads. NG04xxx and related errors are explained.
- `ng-devtools:inspect-route` describes the route the page is on right now; pass `selector` (a component class, tag or link text) to see which route a component was rendered for or whether a link counts as active.
- `ng-devtools:list-routes` lists the live config with source files and example URLs; `match` predicts which route a URL hits, `audit` lists the guards that protect each page.
- `ng-devtools:lint-routes`, `ng-devtools:router-config` and `ng-devtools:export-navigation` give the lint findings, the setup and a repro.
- `ng-devtools:explain-render-mode` reads the workspace's `*.routes.server.ts` and says which render mode a URL gets.
- `ng-devtools:navigate` acts on the router: `navigate` (a relative URL, or a pattern with params), `abort`, `replay`, `probe` (runs the real matcher without navigating; it runs `canMatch` and may load lazy chunks), `instrument` and `resolve-lazy`. It only accepts same-origin relative URLs.

## Privacy

Secret-looking query, matrix and fragment values, tokens and route params are replaced with `[redacted]` in URLs, params, data and messages. See [Security](/security).
