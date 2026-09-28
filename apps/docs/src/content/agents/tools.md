---
title: Tools
description: Every agent tool the devtools expose, with its inputs.
---

# Tools

MCP clients see these with an underscore, as `ng-devtools_get-routes`. Tools marked **live** need a connected page, which means the [HTTP endpoint](/agents/mcp-server#http) with the app open in a browser. The others read your source and also work over stdio.

Most live tools take an optional `page` input to pick a browser tab. It defaults to the most recent one.

## Source scan

These tools take no inputs.

| Tool                         | Description                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ng-devtools:get-routes`     | Angular routes from your route files, with full URL path, kind (page, group, redirect or wildcard), guards, resolvers, and file and line. In Analog apps, the file routes. |
| `ng-devtools:get-components` | Components and directives from `@Component` and `@Directive` classes, with selector, kind, inputs, outputs, and file and line.                                             |
| `ng-devtools:get-signals`    | `signal()`, `computed()`, `linkedSignal()`, `effect()`, `toSignal()` and resource declarations, plus signal inputs, models and queries.                                    |
| `ng-devtools:get-providers`  | DI providers: `@Injectable` services, `inject()` calls and `providers` arrays.                                                                                             |
| `ng-devtools:get-ngrx-store` | NgRx declarations: actions, reducers, effects, selectors, features, store setup, `signalStore` (with its members), `signalState` and `signalMethod`.                       |
| `ng-devtools:get-pipes`      | Custom `@Pipe` classes, and built-in pipes in use in templates, with purity and standalone status.                                                                         |
| `ng-devtools:build-meta`     | Angular and TypeScript versions, the project name and SSR status.                                                                                                          |

## Components, signals and DI

| Tool                            | Live | Inputs                                                                   | Description                                                                                  |
| ------------------------------- | ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `ng-devtools:highlight`         | yes  | `selector` (required): instance id, class name, host tag or CSS selector | Highlights a component in the page and makes it the target of `inspect-signals`.             |
| `ng-devtools:inspect-signals`   | yes  | `selector` (required)                                                    | The signal graph the page reported, with dependency edges and recent value history per node. |
| `ng-devtools:inspect-providers` | yes  | `selector`, `pageId`                                                     | The injector hierarchy a page reported, with the providers at each level.                    |

## Router

| Tool                              | Live   | Inputs                                                                                                                | Description                                                                                                                                                                                  |
| --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ng-devtools:inspect-route`       | yes    | `selector`                                                                                                            | The current route: URL, params, data, guards, resolvers, the navigation in flight and the outlet tree. With `selector`, the route a component was rendered for, or whether a link is active. |
| `ng-devtools:explain-navigation`  | yes    | `url`, `id`, `limit` (1 to 50, default 5), `perf`                                                                     | Recent navigations and why each succeeded or not, with timing, redirects and guard verdicts. `perf` lists the slowest navigations and preloads.                                              |
| `ng-devtools:list-routes`         | yes    | `match`, `audit`, `filter`                                                                                            | The live route config with source files and example URLs. `match` predicts which route a URL hits. `audit` lists the guards that protect each page.                                          |
| `ng-devtools:lint-routes`         | yes    |                                                                                                                       | Route config mistakes, each with a fix.                                                                                                                                                      |
| `ng-devtools:router-config`       | yes    |                                                                                                                       | Router options, features and strategies in effect.                                                                                                                                           |
| `ng-devtools:export-navigation`   | yes    | `id`                                                                                                                  | A markdown repro of a navigation. Defaults to the latest one that did not succeed.                                                                                                           |
| `ng-devtools:explain-render-mode` | partly | `url`                                                                                                                 | The `ServerRoute` and render mode for a URL, read from `*.routes.server.ts`.                                                                                                                 |
| `ng-devtools:navigate`            | yes    | `action` (required), `url`, `pattern`, `params`, `id`, `on`, `routeId`, `replaceUrl`, `skipLocationChange`, `waitFor` | Acts on the router, in development only. Actions: `navigate`, `abort`, `replay`, `probe`, `instrument` and `resolve-lazy`. Only same-origin relative URLs are accepted.                      |

## Forms

`form` is a form id (like `Checkout.form@ab12`) or part of its label. `path` is a dotted field path, like `address.city` or `items.0.qty`.

| Tool                                 | Inputs                                                                                          | Description                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ng-devtools:inspect-forms`          | `form`, `path`, `onlyInvalid`, `includeValues`                                                  | Forms on the page with every field's state and errors.                                                     |
| `ng-devtools:explain-form-invalid`   | `form`                                                                                          | Which fields make a form invalid, and why. Without `form`, every invalid or pending form.                  |
| `ng-devtools:explain-field`          | `form`, `path`, `selector`                                                                      | One field: error sources, skip reasons, binding and source. `selector` starts from a CSS selector instead. |
| `ng-devtools:explain-submit`         | `form`                                                                                          | What submit will do, and why it might do nothing.                                                          |
| `ng-devtools:form-payload`           | `form`                                                                                          | What the form sends: value vs raw value, and unvalidated fields.                                           |
| `ng-devtools:form-history`           | `form`, `path`, `type`, `origin`, `since`, `limit`                                              | Change timeline with origin (user, code, devtools). Returns the current marker.                            |
| `ng-devtools:form-diff`              | `form`, `since`                                                                                 | Net change since a marker.                                                                                 |
| `ng-devtools:lint-forms`             | `form`                                                                                          | Form bugs and model-aware accessibility checks.                                                            |
| `ng-devtools:explain-custom-control` | `form`, `path`                                                                                  | How a field is bound, and what is wrong with the binding.                                                  |
| `ng-devtools:export-form`            | `form`, `format` (`snapshot` or `fixture`)                                                      | JSON snapshot or test fixture.                                                                             |
| `ng-devtools:wait-for-form`          | `form`, `until` (`settled`, `valid`, `not-pending` or `submitted`), `since`, `timeoutMs`        | Waits until the condition holds, or reports the state on timeout.                                          |
| `ng-devtools:form-action`            | `action` (required), `form` (required), `path`, `value`, `mode`, `confirm`, `force`, `snapshot` | Set, touch, revalidate, reset, submit, focus, snapshot, restore and more.                                  |
| `ng-devtools:fill-form`              | `form` (required), `values` (required), `mode`, `submit`, `confirm`                             | Fills several fields through the inputs, like a user would.                                                |

All forms tools are live. `form-action` needs a development build. `reset`, `submit` and `restore` need `confirm: true`, and so does `fill-form` with `submit`. Secret, hidden and readonly fields are never written.

## Pipes

| Tool                       | Live   | Inputs            | Description                                                                                                                                   |
| -------------------------- | ------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ng-devtools:lint-pipes`   | no     |                   | Impure pipes inside `@for`, `\| json` left in templates, and pure pipes that read signals.                                                    |
| `ng-devtools:explain-pipe` | partly | `name` (required) | One pipe: where it is declared or used, purity, live counts, last input and output (when recording), a stale-value warning and lint findings. |

## Analog

| Tool                                | Live   | Inputs                                         | Description                                                                                       |
| ----------------------------------- | ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ng-devtools:analog-routes`         | no     | `filter`                                       | Analog file routes with their page, layout and server files.                                      |
| `ng-devtools:analog-explain-url`    | no     | `url` (required)                               | Which Analog files render a URL, or why nothing matches.                                          |
| `ng-devtools:analog-current-page`   | yes    |                                                | The open page's files, `load()` data and hydration state.                                         |
| `ng-devtools:analog-server-calls`   | yes    | `kind`, `route`, `limit`                       | Page renders, `load()`, server function and API calls.                                            |
| `ng-devtools:analog-api-routes`     | no     |                                                | Server routes with method, URL and file.                                                          |
| `ng-devtools:analog-call-api`       | yes    | `path` (required), `method`, `body`, `confirm` | Sends a request to a server route. Methods other than GET, HEAD and OPTIONS need `confirm: true`. |
| `ng-devtools:analog-render-modes`   | partly |                                                | SSR, prerendered or client only, per page.                                                        |
| `ng-devtools:analog-prerender-plan` | no     |                                                | `prerender.routes` compared with pages and build output.                                          |
| `ng-devtools:analog-content`        | no     | `filter`                                       | Markdown content with slug and frontmatter.                                                       |
| `ng-devtools:analog-lint`           | partly |                                                | Analog routing, server, prerender and content mistakes.                                           |

`analog-server-calls` and `analog-call-api` need the [Vite plugin](/getting-started/vite), because the plugin records calls and knows the dev server address.

## Shared state

| Tool                  | Inputs | Description                                                                                                           |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `devframe_state_read` | `key`  | Reads the devtools' live shared state. Call it without arguments to list the keys, then with a key to read its value. |

This is the way to read data that has no dedicated tool, such as the SSR & HTTP timeline (`ng-devtools:http`) or live pipe usage (`ng-devtools:pipe-usage`). See [Resources](/agents/resources).
