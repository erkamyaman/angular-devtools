# Changelog

All notable changes to `@santoshyadavdev/ng-devtools` are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The Chrome extension has its own version in `extension/manifest.json`.

## 0.0.6 - 2026-10-01

### Upgrade notes

- **`actions.router: false` also blocks Probe in app.** Probe runs your app's `canMatch` guards, so it now counts as a router write for the panel and for agents. **Record each guard and resolver** and **Read lazy** stay on, and agents keep `instrument` and `resolve-lazy` through the `navigate` tool. ([#194](https://github.com/santoshyadavdev/angular-devtools/pull/194))
- **Vite plugin: tunnel hosts now need the one-time code.** When `server.allowedHosts` or `allowedOrigins` allows a host other than `localhost` or a loopback address (or `allowedHosts: true`), the devtools ask for the one-time code printed in the terminal. Pass `auth: true` to always ask, or `auth: false` to never ask. Don't pass `auth: false` while a tunnel is allowed. ([#52](https://github.com/santoshyadavdev/angular-devtools/pull/52))
- **MCP HTTP route needs a bearer token when the one-time code is on.** This is the Express hub by default, and the Vite plugin when its code is on. The hub prints a token at startup, or set `NG_DEVTOOLS_MCP_TOKEN` to choose one. Requests without `Authorization: Bearer <token>` get `401`. Loopback setups without the code and the stdio `mcp` command are unaffected. ([#57](https://github.com/santoshyadavdev/angular-devtools/pull/57))
- **Express hub accepts `chrome-extension://` origins by default.** Other sites are still refused. If you pass your own `allowedOrigins` list, it replaces the extension default, so add `chrome-extension://<id>` to it to keep using the extension. ([#53](https://github.com/santoshyadavdev/angular-devtools/pull/53))
- **The overlay refreshes on change detection.** On Angular 20 and later, the overlay refreshes about 250 ms after change detection, with a 4 s heartbeat, instead of polling every 3 s. Older versions keep the 3 s poll. ([#58](https://github.com/santoshyadavdev/angular-devtools/pull/58))
- **One overlay per page.** `initOverlay()` now replaces an overlay that is already running, including the auto-started one. ([#55](https://github.com/santoshyadavdev/angular-devtools/pull/55))
- **`ng-devtools build` checks the output folder.** It refuses the working folder and its parents, and without `--force` it also refuses a file or a non-empty folder that is not a previous report. ([#184](https://github.com/santoshyadavdev/angular-devtools/pull/184), [#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))
- **One Express hub per base path.** `initNgDevtoolsHub()` keeps its token across `ng serve` rebuilds and closes the previous hub, so the MCP token no longer changes on every rebuild. ([#184](https://github.com/santoshyadavdev/angular-devtools/pull/184))
- **The Chrome extension waits for a JSON answer.** The popup and panel count a server only when `__connection.json` answers with JSON, and show **No devtools server found** otherwise. ([#184](https://github.com/santoshyadavdev/angular-devtools/pull/184))

### Security fixes

- Vite plugin: turn on the one-time code whenever a non-loopback host or origin is allowed, and add an `auth` option to override it. A tunnel client runs on your machine, so the loopback check alone let anyone with the tunnel URL read devtools data. ([#52](https://github.com/santoshyadavdev/angular-devtools/pull/52))
- Express hub: require a bearer token on the MCP HTTP route when the one-time code is on, from `NG_DEVTOOLS_MCP_TOKEN` or one printed at startup. ([#57](https://github.com/santoshyadavdev/angular-devtools/pull/57))
- Express hub: accept the Chrome extension panel's `chrome-extension://` origin by default and keep refusing other sites, so the extension works without turning the origin check off. ([#53](https://github.com/santoshyadavdev/angular-devtools/pull/53))
- Vite plugin: check the loopback address and origin before any hub WebSocket upgrade, including a `base` without a leading slash, so LAN clients can't open the hub socket. ([#184](https://github.com/santoshyadavdev/angular-devtools/pull/184))
- Redact values in the Pipes inspector, cut or deeply nested Analog bodies, HTTP call URLs, page URLs, error messages and component page titles, using the same secret names everywhere. ([#184](https://github.com/santoshyadavdev/angular-devtools/pull/184), [#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))
- Vite plugin: normalize `allowedOrigins` entries so a trailing slash, path or uppercase host still matches. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))

### Bug fixes

- Chrome extension: when the server requires the one-time code, the panel now asks for it and saves a token per server, instead of staying on "Not authorized". This affected Vite apps opened through a local hostname or tunnel, and the Express hub.
- Router: quick query or fragment updates on the same path, such as a search box or a filter toggle, are no longer reported as a navigation loop. Redirect loops on one path are still caught.
- Fix the 22 P1 issues from the September sweep: wrong signal history, NgRx restore freezing the app, forms `[ngValue]` selects, Router tab blank past 200 routes, HTTP fault rules outliving their config, Analog in Nx workspaces, Vite restarts and HTTPS, hub restarts, the static report and more. ([#184](https://github.com/santoshyadavdev/angular-devtools/pull/184))
- Fix 68 P2 issues: accessibility in the forms, HTTP, injector, NgRx and signals panels, form markers across pages, provider scanning, injector tree limits and shadow DOM, NgRx changes past 100 items, pages dropping out in background tabs, the transfer cache match, pipe scans and stale checks, Analog render modes and redaction, and the CLI version and flags. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))
- Fix 21 P3 issues: HTTP mocks for `blob` and `arraybuffer`, host paths in lists, highlights clearing while hovered, truncation notes, Router form states and replay of redacted URLs, the signal write hook notice, and closed tabs in the Signals inspector. ([#186](https://github.com/santoshyadavdev/angular-devtools/pull/186))

### Features

- Configuration: one `NgDevtoolsConfig` for `initNgDevtoolsHub()`, the `ngDevtools()` Vite plugin and `createNgDevtools()`. Turn inspectors off, make the agent read-only or hide tools, block panel and agent write actions, add redaction `secretNames` and change limits. The types are exported from the new `@santoshyadavdev/ng-devtools/config` entry point, and the Dashboard shows the active config. ([#56](https://github.com/santoshyadavdev/angular-devtools/pull/56))
- Router: detect redirect loops, code-driven navigation loops and `redirectTo` cycles in the route config. They show in the navigation timeline, `explain-navigation`, `export-navigation` and the Lint tab. ([#54](https://github.com/santoshyadavdev/angular-devtools/pull/54))
- Overlay: add `disposeOverlay()`, which stops the running overlay (including the auto-started one), closes its connection and removes the floating button. ([#55](https://github.com/santoshyadavdev/angular-devtools/pull/55))
- Overlay: refresh after change detection on Angular 20 and later instead of polling, with the 3 s poll kept as a fallback for older versions. `disposeOverlay()` also removes the change detection hook. ([#58](https://github.com/santoshyadavdev/angular-devtools/pull/58))
- Chrome extension: on hosts other than loopback, the panel waits for you to click **Allow access** and grants only that host. Selecting an element in the Elements panel selects its component while the Components tab is open. Loopback host permissions now cover `*.localhost` subdomains and `[::1]`. ([#50](https://github.com/santoshyadavdev/angular-devtools/pull/50))
- Components: the source scan reports each component's change detection strategy (`OnPush`, `Eager` or `unknown`), taking Angular 22's implicit `OnPush` default into account. The components tree and the component list returned to agents show it. ([#45](https://github.com/santoshyadavdev/angular-devtools/pull/45))
- NgRx: action origins, restore state that says when Store DevTools no longer holds an action, dispatch from the panel and the `dispatch-ngrx-action` agent tool, and a demo page for `@ngrx/store`. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185), [#186](https://github.com/santoshyadavdev/angular-devtools/pull/186))
- Components: pick an element on the page, see the component's own properties, `@defer` blocks, and record change detection cycles per component. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))
- Signals: `resource` and `httpResource` entries, effects and signals in environment injectors, and links to dependencies and consumers. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185), [#186](https://github.com/santoshyadavdev/angular-devtools/pull/186))
- Injectors: what each service injects, the runtime change detection mode (zoneless, zone.js or unused), and `inspect-providers` filters by selector or token. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185), [#186](https://github.com/santoshyadavdev/angular-devtools/pull/186))
- Router: outlet data per outlet. Agents: `navigate` waits for app stability. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185), [#186](https://github.com/santoshyadavdev/angular-devtools/pull/186))
- Configuration: warn at startup about unknown keys, wrong types and clamped limits. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))

### Documentation

- Add the documentation site in `apps/docs`, including Getting started, Inspectors, Agent tools, Security, Configuration and Contributing pages. ([#49](https://github.com/santoshyadavdev/angular-devtools/pull/49))
- Add contributor guidelines, agent skills, warn-only commit message and docs checks, git hooks, issue forms, a PR labeler, release notes by label, `SECURITY.md` and a Code of Conduct. ([#59](https://github.com/santoshyadavdev/angular-devtools/pull/59))
- Add a page for mounting the hub in Hono, h3 and Fastify, and update every inspector page to match the fixes above. ([#186](https://github.com/santoshyadavdev/angular-devtools/pull/186))
- CI runs panel tests and an automated axe check of every panel view. ([#185](https://github.com/santoshyadavdev/angular-devtools/pull/185))
