---
title: Resources
description: Live state an agent can read as MCP resources.
---

# Resources

Resources hold the live data the connected pages reported. They are empty when no page is connected, so read them through the [HTTP endpoint](/agents/mcp-server#http) with the app open in a browser.

| Resource                     | Content                       |
| ---------------------------- | ----------------------------- |
| `ng-devtools:component-tree` | Live component hierarchy      |
| `ng-devtools:signal-graph`   | Signal dependency graph       |
| `ng-devtools:injector-tree`  | DI injector hierarchy         |
| `ng-devtools:ngrx-store`     | Live NgRx stores & change log |
| `ng-devtools:forms`          | Live forms and recent changes |
| `ng-devtools:router`         | Live route and navigations    |

Clients see each resource at a `devframe://resource/` URI with the id encoded, for example `devframe://resource/ng-devtools%3Acomponent-tree`. Each one returns JSON.

## What each resource holds

- **component-tree**: the component instances of each page (instance id, class name, host tag, directives on the host), and the details of the instance selected in the panel.
- **signal-graph**: the signal graph of each page, with nodes, producer to consumer edges, the component it belongs to, and recent value history per node.
- **injector-tree**: the injector hierarchy the page reported, with providers at each level.
- **ngrx-store**: each `@ngrx/signals` store (state, computed values, methods, the component fields that reference it) and the `@ngrx/store` state, plus the change log with a state diff per entry.
- **forms**: every form with each field's value, status, touched, dirty and errors, plus recent changes. When the data is too large, the resource returns a summary and points to `inspect-forms`.
- **router**: the active route tree and recent navigations of each page. When the data is too large, the resource returns a summary and points to `inspect-route`, `explain-navigation` and `list-routes`.

## Shared state

Every shared-state key is also listed as a resource at `devframe://state/<key>`, and the `devframe_state_read` tool reads the same keys. This covers data without its own resource:

| Key                      | Content                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| `ng-devtools:http`       | The SSR & HTTP timeline, fault rules, hydration data and TransferState payload |
| `ng-devtools:pipe-usage` | Live pipe instances and recorded calls                                         |
| `ng-devtools:analog`     | Analog page data and the server call log                                       |
| `ng-devtools:routes`     | Routes from the source scan                                                    |
