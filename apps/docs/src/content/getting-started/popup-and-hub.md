---
title: Popup and hub
description: The floating button, the panel and its dock modes, the hub rail and deep links.
---

# Popup and hub

When the overlay loads, a floating button appears in the bottom-right corner of your page. Click it to open the devtools in a panel on top of your app.

## The in-page popup

The devtools can appear as a floating popup directly on your page. No browser extension is needed:

```ts
import { createDevtoolsPopup } from '@santoshyadavdev/ng-devtools/popup';

createDevtoolsPopup();
```

This adds a floating button (bottom-right) that opens the full devtools UI in an iframe. Importing the overlay already adds the button, so most apps never call `createDevtoolsPopup()` themselves. Calling it again returns the same popup.

- **Dock modes**: float, bottom (full width, 40% of the height) and right (40% of the width, full height). Only the floating panel can be dragged.
- **Resize** the panel with its resize handle.
- **Move the button**: drag it, or focus it and use the arrow keys (hold Shift for bigger steps). Double-click resets its position.
- **Escape** closes the panel.
- **Persistence**: position, size and dock mode are saved in `localStorage` under `ng-devtools-popup`.

The button color follows the `--ng-devtools-accent` CSS variable, so you can match it to your app.

## The hub

When the page's server mounts the hub (`/__devframes/`), the button opens the whole hub. A side rail shows one dock per tool:

| Dock         | Shows                                                                           |
| ------------ | ------------------------------------------------------------------------------- |
| Angular      | Dashboard, Components, Routes, Signals, Injectors, Forms, Pipes, and SSR & HTTP |
| NgRx         | The Store tab                                                                   |
| Analog       | The Analog tab, or a notice in apps that do not use Analog                      |
| NativeScript | Coming soon                                                                     |
| Capacitor    | Coming soon                                                                     |

The full-page viewer is at `/__devframes/` on the same server. The hub is built on [`@devframes/hub`](https://github.com/devframes/devframe), so other devframe tools can join the same rail.

Without the hub (for example the standalone CLI, or a panel mounted with `initDevframe()`), every tab sits in one tab bar and the Store tab is a regular tab.

## Deep links

The URL hash selects a tab. Open `/__devframes/ng-devtools/#tab=signals` to land on the Signals tab. Switching tabs updates the hash, so you can copy the URL at any time.

| Tab        | Hash              |
| ---------- | ----------------- |
| Dashboard  | `#tab=dashboard`  |
| Components | `#tab=components` |
| Routes     | `#tab=routes`     |
| Signals    | `#tab=signals`    |
| Injectors  | `#tab=injectors`  |
| Store      | `#tab=store`      |
| Forms      | `#tab=forms`      |
| Pipes      | `#tab=pipes`      |
| SSR & HTTP | `#tab=network`    |
| Analog     | `#tab=analog`     |

A hash only works for a tab that exists when the panel opens. The Analog tab appears after the server confirms the app is an Analog app, so `#tab=analog` does not select it on load. Inside the Angular dock, the Store and Analog tabs live in their own docks.

## Connection status

The header shows **Live** when the panel is connected, **Connecting…** while it tries, and **Disconnected** when the server is gone. If the panel cannot reach the server, check that the dev server is running, then reload.
