---
title: Angular CLI and Express
description: Mount the devtools hub in the Express server of an Angular SSR app.
---

# Angular CLI and Express

In an Angular app with server-side rendering, the devtools run inside your Express server. You add a middleware on the server and load the overlay in the browser.

<ngmd-workflow>
  <ngmd-step title="Mount the hub">
    Add <code>initNgDevtoolsHub()</code> to <code>server.ts</code>, before your other routes.
  </ngmd-step>
  <ngmd-step title="Load the overlay">
    Import the overlay in <code>main.ts</code>, in development only.
  </ngmd-step>
  <ngmd-step title="Open the devtools">
    Start the app and click the amber button in the corner of the page.
  </ngmd-step>
</ngmd-workflow>

## Mount the hub

Mount the devtools hub in your Express server:

```ts
// server.ts
import { initNgDevtoolsHub } from '@santoshyadavdev/ng-devtools/hub';

const devtools = initNgDevtoolsHub({ ws: false });
app.use(devtools.nodeMiddleware);
```

`ws: false` turns the WebSocket off, so the browser connects over server-sent events. Mount the middleware before `express.static` and the Angular SSR handler, so the devtools routes answer first.

The full-page viewer is at `http://localhost:4000/__devframes/`. The hub is built on [`@devframes/hub`](https://github.com/devframes/devframe), so other devframe tools can join the same dock.

When you run `ng serve`, the Angular dev server runs `server.ts` too, so the hub also answers on port 4200.

<ngmd-callout type="info" title="One-time code">
  The hub protects its connection with a one-time code by default. The server prints the code, and a browser can read data only after it exchanges that code. On a machine only you use, pass <code>auth: false</code> to turn the gate off.
</ngmd-callout>

[Security](/security) covers the other access options.

`initNgDevtoolsHub()` accepts the options of `initHub()` from `@devframes/hub`, apart from `devframes` and `ui`. These are the ones you are most likely to set:

| Option           | Default           | What it does                                                                                  |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `base`           | `'/__devframes/'` | Where the hub is mounted. The devtools panel lives at `<base>ng-devtools/`.                   |
| `ws`             |                   | `false` uses server-sent events only. `{ sidecar: true }` runs the WebSocket on its own port. |
| `auth`           | on                | `false` turns off the one-time code.                                                          |
| `allowedOrigins` | loopback origins  | Extra origins allowed to open the WebSocket. `false` turns the origin check off.              |
| `mcp`            | `'auto'`          | Mounts the MCP endpoint at `<base>__mcp` once agent tools exist.                              |

The demo app in this repository mounts the hub like this:

```ts
// src/server.ts
const auth = process.env['NG_DEVTOOLS_AUTH'] === 'true';
const devtools = initNgDevtoolsHub({
  ws: { sidecar: true },
  auth,
  allowedOrigins: false,
});
app.use(devtools.nodeMiddleware);
```

It turns the origin check off because it runs as a public demo. Keep the check on for your own apps.

## Load the overlay

The [overlay](/getting-started/overlay) collects live data from the page. Import it after bootstrap, in development only:

```ts
// main.ts
bootstrapApplication(App, appConfig)
  .then(() => {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      return import('@santoshyadavdev/ng-devtools/overlay');
    }
    return undefined;
  })
  .catch((err) => console.error(err));
```

A floating button appears on your page. It opens the devtools with one dock entry per tool:

| Dock entry   | Shows                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Angular      | Dashboard, components, routes, signals, injectors, forms, pipes, and SSR & HTTP |
| NgRx         | Store patterns from source, and live state and actions                          |
| Analog       | File routes, server calls, render modes and lint (a notice in non-Analog apps)  |
| NativeScript | Coming soon                                                                     |
| Capacitor    | Coming soon                                                                     |

## Fill the SSR & HTTP tab

To fill the SSR & HTTP tab, add the interceptor and hydration hooks to your app config:

```ts
// app.config.ts
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideNgDevtoolsHttp, withNgDevtools } from '@santoshyadavdev/ng-devtools/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch(), withNgDevtools()),
    provideNgDevtoolsHttp(),
  ],
};
```

The [SSR & HTTP guide](/guides/ssr-http) covers interceptor order and fault injection.

## Mount only the panel

To mount only the devtools panel without the dock, use `initDevframe(ngDevtools, { base: '/__ng-devtools/' })` from `devframe/initiate`. The overlay looks for that path too.
