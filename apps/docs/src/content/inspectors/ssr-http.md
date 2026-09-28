---
title: SSR & HTTP
description: An HTTP timeline for SSR and client calls, fault injection, hydration stats and the TransferState payload.
---

<ngmd-hero title="SSR & HTTP" gradient>
  Every HttpClient call made while rendering on the server and in the browser. Fault injection, hydration stats and the TransferState payload, in one tab.
</ngmd-hero>

# SSR & HTTP

The SSR & HTTP tab shows the HTTP calls your app makes during server rendering and in the browser. It also shows the hydration result and the TransferState payload, and it can inject faults into requests. Pick the page at the top. The tab shows that page's data.

## Setup

The timeline and fault rules need the interceptor. The hydration warnings need the provider. Add both to the app config, with `withNgDevtools()` before your own interceptors:

```ts {8-9}
// app.config.ts
import {ApplicationConfig} from '@angular/core';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {provideNgDevtoolsHttp, withNgDevtools} from '@santoshyadavdev/ng-devtools/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withNgDevtools(), withInterceptors([auth])),
    provideNgDevtoolsHttp(),
  ],
};
```

<ngmd-callout type="warning" title="withNgDevtools() first">
  Put <code>withNgDevtools()</code> before your own interceptors. Then it records requests as the app makes them, and fault rules apply before anything else. The full setup is in the <a href="/guides/ssr-http">SSR & HTTP guide</a>.
</ngmd-callout>

SSR must run in the same Node process as the devtools server, such as the Express server with the hub mounted, or the Vite dev server with the plugin. The [overlay](/getting-started/overlay) must be loaded, because client calls, hydration and the payload reach the tab through it.

## What it shows

### HTTP timeline

Every `HttpClient` request, tagged **SSR** or **Client**. Each row shows the method, the URL, the page that made it, the status, the time, and notes:

- **transfer cache**: the TransferState cache answered it.
- **faulted**: a fault rule matched it.

Click a row for a response preview. The timeline shows the page's client calls and the SSR calls made while rendering its first URL. **Clear timeline** empties it.

### Fault injection

Add a rule with these fields:

- **URL pattern**: a substring, or a glob where `*` matches anything. `/api/*` matches both relative and absolute URLs.
- **Method**: any, or one method.
- **Apply on**: SSR + client, SSR only, or client only.
- **Status**, **Delay (ms)** up to 10000, and an optional JSON body.

A status of 400 or more fails the request with an `HttpErrorResponse`. A lower status returns the body as a mocked response. A rule with only a delay passes the request through. The first enabled rule that matches wins.

### Hydration

- Whether hydration is on.
- Hydrated components and nodes, skipped components, and incremental defer blocks.
- DOM nodes hydrated and skipped, and `ngSkipHydration` hosts.
- Mismatched components, with the expected and actual DOM.
- The hydration warnings (NG05xx) Angular logged in the browser.

### TransferState payload

Each entry in the page's `{APP_ID}-state` script, with its size. HttpClient and Analog cache entries are decoded to status, URL and body. `__nghData__` and `__nghDeferData__` are labelled as hydration annotations.

## Where the data comes from

<ngmd-card-grid columns="3">
  <ngmd-card icon="terminal" title="Server">
    The interceptor on the server hands SSR calls to the devtools through the shared Node process.
  </ngmd-card>
  <ngmd-card icon="zap" title="Browser">
    The overlay reports client calls, hydration stats and the payload.
  </ngmd-card>
  <ngmd-card icon="settings" title="Rules">
    Fault rules live on the devtools server and are sent to every page.
  </ngmd-card>
</ngmd-card-grid>

### What each part needs

| Part                  | Needs                                   |
| --------------------- | --------------------------------------- |
| HTTP timeline         | `withNgDevtools()` and the overlay.     |
| Fault injection       | `withNgDevtools()`.                     |
| Hydration stats       | The overlay.                            |
| Hydration warnings    | `provideNgDevtoolsHttp()`.              |
| TransferState payload | The overlay, on a server-rendered page. |

### Development builds

The interceptor works in development builds only. In production it passes requests through untouched.

## How to use it

### Test an error state

