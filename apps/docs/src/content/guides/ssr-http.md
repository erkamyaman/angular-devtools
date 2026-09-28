---
title: Set up SSR & HTTP
description: Add the interceptor and hydration hooks, in the right order, to fill the SSR & HTTP tab.
---

# Set up SSR & HTTP

The [SSR & HTTP tab](/inspectors/ssr-http) records every `HttpClient` call during server rendering and in the browser. It needs an interceptor, a hydration hook, and SSR running next to the devtools.

## 1. Add the providers

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

- `withNgDevtools()` adds the interceptor that records calls and applies fault rules.
- `provideNgDevtoolsHttp()` captures the hydration warnings (NG05xx) Angular logs.

## 2. Put withNgDevtools first

Register `withNgDevtools()` before your own interceptors (`provideHttpClient(withNgDevtools(), withInterceptors([auth]))`), so it records requests as the app makes them and fault rules apply before anything else. Transfer cache hits are detected when the cached response comes back right away, or when the page's TransferState holds a GET or HEAD entry for the same URL, so an async interceptor after it does not hide them.

```ts
provideHttpClient(withFetch(), withNgDevtools(), withInterceptors([auth]));
```

## 3. Run SSR next to the devtools

SSR and the devtools middleware must run in the same Express process. The interceptor on the server hands its calls to the devtools through that process. Mount the hub in `server.ts` as shown in [Angular CLI and Express](/getting-started/express).

It works in development builds only; in production the interceptor passes requests through untouched.

## 4. Test with server rendering

Routes that are prerendered at build time make no requests at runtime and ignore SSR rules. Use `RenderMode.Server` in `app.routes.server.ts` for pages you want to test this way.

```ts
// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'products', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender },
];
```

## Inject a fault

1. Open the SSR & HTTP tab and go to **Fault injection**.
2. Enter a URL pattern, for example `/api/*`.
3. Pick where it applies: **SSR + client**, **SSR only** or **Client only**.
4. Set a status (for example `500`), a delay, or a mock JSON body, then click **Add rule**.
5. Reload the page. SSR rules apply from the next page load. Client rules apply right away.

A status of 400 or more fails the request with an `HttpErrorResponse`. A lower status returns the body as a mocked response. SSR mocks are not written to TransferState, so the browser requests the URL again. Apply the rule on SSR + client to mock both.
