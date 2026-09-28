---
title: Build the extension
description: Build, load and package the Chrome DevTools extension.
---

<ngmd-hero title="Build the extension" logo="https://cdn.simpleicons.org/googlechrome/4285F4" gradient>
  A thin Manifest V3 shell around the devtools UI. Build it, load it unpacked, and zip it for the Chrome Web Store.
</ngmd-hero>

# Build the extension

The Chrome extension lives in `extension/`. It detects Angular pages, creates the panel, and loads the devtools UI from `extension/ui`.

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

### What the manifest asks for

<ngmd-card-grid columns="3">
  <ngmd-card icon="shield" title="No permissions">
    <code>permissions</code> is empty.
  </ngmd-card>
  <ngmd-card icon="compass" title="Loopback hosts only">
    Host access to <code>localhost</code> and <code>127.0.0.1</code>, over HTTP and HTTPS.
  </ngmd-card>
  <ngmd-card icon="settings" title="Chrome 111 or later">
    Set by <code>minimum_chrome_version</code>.
  </ngmd-card>
</ngmd-card-grid>

## Build

```bash
pnpm extension:build
```

This builds the devtools UI (`pnpm devtools:build`), then replaces `extension/ui` with a copy of `dist/devtools-ui`.

<ngmd-callout type="warning" title="Commit extension/ui">
  <code>extension/ui</code> is committed. If you change <code>app/</code>, run <code>pnpm extension:build</code> and commit the result. CI builds the extension and fails when <code>extension/ui</code> is stale.
</ngmd-callout>

## Load in Chrome

<ngmd-workflow>
  <ngmd-step title="Open the extensions page">
    Go to <code>chrome://extensions</code>.
  </ngmd-step>
  <ngmd-step title="Turn on Developer mode">
    Use the toggle in the top right corner.
  </ngmd-step>
  <ngmd-step title="Load it unpacked">
    Click <strong>Load unpacked</strong> and select the <code>extension/</code> directory.
  </ngmd-step>
  <ngmd-step title="Open DevTools on an Angular app">
    Start a demo app and open DevTools. The <strong>Angular DevTools</strong> panel appears once the page is detected as Angular.
  </ngmd-step>
</ngmd-workflow>

After a rebuild, click the reload icon on the extension card, then reopen DevTools.

## Package for the Chrome Web Store

```bash
pnpm extension:zip
```

This runs `extension:build`, then writes `dist/ng-devtools-extension.zip`. `.DS_Store` files are left out.

### Upload

1. Bump `version` in `extension/manifest.json`.
2. Go to the <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer">Chrome Developer Dashboard</a>.
3. Click **New item** (or open the existing item) and upload the zip.
4. Fill in the listing details and submit for review.

<ngmd-alert severity="helpful">
  The privacy policy for the listing is in <code>docs/privacy-policy.html</code>.
</ngmd-alert>

## How the panel connects

### Finding the server

`panel-bridge.js` reads the origin of the inspected page. On `localhost` and `127.0.0.1`, it looks for the devtools server at these paths, in order:

1. `/__ng-devtools/`
2. `/__devframes/ng-devtools/`
3. `/__devframe/`
4. `/`

It passes the first path that serves a devframe connection file to the UI. It runs the search again after each navigation.

### Other hosts

The UI accepts a loopback address only when it runs inside the extension. On other hosts, the panel shows the UI without a connection.

## Where to next

<ngmd-pill-row>
  <ngmd-pill href="/getting-started/chrome-extension" title="Use the extension"></ngmd-pill>
  <ngmd-pill href="/contributing/publishing" title="Publishing"></ngmd-pill>
  <ngmd-pill href="/contributing/development" title="Development setup"></ngmd-pill>
</ngmd-pill-row>
