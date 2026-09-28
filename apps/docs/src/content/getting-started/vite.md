---
title: Vite and Analog
description: Add the devtools Vite plugin to an Analog app.
---

# Vite and Analog

For *Analog apps, add the Vite plugin next to `analog()` and load the overlay in `main.ts`:

```ts
// vite.config.ts
import analog from '@analogjs/platform';
import ngDevtools from '@santoshyadavdev/ng-devtools/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [analog(), ngDevtools()],
});
```

```ts
// src/main.ts
bootstrapApplication(App, appConfig).then(() => {
  if (import.meta.env.DEV) void import('@santoshyadavdev/ng-devtools/overlay');
});
```

The floating button appears on the page, the full viewer is at `/__devframes/` on the Vite dev server, and the MCP endpoint at `/__devframes/__mcp`.

## What the plugin does

- It runs on the dev server only. `vite build` is not affected.
- It mounts the devtools hub on the Vite dev server and shares its HTTP server for the WebSocket.
- It records Analog page renders, `load()` fetches, server functions and API calls for the [Analog inspector](/inspectors/analog).
- It only answers requests from your machine. See [Security](/security).
- It does not inject the overlay. Your app imports it in `main.ts`, as shown above.

## Options

```ts
ngDevtools({
  base: '/__devframes/',
  apiPrefix: 'api',
  allowedOrigins: ['https://tunnel.example'],
});
```

| Option           | Default                          | What it does                                                             |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `base`           | `'/__devframes/'`                | Where the hub is mounted.                                                |
| `apiPrefix`      | Analog's `apiPrefix`, or `'api'` | The prefix of your server routes, used to classify API calls.            |
| `allowedOrigins` | none                             | Extra exact origins allowed to reach the devtools, for example a tunnel. |

## Hostnames other than localhost

If you open the dev server through another hostname that points to your machine (for example `myapp.test`), list it in Vite's `server.allowedHosts` and the devtools trust it too. Other origins can be added with `ngDevtools({ allowedOrigins: ['https://tunnel.example'] })`.

## Angular CLI apps

The Angular CLI dev server does not accept Vite plugins. For an Angular CLI app, mount the hub in your Express server instead. See [Angular CLI and Express](/getting-started/express).

The [Analog guide](/guides/analog) walks through a full setup, including the demo in this repository.
