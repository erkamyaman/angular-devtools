---
title: NgRx Store
description: Live NgRx signal stores and @ngrx/store state, with change logs, diffs and restore.
---

# NgRx Store

The Store tab shows your *NgRx state as it changes. It covers `@ngrx/signals` stores (`signalStore` and `signalState`) and the classic `@ngrx/store`. With the hub mounted, it lives in the **NgRx** dock.

## Where the data comes from

- **Live**: the [overlay](/getting-started/overlay) finds stores in the page's injectors and component fields, and records every change.
- **Source**: the server scans your files for `signalStore` (with its `withState`, `withComputed`, `withMethods`, `withProps`, `withHooks`, `withEntities` and `rxMethod` members), `signalState`, `signalMethod`, and `createAction`, `createReducer`, `createEffect`, `createSelector` and `createFeature`.

## Live stores

Each store in the list shows its label, kind (**signalStore**, **signalState** or **@ngrx/store**), scope and change count. The scope is the environment injector that provides it, or the component that owns it.

Select a store to see:

- Its kind, scope and declaring file.
- The component fields that reference it (**Referenced by**).
- **State**, **Computed** and **Methods**, with a call count per method. `rxMethod` members are tagged.

## Change log

Signal stores get a **Change log**. `@ngrx/store` gets an **Action log**. Each entry shows its number, type, the number of changes and the time. Open an entry to see its arguments and a **State diff** with the value before and after each change.

Method calls are logged even when they change nothing. The log keeps the last 200 entries.

## Restore

Open an entry and click **Restore this state**, then **Restore** to confirm.

- For a signal store, restore sets every state key back to its value right after that change. Components that read the store update at once, and a new **Restore** entry is added to the log. Call `registerNgrxSignals({ patchState })` once, so restore also notifies `watchState` listeners. See [Restore NgRx signal state](/guides/ngrx-signals-restore).
- For `@ngrx/store`, restore uses Store DevTools to jump to the state right after that action. New actions continue from there. Time travel needs `provideStoreDevtools()`. Without it the log is read-only.

## For agents

- `ng-devtools:get-ngrx-store` scans the source for NgRx declarations.
- The `ng-devtools:ngrx-store` resource holds the live stores and the change log.

## Tips

- A `signalStore` is created the first time something injects it. Open a page that uses it, and it appears.
- For `@ngrx/store`, the Store must be provided in an environment injector (`provideStore()` or `StoreModule.forRoot()`).
- State keys with secret-looking names are replaced with `[redacted]`. See [Security](/security).
