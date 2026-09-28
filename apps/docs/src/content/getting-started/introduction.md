---
title: Introduction
description: What the devtools inspect, and the ways you can run them.
---

# Introduction

The devtools inspect a running Angular app: its components, signals, injectors, routes, forms, pipes, NgRx stores, HTTP calls and hydration. They also scan your source files, so they can answer questions before the app even runs.

The same tool runs in several places. It is built with *Devframe, so one definition powers every mode.

| Mode             | What you get                                                        |
| ---------------- | ------------------------------------------------------------------- |
| Embedded panel   | A floating button on your page opens the devtools next to your app. |
| Standalone CLI   | A local server that serves the devtools UI.                         |
| Static report    | An offline HTML build of the source scan.                           |
| MCP server       | Every inspector exposed to coding agents as tools and resources.    |
| Chrome extension | A panel in Chrome DevTools that connects to your local dev server.  |

## Features

- **Components**: every component instance on the page, with live inputs, outputs, change detection, encapsulation, DOM listeners, host directives and injected services. Hover a row to highlight the element in the page.
- **Signals**: the live signal graph of one component (signal, computed, linkedSignal and effect nodes with their edges), plus a value history per signal. Needs Angular 19 or later.
- **Injectors**: the element and environment injector hierarchy, the lookup path for a token, and the providers at each level. Needs Angular 17 or later.
- **Routes**: the live route, every navigation as a full story (who started it, redirects, per-phase timing, which guard or resolver decided it, errors explained), the live route config with URL testing, the router setup and a route lint.
- **NgRx Store**: live `@ngrx/signals` stores with a change log, per-change diffs and state restore, plus the `@ngrx/store` state and action log, with time travel through `provideStoreDevtools()`.
- **Forms**: every Signal Form, reactive form and template-driven form on the page, with each field's value, status and readable errors, a change timeline, submit and payload explanations, and a lint.
- **Pipes**: custom and built-in pipes, where they are used, live instances, call recording, async subscriptions and a pipe lint.
- **SSR & HTTP**: an HTTP timeline for SSR and client calls, fault injection, hydration stats and the TransferState payload.
- **Analog**: file routes, server calls, render modes, content and lint for *Analog apps.
- **Dashboard**: the Angular and TypeScript versions, SSR status and a count for each inspector.
- **Agent tools**: the inspectors are exposed as *MCP tools and resources, so a coding agent can read and act on the running app.

## Requirements

- The package supports Angular 20 and later.
- Live data needs a development build. The devtools read Angular's debug API (`window.ng`), which production builds remove.
- Node.js 22 or later runs the package.

## Next steps

<ngmd-card-grid columns="2">
  <ngmd-card title="Install" link="/getting-started/installation" cta="Install the package">
    Add the package and pick how you want to run it.
  </ngmd-card>
  <ngmd-card title="Angular CLI and Express" link="/getting-started/express" cta="Set it up">
    Mount the devtools in the Express server of an SSR app.
  </ngmd-card>
  <ngmd-card title="Vite and Analog" link="/getting-started/vite" cta="Add the plugin">
    Add the Vite plugin next to `analog()`.
  </ngmd-card>
  <ngmd-card title="Agent tools" link="/agents/mcp-server" cta="Connect an agent">
    Give your coding agent access to the inspectors.
  </ngmd-card>
</ngmd-card-grid>
