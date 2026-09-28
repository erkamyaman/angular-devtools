---
title: NgRx Store
description: Live NgRx signal stores and @ngrx/store state, with change logs, diffs and restore.
---

<ngmd-hero title="NgRx Store" logo="https://cdn.simpleicons.org/ngrx/BA2BD2" gradient>
  Your NgRx state as it changes. Signal stores and the classic Store, with a log of every change, a diff per entry, and restore.
</ngmd-hero>

# NgRx Store

The Store tab shows your *NgRx state live. It covers `@ngrx/signals` stores (`signalStore` and `signalState`) and the classic `@ngrx/store`. With the hub mounted, it lives in the **NgRx** dock.

The tab has two sections. **Live stores** reads the running page. **Source declarations** lists what your files declare.

## What it shows

### Store list

Each store shows its label, its kind (**signalStore**, **signalState** or **@ngrx/store**), its scope and its change count. The scope is where the store lives:

- `root`, `platform` or another environment injector that provides it.
- `Owner (component)` for a store a component provides.
- `Owner (field)` for a store found only in a component field.

The classic Store shows with the label **Store**. Use the filter box to narrow stores, changes and declarations. When more than one page reports, a picker chooses the page.

### Store detail

Select a store to see:

- Its kind, scope and declaring file. The file appears when the store's state keys match a `signalStore` in your source.
- **Store DevTools on** or **read-only**, for the classic Store.
- **Referenced by**: the component fields that hold it.
- **State**, **Computed** and **Methods**, with a call count per method. `rxMethod` members are tagged.

### Change log

Signal stores get a **Change log**. The classic Store gets an **Action log**. Each entry shows its number, its type, the number of changes and the time.

Open an entry to see its arguments and a **State diff** with the value before and after each change.

### Source declarations

The server scans your files for:

- `signalStore` with its `withState`, `withComputed`, `withMethods`, `withProps`, `withHooks`, `withEntities` and `rxMethod` members.
- `signalState` and `signalMethod`.
- `createAction`, `createActionGroup`, `createReducer`, `createEffect`, `createSelector`, `createFeatureSelector` and `createFeature`.
- Store setup: `provideStore`, `provideState`, `provideEffects`, and the `StoreModule` and `EffectsModule` calls.

Filter by kind with the chips.

## Where the data comes from

<ngmd-card-grid columns="2">
  <ngmd-card icon="zap" title="Live page">
    The overlay finds stores in the page's injectors and component fields, and records every change.
  </ngmd-card>
  <ngmd-card icon="file" title="Source scan">
    The server reads your <code>.ts</code> files for NgRx declarations. Specs are skipped.
  </ngmd-card>
</ngmd-card-grid>

### How changes are recorded

The overlay wraps the state signals of each signal store and the store's methods. A method call becomes one log entry with its arguments. Nested method calls fold into the outer one. Writes made outside a method are batched and logged as `patchState`.

For the classic Store, the overlay listens to the dispatched actions.

### Development builds

Stores are found through Angular's debug API, so the live section needs a development build.

## How to use it

### Find the change that broke the state

<ngmd-workflow>
  <ngmd-step title="Select the store">
    Pick it in the list. Filter by name if there are many.
  </ngmd-step>
  <ngmd-step title="Walk the log">
    Open entries from newest to oldest. Each <strong>State diff</strong> shows the keys that changed.
  </ngmd-step>
  <ngmd-step title="Read the arguments">
    The entry that set the wrong value shows the method and the arguments it got.
  </ngmd-step>
</ngmd-workflow>

### Restore an earlier state

<ngmd-workflow>
  <ngmd-step title="Open an entry">
    Pick the change you want to go back to.
  </ngmd-step>
  <ngmd-step title="Restore this state">
    Click <strong>Restore this state</strong>, then <strong>Restore</strong> to confirm.
  </ngmd-step>
  <ngmd-step title="Check the page">
    Components that read the store update at once. A new <code>Restore #N</code> entry is added to the log.
  </ngmd-step>
