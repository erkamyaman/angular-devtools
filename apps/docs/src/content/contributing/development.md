---
title: Development setup
description: Set up the repository, run the devtools UI and the demo app, and run the checks.
---

# Development setup

## Prerequisites

- Node.js 24 or later
- pnpm 10 or later

## Setup

```bash
git clone https://github.com/santoshyadavdev/angular-devtools.git
cd angular-devtools
pnpm install
```

## Project structure

```text
app/                          # Devtools UI SPA (Angular + Vite)
  src/app.ts                  # Root component with tab navigation
  src/pages/                  # One component per tab
  vite.config.ts              # Vite config with Analog Angular plugin
packages/
  ng-devtools/                # Publishable npm package
    src/devframe.ts           # defineDevframe(): tool definition
    src/overlay.ts            # Client script running in user's page
    src/rpc/                  # Node-side RPC functions
extension/                    # Chrome DevTools extension
examples/analog/              # Analog demo app
apps/docs/                    # This documentation site
src/                          # Angular host app (demo/playground)
```

The workspace uses Nx. `pnpm-workspace.yaml` lists `packages/*`, `examples/*` and `apps/*`.

## Development

```bash
# Install dependencies
pnpm install

# Dev server for the devtools UI (with live RPC)
pnpm devtools:dev

# Build the devtools UI SPA
pnpm devtools:build

# Build the publishable package (library + UI in dist/)
pnpm devtools:build-pkg

# Run the Angular host app (builds the package first, includes in-page devtools popup)
pnpm start
```

| Command                                                                                  | Port | Notes                                                                                       |
| ---------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------- |
| `pnpm start`                                                                             | 4200 | `ng serve` with SSR and hot reload. The popup and live data work without a separate server. |
| `pnpm build --configuration development && node dist/angular-devtools/server/server.mjs` | 4000 | The demo app as an SSR server.                                                              |
| `pnpm devtools:dev`                                                                      | 5173 | The devtools UI with hot reload. It needs the SSR server running for live data.             |

The SSR server serves the UI built into `packages/ng-devtools/dist/public`. Run `pnpm devtools:build-pkg` to refresh it after you change `app/`.

## Checks

```bash
pnpm test            # host app
pnpm test:devtools   # devtools package
pnpm typecheck       # host app + specs, devtools UI, devtools package + its tests
pnpm format:check
```

CI runs these, then `nx affected -t test build`, builds the Chrome extension and checks that the committed `extension/ui` is current.

## Making changes

### Adding a new RPC function

1. Create the function in `packages/ng-devtools/src/rpc/`.
2. Register it in `packages/ng-devtools/src/devframe.ts`.
3. Call it from the UI in `app/src/pages/`.

### Adding a new tab

1. Create a component in `app/src/pages/`.
2. Import and add it to `app/src/app.ts` (imports array, tabs array, template switch).
3. Add a card to `app/src/pages/dashboard.ts`.

### Adding agent tools

Add `agent: { description }` to any RPC function, or use `ctx.agent.registerTool()` in the devframe setup.

## The docs site

This site lives in `apps/docs`. It is built with [NgMd](https://github.com/erkamyaman/ngmd) on *Analog.

```bash
pnpm docs:dev     # dev server
pnpm docs:build   # production build
```

Pages are markdown files under `apps/docs/src/content`. The sidebar comes from `apps/docs/src/ngmd.config.ts`. The build fails on broken internal links, so run `pnpm docs:build` before you open a PR.
