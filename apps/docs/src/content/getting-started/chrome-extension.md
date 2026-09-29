---
title: Chrome extension
description: Open the devtools as a panel inside Chrome DevTools.
---

<ngmd-hero title="Chrome extension" logo="https://cdn.simpleicons.org/googlechrome/4285F4" gradient>
  An Angular DevTools panel inside Chrome DevTools. It loads the devtools UI and connects it to the dev server of the page you inspect.
</ngmd-hero>

# Chrome extension

The Chrome extension adds a panel named **Angular DevTools** to Chrome DevTools. The panel loads the devtools UI and connects it to the dev server of the page you are inspecting.

<ngmd-callout type="info" title="An extra, not a setup">
  The page still needs the devtools mounted on its server and the <a href="/getting-started/overlay">overlay</a> loaded. The extension is one more way to open the devtools. It does not replace the setup. Start with <a href="/getting-started/express">Angular CLI and Express</a> or <a href="/getting-started/vite">Vite and Analog</a>.
</ngmd-callout>

## Before you start

<ngmd-card-grid columns="3">
  <ngmd-card icon="compass" title="Chrome 111 or later">
    The manifest sets <code>minimum_chrome_version</code> to 111.
  </ngmd-card>
  <ngmd-card icon="terminal" title="A clone of the repository">
    The extension lives in the <code>extension/</code> folder. You build it from source.
  </ngmd-card>
  <ngmd-card icon="box" title="Node.js 24 and pnpm">
    The repository itself needs Node.js 24 or later and pnpm 10 or later.
  </ngmd-card>
</ngmd-card-grid>

## Install

### Build and load it

<ngmd-workflow>
  <ngmd-step title="Install dependencies">
    Run <code>pnpm install</code> in the root of the repository.
  </ngmd-step>
  <ngmd-step title="Build the extension">
    Run <code>pnpm extension:build</code>. It builds the devtools UI and copies it into <code>extension/ui</code>.
  </ngmd-step>
  <ngmd-step title="Open the extensions page">
    Go to <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>.
  </ngmd-step>
  <ngmd-step title="Load it unpacked">
    Click <strong>Load unpacked</strong> and select the <code>extension/</code> directory.
  </ngmd-step>
  <ngmd-step title="Open DevTools on an Angular app">
    The <strong>Angular DevTools</strong> panel appears next to the built-in panels.
  </ngmd-step>
</ngmd-workflow>

### Commands

```bash
git clone https://github.com/santoshyadavdev/angular-devtools.git
cd angular-devtools
pnpm install
pnpm extension:build
```

[Build the extension](/contributing/chrome-extension) covers the build and the store package in detail.

## How it works

### Angular detection

A content script checks each page for Angular: an `ng-version` attribute or a `window.ng` global. It checks once, then retries for a few seconds for apps that bootstrap late. The extension creates the panel only on Angular pages.

### Finding the server

On pages served from `localhost` or `127.0.0.1`, the panel looks for the devtools server on the same origin. It tries these paths in order:

| Path                        | Mounted by                            |
| --------------------------- | ------------------------------------- |
| `/__ng-devtools/`           | A panel mounted with `initDevframe()` |
| `/__devframes/ng-devtools/` | The Express hub or the Vite plugin    |
| `/__devframe/`              | A bare devframe mount                 |
| `/`                         | A devframe served at the root         |

When it finds a connection file on one of them, it connects the UI to it.

### Other hosts

On other hosts, the panel shows the UI without a connection. It does not probe them.

### Navigation

When the inspected page navigates, the panel looks for the server again.

## Permissions

### Host access

The manifest asks for no `permissions`. Its host permissions cover only `localhost` and `127.0.0.1`, over HTTP and HTTPS.

### Content scripts

The content scripts are wider. Two of them run on every page. They check for an `ng-version` attribute or `window.ng`, and pass the Angular version to the extension. The panel only connects to local dev servers. The Vite plugin accepts requests from Chrome extension origins. See [Access and redaction](/security).

## FAQ

<ngmd-accordion>
  <ngmd-accordion-item title="The panel does not appear" open>
    The page did not look like an Angular app. Check that it renders an <code>ng-version</code> attribute or exposes <code>window.ng</code>, which development builds do. Then close and reopen DevTools.
  </ngmd-accordion-item>
  <ngmd-accordion-item title="The panel shows no data">
    Check that the page is served from <code>localhost</code> or <code>127.0.0.1</code>, that its server mounts the devtools, and that the overlay is loaded.
  </ngmd-accordion-item>
  <ngmd-accordion-item title="Does the floating button go away?">
    No. The overlay still adds the button to the page. Use the button or the panel, whichever you prefer.
  </ngmd-accordion-item>
</ngmd-accordion>

## Where to next

<ngmd-card-grid columns="2">
  <ngmd-card icon="wrench" title="Build the extension" link="/contributing/chrome-extension" cta="Build and package">
    The build, the zip and the store package.
  </ngmd-card>
  <ngmd-card icon="shield" title="Access and redaction" link="/security" cta="Security">
    Which origins the devtools trust.
  </ngmd-card>
</ngmd-card-grid>