</ngmd-workflow>

### Restore modes

<ngmd-tabs>
  <ngmd-tab title="Signal store" icon="zap">
    Restore sets every state key that differs back to its value right after that change. Every state signal must be writable.
  </ngmd-tab>
  <ngmd-tab title="@ngrx/store" icon="box">
    Restore uses Store DevTools to jump to the state right after that action. New actions continue from there. It needs <code>provideStoreDevtools()</code>. Without it, the log is read-only.
  </ngmd-tab>
</ngmd-tabs>

## Agent tools

| Tool or resource             | Kind     | What it does                                                                             |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `ng-devtools:get-ngrx-store` | tool     | NgRx declarations from source, with the members of each `signalStore`.                   |
| `ng-devtools:ngrx-store`     | resource | The live stores per page, with state, computeds, methods, references and the change log. |

Agent access is read-only. No tool can restore a state. See [Tools](/agents/tools) and [Resources](/agents/resources).

## Limits and gotchas

<ngmd-callout type="warning" title="watchState needs registerNgrxSignals">
  Without it, restore writes the state signals directly. Components update, but <code>watchState</code> listeners do not run, and the log entry says so. Call <code>registerNgrxSignals(&#123; patchState &#125;)</code> from <code>&#64;santoshyadavdev/ng-devtools/overlay</code> once, and restore goes through <code>patchState</code>. This applies to <code>signalStore</code> only. A <code>signalState</code> restore always writes directly. See <a href="/guides/ngrx-signals-restore">Restore NgRx signal state</a>.
</ngmd-callout>

<ngmd-callout type="info" title="Stores appear when they are created">
  A <code>signalStore</code> is created the first time something injects it. Open a page that uses it, and it appears.
</ngmd-callout>

<ngmd-callout type="info" title="The classic Store must be in an environment injector">
  Use <code>provideStore()</code> or <code>StoreModule.forRoot()</code>. The overlay stops looking after a few tries, so reload the page if the Store is provided late.
</ngmd-callout>

<ngmd-callout type="tip" title="Redaction">
  State keys with secret-looking names are replaced with <code>[redacted]</code>, at any depth. See <a href="/security">Security</a>.
</ngmd-callout>

<ngmd-alert severity="helpful">
  The log keeps the last 200 entries. A method call that changes nothing is logged at most once per second.
</ngmd-alert>

## FAQ

<ngmd-accordion>
  <ngmd-accordion-item title="Why can't I restore an @ngrx/store entry?">
    Store DevTools is not set up, so the log is read-only. The store detail shows <strong>read-only</strong>. Add <code>provideStoreDevtools()</code> to the app config.
  </ngmd-accordion-item>
  <ngmd-accordion-item title="Why does restore say this change is no longer in the page history?">
    The entry fell out of the 200-entry log in the page. Pick a newer entry.
  </ngmd-accordion-item>
  <ngmd-accordion-item title="Why does my store have no declaring file?">
    The file is matched by state keys. A store whose keys match no <code>signalStore</code> in the scanned source has none.
  </ngmd-accordion-item>
</ngmd-accordion>

## Related pages

<ngmd-card-grid columns="2">
  <ngmd-card icon="wrench" title="Restore NgRx signal state" link="/guides/ngrx-signals-restore" cta="Guide">
    Register <code>patchState</code> so restore notifies <code>watchState</code>.
  </ngmd-card>
  <ngmd-card icon="zap" title="Signals" link="/inspectors/signals" cta="Open">
    The signal graph of the components that read the store.
  </ngmd-card>
  <ngmd-card icon="layers" title="Injectors" link="/inspectors/injectors" cta="Open">
    Where each store is provided.
  </ngmd-card>
  <ngmd-card icon="sparkles" title="Agent tools" link="/agents/tools" cta="Browse">
    Every tool a coding agent can call.
  </ngmd-card>
</ngmd-card-grid>
