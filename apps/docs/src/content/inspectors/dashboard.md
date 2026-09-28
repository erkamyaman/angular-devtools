---
title: Dashboard
description: Project metadata and a count for each inspector.
---

<ngmd-hero title="Dashboard" gradient>
  The first tab. It shows what the project is built with and how much each inspector found.
</ngmd-hero>

# Dashboard

The Dashboard opens by default. The top block describes your workspace. The cards below count what each inspector found, and each card opens its tab.

<ngmd-pill-row>
  <ngmd-pill href="/inspectors/components" title="Components"></ngmd-pill>
  <ngmd-pill href="/inspectors/signals" title="Signals"></ngmd-pill>
  <ngmd-pill href="/inspectors/injectors" title="Injectors"></ngmd-pill>
  <ngmd-pill href="/inspectors/router" title="Router"></ngmd-pill>
  <ngmd-pill href="/inspectors/pipes" title="Pipes"></ngmd-pill>
</ngmd-pill-row>

## What it shows

### Project block

The top block shows the project name and a chip for each of these:

<ngmd-card-grid columns="2">
  <ngmd-card icon="box" title="Angular">
    The installed Angular version.
  </ngmd-card>
  <ngmd-card icon="code" title="TypeScript">
    The installed TypeScript version.
  </ngmd-card>
  <ngmd-card icon="layers" title="SSR">
    <code>On</code> or <code>Off</code>.
  </ngmd-card>
  <ngmd-card icon="rocket" title="Analog">
    The Analog version. Shown in Analog apps only.
  </ngmd-card>
</ngmd-card-grid>

### Inspector cards

Each card counts what one inspector found. Click a card to open its tab.

| Card              | Counts                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Components        | Components in source, plus the number of directives.                                                        |
| Routes            | Navigable page paths in source, plus the number of redirects.                                               |
| Signals           | Signal nodes live on the page, plus the declarations in source. Without a page, the declarations in source. |
| Injectors         | Live injectors on the page, plus their providers. Without a page, the provider declarations in source.      |
| NgRx declarations | NgRx declarations in source, broken down by kind.                                                           |
| Pipes             | Custom pipes in source, plus the built-in pipes in use.                                                     |

### Card states

A card shows **Counting…** while it loads. It shows **Count unavailable** when its data could not be read.

<ngmd-alert severity="helpful">
  The NgRx card opens the <strong>NgRx</strong> dock when the hub is mounted.
</ngmd-alert>

## Where the data comes from

Most of the Dashboard reads your workspace, not the running page. It works before the app has even loaded in a browser.

### Versions and project name

The server reads versions from the installed packages in `node_modules`. When a package is not installed, it falls back to the range in `package.json`.

The project name comes from `angular.json`. When there is no `angular.json`, it comes from `package.json`.

### SSR status

SSR is **On** when the build options set `ssr` or `server`. For *Analog apps, SSR follows the `ssr` option of `analog()`.

### Counts

The Components, Routes, NgRx and Pipes cards count the source scan. The Signals and Injectors cards use the live page when one is connected, and the source scan otherwise.

## How to use it

<ngmd-workflow>
  <ngmd-step title="Check the versions">
    Confirm the Angular and TypeScript chips match what you expect. A mismatch usually means a stale install.
  </ngmd-step>
  <ngmd-step title="Open the app in a browser">
    The Signals and Injectors cards switch to live counts once a page connects.
  </ngmd-step>
  <ngmd-step title="Jump to an inspector">
    Click the card for the area you want to look at. It opens that tab.
  </ngmd-step>
</ngmd-workflow>

## Agent tools

| Tool                     | What it returns                                                   |
| ------------------------ | ----------------------------------------------------------------- |
| `ng-devtools:build-meta` | Angular and TypeScript versions, the project name and SSR status. |

The same data is baked into [static reports](/getting-started/cli). See [Tools](/agents/tools) for every tool.

## Limits and gotchas

<ngmd-callout type="warning" title="Project details unavailable">
  If the project block says <strong>Project details unavailable</strong>, check that the dev server is running, then reload the panel.
</ngmd-callout>

<ngmd-callout type="info" title="Source counts do not need a page">
  The source-based cards fill in from the workspace scan. Only the Signals and Injectors cards change when a page connects.
</ngmd-callout>

## Related pages

<ngmd-card-grid columns="2">
  <ngmd-card icon="layers" title="Components" link="/inspectors/components" cta="Open">
    Every component instance on the page, with live inputs and outputs.
  </ngmd-card>
  <ngmd-card icon="compass" title="Router" link="/inspectors/router" cta="Open">
    The live route, every navigation, and a route lint.
  </ngmd-card>
  <ngmd-card icon="terminal" title="Standalone CLI" link="/getting-started/cli" cta="Run">
    Serve the devtools or build a static report.
  </ngmd-card>
  <ngmd-card icon="sparkles" title="Agent tools" link="/agents/tools" cta="Browse">
    Every tool a coding agent can call.
  </ngmd-card>
</ngmd-card-grid>
