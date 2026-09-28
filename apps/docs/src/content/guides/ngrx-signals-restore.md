---
title: Restore NgRx signal state
description: Register patchState so that restoring a signal store also notifies watchState listeners.
---

# Restore NgRx signal state

The [NgRx Store tab](/inspectors/ngrx-store) can put a signal store back to its state after any change in the log. By default it writes the state signals directly. That updates your components, but `watchState` listeners do not run.

Register `patchState` once, and restore goes through it instead. Then `watchState` listeners run as they would for any other change.

## Register patchState

Call `registerNgrxSignals({ patchState })` from `@santoshyadavdev/ng-devtools/overlay` once, after the app starts. The demo app in this repository does it in `main.ts`, together with loading the overlay:

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then((ref) => {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      return ref
        .whenStable()
        .then(() =>
          Promise.all([import('@santoshyadavdev/ng-devtools/overlay'), import('@ngrx/signals')]),
        )
        .then(([devtools, { patchState }]) => devtools.registerNgrxSignals({ patchState }));
    }
    return undefined;
  })
  .catch((err) => console.error(err));
```

Both imports are dynamic and run in development only, so production bundles do not include the devtools.

## Restore a state

1. Open the Store tab (the **NgRx** dock with the hub).
2. Select a store, then open an entry in its change log.
3. Click **Restore this state**, then **Restore**.

Every state key of the store goes back to its value right after that change. Components that read the store update at once, and a new **Restore** entry is added to the log.

<ngmd-callout type="info" title="Without registerNgrxSignals">
  Restore still works, but the log entry says that <code>watchState</code> listeners were not notified.
</ngmd-callout>

## Limits

- Restore needs every state key to be writable.
- The log keeps the last 200 entries per page.
- For `@ngrx/store`, restore uses Store DevTools instead. Add `provideStoreDevtools()` to enable it. Without it, the action log is read-only.
