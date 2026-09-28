---
title: Installation
description: Install the devtools package and choose where it runs.
---

# Installation

The devtools ship as one npm package, `@santoshyadavdev/ng-devtools`. It contains the Node side, the browser overlay, the in-page popup, the CLI and the built UI.

```bash group="install" name="npm" active
npm install @santoshyadavdev/ng-devtools devframe
```

```bash group="install" name="pnpm"
pnpm add @santoshyadavdev/ng-devtools devframe
```

```bash group="install" name="yarn"
yarn add @santoshyadavdev/ng-devtools devframe
```

MCP agent support (`@devframes/agentic`) is included.

## Entry points

| Import                                  | Use it for                                                       |
| --------------------------------------- | ---------------------------------------------------------------- |
| `@santoshyadavdev/ng-devtools/hub`      | `initNgDevtoolsHub()`, the server middleware for an Express app. |
| `@santoshyadavdev/ng-devtools/vite`     | The Vite plugin for Analog apps.                                 |
| `@santoshyadavdev/ng-devtools/overlay`  | The browser script that collects live data from your page.       |
| `@santoshyadavdev/ng-devtools/popup`    | The floating button and panel on your page.                      |
| `@santoshyadavdev/ng-devtools/http`     | The HTTP interceptor and hydration hooks for the SSR & HTTP tab. |
| `@santoshyadavdev/ng-devtools/devframe` | The devframe definition, for custom hosts.                       |

The package also installs an `ng-devtools` binary for the [standalone CLI](/getting-started/cli).

## Pick a setup

Every setup has two parts. A server part serves the devtools UI and receives data. A browser part, the [overlay](/getting-started/overlay), runs in your page and sends live data to the server.

- Your app uses the Angular CLI with SSR (an Express `server.ts`): follow [Angular CLI and Express](/getting-started/express).
- Your app is an Analog app: follow [Vite and Analog](/getting-started/vite).
- You only want the source scan, or a server for agents: use the [standalone CLI](/getting-started/cli).
- You want a panel inside Chrome DevTools: add the [Chrome extension](/getting-started/chrome-extension) on top of one of the setups above.
