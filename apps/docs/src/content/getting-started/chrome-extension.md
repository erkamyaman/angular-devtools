---
title: Chrome extension
description: Open the devtools as a panel inside Chrome DevTools.
---

# Chrome extension

The Chrome extension adds a panel to Chrome DevTools. The panel loads the devtools UI and connects it to the dev server of the page you are inspecting.

## Install

The extension lives in the `extension/` folder of the repository. Build it and load it unpacked:

1. Run `pnpm extension:build` in the repository.
2. Go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/` directory.
5. Open DevTools on an Angular app. The panel appears.

[Build the extension](/contributing/chrome-extension) covers the build and the store package in detail.

## How it works

- A content script checks each page for Angular (an `ng-version` attribute or `window.ng`). The panel is created only on Angular pages.
- On pages served from `localhost` or `127.0.0.1`, the panel looks for the devtools server on the same origin, at `/__ng-devtools/`, `/__devframes/ng-devtools/`, `/__devframe/` and `/`. When it finds one, it connects the UI to it.
- On other hosts, the panel shows the UI without a connection.
- When the inspected page navigates, the panel looks for the server again.

The page still needs the devtools mounted on its server and the [overlay](/getting-started/overlay) loaded. The extension replaces the floating button, not the setup.

## Permissions

The extension needs Chrome 111 or later. It requests no permissions beyond host access to `localhost` and `127.0.0.1`. It detects Angular on every page, but it only connects to local dev servers.