<ngmd-workflow>
  <ngmd-step title="Add a rule">
    Enter the URL pattern, pick <strong>Client only</strong>, and set the status to <code>500</code>.
  </ngmd-step>
  <ngmd-step title="Use the page">
    Trigger the request. The row is marked <strong>faulted</strong>.
  </ngmd-step>
  <ngmd-step title="Check the UI">
    Your error handling runs against a real <code>HttpErrorResponse</code>.
  </ngmd-step>
  <ngmd-step title="Remove the rule">
    Click <strong>Remove</strong> when you are done.
  </ngmd-step>
</ngmd-workflow>

### Test a slow API

<ngmd-workflow>
  <ngmd-step title="Add a delay-only rule">
    Leave the body empty and set a delay, for example 3000 ms.
  </ngmd-step>
  <ngmd-step title="Watch the loading state">
    The request still reaches the API, only later.
  </ngmd-step>
</ngmd-workflow>

### Check that TransferState works

<ngmd-workflow>
  <ngmd-step title="Load a server-rendered page">
    Use a route with <code>RenderMode.Server</code>.
  </ngmd-step>
  <ngmd-step title="Read the timeline">
    Each GET should show an SSR row, and a Client row marked <strong>transfer cache</strong>.
  </ngmd-step>
  <ngmd-step title="Read the payload">
    The matching entry should appear in <strong>TransferState payload</strong>.
  </ngmd-step>
</ngmd-workflow>

## Agent tools

There is no dedicated tool for this tab. Agents read its data with the `devframe_state_read` tool and the `ng-devtools:http` key. See [Resources](/agents/resources).

Two router tools cover related ground:

| Tool                              | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `ng-devtools:explain-render-mode` | Which render mode a URL gets, from `*.routes.server.ts`.      |
| `ng-devtools:explain-navigation`  | Each navigation's story, including the HTTP requests it made. |

## Limits and gotchas

<ngmd-callout type="warning" title="Prerendered routes make no requests">
  Routes prerendered at build time make no requests at runtime and ignore SSR rules. Use <code>RenderMode.Server</code> in <code>app.routes.server.ts</code> for pages you want to test this way.
</ngmd-callout>

<ngmd-callout type="info" title="SSR mocks are not transferred">
  SSR mocks are not written to TransferState, so the browser requests the URL again. Apply the rule on <strong>SSR + client</strong> to mock both.
</ngmd-callout>

<ngmd-callout type="info" title="When rules apply">
  Client rules apply right away. SSR rules apply from the next page load. Client rules are also kept in <code>sessionStorage</code>, so they apply on reload before the overlay connects. Rules live in the devtools server's memory, so a server restart clears them.
</ngmd-callout>

<ngmd-callout type="danger" title="Nothing is redacted here">
  Response previews and TransferState values are sent to the devtools server as they are. Don't expose the dev server beyond localhost. See <a href="/security">Security</a>.
</ngmd-callout>

<ngmd-alert severity="helpful">
  The timeline keeps the last 200 SSR calls and the last 200 client calls per page. You can add up to 50 fault rules.
</ngmd-alert>

## FAQ

<ngmd-accordion>
  <ngmd-accordion-item title="Why are there no SSR rows?">
    SSR runs in a different process from the devtools, or the route is prerendered. Mount the hub in the same server, and use <code>RenderMode.Server</code>.
  </ngmd-accordion-item>
  <ngmd-accordion-item title="Why does Warnings say not captured?">
    <code>provideNgDevtoolsHttp()</code> is missing from the app providers.
  </ngmd-accordion-item>
  <ngmd-accordion-item title="Why did my client calls disappear?">
    Client calls live in the page. A reload starts a new list. SSR calls stay until <strong>Clear timeline</strong> or a server restart.
  </ngmd-accordion-item>
</ngmd-accordion>

## Related pages

<ngmd-card-grid columns="2">
  <ngmd-card icon="wrench" title="Set up SSR & HTTP" link="/guides/ssr-http" cta="Guide">
    The providers, their order, and the server setup.
  </ngmd-card>
  <ngmd-card icon="terminal" title="Angular CLI and Express" link="/getting-started/express" cta="Set up">
    Mount the hub in <code>server.ts</code>.
  </ngmd-card>
  <ngmd-card icon="compass" title="Router" link="/inspectors/router" cta="Open">
    HTTP requests per navigation, and render modes.
  </ngmd-card>
  <ngmd-card icon="shield" title="Security" link="/security" cta="Read">
    What is redacted, and what is not.
  </ngmd-card>
</ngmd-card-grid>
