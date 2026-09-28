---
title: Set up Analog
description: Add the devtools to an Analog app, step by step.
---

# Set up Analog

This guide adds the devtools to an *Analog app. You get the Angular inspectors, the NgRx dock and the Analog dock, with an MCP endpoint on the Vite dev server.

## 1. Install

```bash group="install" name="npm" active
npm install @santoshyadavdev/ng-devtools devframe
```

```bash group="install" name="pnpm"
pnpm add @santoshyadavdev/ng-devtools devframe
```

## 2. Add the Vite plugin

Add the plugin next to `analog()`:

```ts
// vite.config.ts
import analog from '@analogjs/platform';
import ngDevtools from '@santoshyadavdev/ng-devtools/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [analog(), ngDevtools()],
});
```

The plugin runs on the dev server only.

## 3. Load the overlay

```ts
// src/main.ts
bootstrapApplication(App, appConfig).then(() => {
  if (import.meta.env.DEV) void import('@santoshyadavdev/ng-devtools/overlay');
});
```

## 4. Open the devtools

Start the dev server. The floating button appears on the page, the full viewer is at `/__devframes/` on the Vite dev server, and the MCP endpoint at `/__devframes/__mcp`.

Open the **Analog** dock to see file routes, server calls, render modes, content and lint. See [the Analog inspector](/inspectors/analog) for each view.

## Optional: HTTP timeline

To record `HttpClient` calls in the SSR & HTTP tab, add `withNgDevtools()` and `provideNgDevtoolsHttp()` to your app config. See [Set up SSR & HTTP](/guides/ssr-http). Analog's own `load()` fetches and API calls show in the Analog dock without it.

## Custom hostnames

If you open the dev server through another hostname, add it to Vite's `server.allowedHosts`. See [Security](/security).

## Try the demo

The repository has an Analog demo in `examples/analog`. From the repository root:

```bash
pnpm install
pnpm analog:dev
```

It builds the devtools package first, then starts the Vite dev server.
