---
title: Browser overlay
description: The script that runs in your page and sends live data to the devtools.
---

# Browser overlay

The overlay runs inside your Angular page. It reads Angular's debug API and sends live data to the devtools server: the component tree, the signal graph, the injector tree, NgRx stores, forms, pipes, the router, HTTP calls and Analog page data. Importing the module starts it, so in most apps that import is all that is needed:

```ts
import '@santoshyadavdev/ng-devtools/overlay';
```

Load it in development builds only. Production builds remove the debug API, so the overlay has nothing to read. The [Express](/getting-started/express) and [Vite](/getting-started/vite) pages show a dynamic import that only runs in development.

## How it connects

It looks for the devframe connection next to the page, then at `/__ng-devtools/` and `/__devframes/ng-devtools/`. It also adds the floating button; with the hub mounted, the button opens the whole hub (every dock in a side rail).

The overlay sends a fresh snapshot every 3 seconds and skips data that did not change. Router events are sent as they happen. Each browser tab gets its own page id, so the devtools can tell tabs apart. When a tab closes, its data is dropped.

## A custom mount path

`initOverlay` is exported for a devtools mounted somewhere else. Importing the module has already started an overlay on the default URLs by then, so dispose of that one before starting another, or the page ends up with two connections and two polling intervals:

```ts
import { initOverlay } from '@santoshyadavdev/ng-devtools/overlay';

const dispose = await initOverlay({ baseURL: '/__my-devtools/' });
```

`baseURL` takes one path or a list of paths to try in order. `initOverlay` resolves to a function that stops the overlay and removes its hooks.

## NgRx signal stores

The overlay also exports `registerNgrxSignals`. Call it once with `patchState` so that restoring a store's state also notifies `watchState` listeners. See [Restore NgRx signal state](/guides/ngrx-signals-restore).

## Highlighting

When you hover a component in the devtools, the overlay draws an amber box around its element in the page. The box follows the element and clears after 2 seconds.
