---
title: Dashboard
description: Project metadata and a count for each inspector.
---

# Dashboard

The Dashboard is the first tab. It shows what the project is built with and how much each inspector found.

## Project

The top block shows the project name and a chip for each of:

- **Angular**: the installed Angular version.
- **TypeScript**: the installed TypeScript version.
- **SSR**: On or Off.
- **Analog**: the Analog version, in Analog apps only.

The server reads these from your workspace. Versions come from the installed packages in `node_modules`, with the range in `package.json` as a fallback. The project name comes from `angular.json`, or from `package.json` when there is none. SSR is on when the build options set `ssr` or `server`. For Analog apps, SSR follows the `ssr` option of `analog()`.

The same data is available to agents through the `ng-devtools:build-meta` tool, and it is baked into [static reports](/getting-started/cli).

## Cards

Each card counts what one inspector found. Click a card to open its tab.

| Card              | Counts                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Components        | Components in source, plus the number of directives.                                                        |
| Routes            | Navigable page paths in source, plus the number of redirects.                                               |
| Signals           | Signal nodes live on the page, plus the declarations in source. Without a page, the declarations in source. |
| Injectors         | Live injectors on the page, plus their providers. Without a page, the provider declarations in source.      |
| NgRx declarations | NgRx declarations in source, broken down by kind.                                                           |
| Pipes             | Custom pipes in source, plus the built-in pipes in use.                                                     |

A card shows **Counting…** while it loads, and **Count unavailable** when its data could not be read.

## Tips

- If the project block says **Project details unavailable**, check that the dev server is running, then reload the panel.
- The NgRx card opens the NgRx dock when the hub is mounted.
