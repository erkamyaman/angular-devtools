---
title: Build the extension
description: Build, load and package the Chrome DevTools extension.
---

# Build the extension

The Chrome extension lives in `extension/`. It is a thin shell: it detects Angular pages, creates the panel, and loads the devtools UI from `extension/ui`.

## Files

```text
extension/
  manifest.json          # Manifest V3, host access to localhost and 127.0.0.1
  background.js          # Tracks which tabs run Angular
  content-script.js      # Relays the detection result to the background worker
  detect-angular.js      # Runs in the page, looks for ng-version or window.ng
  devtools.html
  devtools.js            # Creates the panel on Angular pages
  panel.html
  panel-bridge.js        # Finds the dev server and connects the UI to it
  icons/
  ui/                    # The built devtools UI (committed)
```

## Build

```bash
pnpm extension:build
```

This builds the devtools UI (`pnpm devtools:build`) and copies `dist/devtools-ui` into `extension/ui`.

`extension/ui` is committed. If you change `app/`, run `pnpm extension:build` and commit the result. CI fails when it is stale.

## Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory
4. Open DevTools on an Angular app. The panel appears.

## Package for the Chrome Web Store

```bash
pnpm extension:zip
```

This runs `extension:build`, then writes `dist/ng-devtools-extension.zip`.

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New item** and upload the zip
3. Fill in the listing details and submit for review

Bump `version` in `extension/manifest.json` before each upload. The privacy policy for the listing is in `docs/privacy-policy.html`.

## How the panel connects

`panel-bridge.js` reads the origin of the inspected page. On `localhost` and `127.0.0.1`, it looks for the devtools server at `/__ng-devtools/`, `/__devframes/ng-devtools/`, `/__devframe/` and `/`, and passes the address to the UI. The UI accepts a loopback address only when it runs inside the extension. On other hosts, the panel shows the UI without a connection.
