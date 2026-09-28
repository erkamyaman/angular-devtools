---
title: SSR & HTTP
description: An HTTP timeline for SSR and client calls, fault injection, hydration stats and the TransferState payload.
---

# SSR & HTTP

The SSR & HTTP tab shows the HTTP calls your app makes while rendering on the server and in the browser, the hydration result, and the TransferState payload. It can also inject faults into requests.

## Requirements

The SSR & HTTP tab needs `withNgDevtools()` and `provideNgDevtoolsHttp()`, and SSR and the devtools middleware must run in the same Express process. It works in development builds only; in production the interceptor passes requests through untouched. The [SSR & HTTP guide](/guides/ssr-http) shows the setup.

## Sections

- **HTTP timeline**: every `HttpClient` request, tagged SSR or Client, with method, URL, the page that made it, status, time, whether the transfer cache answered it, and whether a fault rule changed it. Click a row for a response preview. Pick the page at the top; the timeline shows its client calls and the SSR calls made while rendering its first URL. The picker stays on the page you picked until that tab closes. Calls are kept until you press Clear timeline.
- **Fault injection**: add a rule with a URL pattern (a substring, or a glob where `*` matches anything, so `/api/*` matches both relative and absolute URLs), an optional method, where it applies (SSR + client, SSR only, client only), and a status, a delay (up to 10 s) and an optional JSON body. A status of 400 or more fails the request with an `HttpErrorResponse`; a lower status returns the body as a mocked response (a `responseType: 'text'` request gets the body as text). A rule with only a delay passes the request through. Client rules apply right away; SSR rules apply from the next page load. SSR mocks are not written to TransferState, so the browser requests the URL again; apply the rule on SSR + client to mock both.
- **Hydration**: whether hydration is on (the server sent hydration annotations), hydrated components and nodes, skipped components, incremental defer blocks, mismatched components with the expected and actual DOM, and the hydration warnings (NG05xx) Angular logged. Warnings are captured only with `provideNgDevtoolsHttp()`.
- **TransferState payload**: each entry in the page's `{APP_ID}-state` script with its size, with HttpClient and Analog cache entries decoded to status, URL and body, and `__nghData__` / `__nghDeferData__` labelled as hydration annotations.

Routes that are prerendered at build time make no requests at runtime and ignore SSR rules. Use `RenderMode.Server` in `app.routes.server.ts` for pages you want to test this way.

## Limits

The timeline keeps the last 200 calls. You can add up to 50 fault rules. Client rules are kept in `sessionStorage`, so they survive a reload of the same tab.

## For agents

There is no dedicated tool for this tab. Agents can read its data through the `devframe_state_read` tool with the `ng-devtools:http` key. See [Resources](/agents/resources).

## Privacy

Response previews and TransferState values are not redacted: they are sent to the devtools server as they are, so don't expose the dev server beyond localhost.
