# Changelog

All notable changes to `@santoshyadavdev/ng-devtools` are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The Chrome extension has its own version in `extension/manifest.json`.

## 0.0.6 - 2026-09-30

### Upgrade notes

- **Vite plugin: tunnel hosts now need the one-time code.** When `server.allowedHosts` or `allowedOrigins` allows a host other than `localhost` or a loopback address (or `allowedHosts: true`), the devtools ask for the one-time code printed in the terminal. Pass `auth: true` to always ask, or `auth: false` to never ask. Don't pass `auth: false` while a tunnel is allowed. ([#52](https://github.com/santoshyadavdev/angular-devtools/pull/52))
- **MCP HTTP route needs a bearer token when the one-time code is on.** This is the Express hub by default, and the Vite plugin when its code is on. The hub prints a token at startup, or set `NG_DEVTOOLS_MCP_TOKEN` to choose one. Requests without `Authorization: Bearer <token>` get `401`. Loopback setups without the code and the stdio `mcp` command are unaffected. ([#57](https://github.com/santoshyadavdev/angular-devtools/pull/57))
- **Express hub accepts `chrome-extension://` origins by default.** Other sites are still refused. If you pass your own `allowedOrigins` list, it replaces the extension default, so add `chrome-extension://<id>` to it to keep using the extension. ([#53](https://github.com/santoshyadavdev/angular-devtools/pull/53))
- **The overlay refreshes on change detection.** On Angular 20 and later, the overlay refreshes about 250 ms after change detection, with a 4 s heartbeat, instead of polling every 3 s. Older versions keep the 3 s poll. ([#58](https://github.com/santoshyadavdev/angular-devtools/pull/58))
- **One overlay per page.** `initOverlay()` now replaces an overlay that is already running, including the auto-started one. ([#55](https://github.com/santoshyadavdev/angular-devtools/pull/55))

### Security fixes

- Vite plugin: turn on the one-time code whenever a non-loopback host or origin is allowed, and add an `auth` option to override it. A tunnel client runs on your machine, so the loopback check alone let anyone with the tunnel URL read devtools data. ([#52](https://github.com/santoshyadavdev/angular-devtools/pull/52))
- Express hub: require a bearer token on the MCP HTTP route when the one-time code is on, from `NG_DEVTOOLS_MCP_TOKEN` or one printed at startup. ([#57](https://github.com/santoshyadavdev/angular-devtools/pull/57))
- Express hub: accept the Chrome extension panel's `chrome-extension://` origin by default and keep refusing other sites, so the extension works without turning the origin check off. ([#53](https://github.com/santoshyadavdev/angular-devtools/pull/53))

### Bug fixes

- Router: quick query or fragment updates on the same path, such as a search box or a filter toggle, are no longer reported as a navigation loop. Redirect loops on one path are still caught.

### Features

- Configuration: one `NgDevtoolsConfig` for `initNgDevtoolsHub()`, the `ngDevtools()` Vite plugin and `createNgDevtools()`. Turn inspectors off, make the agent read-only or hide tools, block panel and agent write actions, add redaction `secretNames` and change limits. The types are exported from the new `@santoshyadavdev/ng-devtools/config` entry point, and the Dashboard shows the active config. ([#56](https://github.com/santoshyadavdev/angular-devtools/pull/56))
- Router: detect redirect loops, code-driven navigation loops and `redirectTo` cycles in the route config. They show in the navigation timeline, `explain-navigation`, `export-navigation` and the Lint tab. ([#54](https://github.com/santoshyadavdev/angular-devtools/pull/54))
- Overlay: add `disposeOverlay()`, which stops the running overlay (including the auto-started one), closes its connection and removes the floating button. ([#55](https://github.com/santoshyadavdev/angular-devtools/pull/55))
- Overlay: refresh after change detection on Angular 20 and later instead of polling, with the 3 s poll kept as a fallback for older versions. `disposeOverlay()` also removes the change detection hook. ([#58](https://github.com/santoshyadavdev/angular-devtools/pull/58))
- Chrome extension: on hosts other than loopback, the panel waits for you to click **Allow access** and grants only that host. Selecting an element in the Elements panel selects its component while the Components tab is open. Loopback host permissions now cover `*.localhost` subdomains and `[::1]`. ([#50](https://github.com/santoshyadavdev/angular-devtools/pull/50))
- Components: the source scan reports each component's change detection strategy (`OnPush`, `Eager` or `unknown`), taking Angular 22's implicit `OnPush` default into account. The components tree and the component list returned to agents show it. ([#45](https://github.com/santoshyadavdev/angular-devtools/pull/45))

### Documentation

- Add the documentation site in `apps/docs`, including Getting started, Inspectors, Agent tools, Security, Configuration and Contributing pages. ([#49](https://github.com/santoshyadavdev/angular-devtools/pull/49))
- Add contributor guidelines, agent skills, warn-only commit message and docs checks, git hooks, issue forms, a PR labeler, release notes by label, `SECURITY.md` and a Code of Conduct. ([#59](https://github.com/santoshyadavdev/angular-devtools/pull/59))
