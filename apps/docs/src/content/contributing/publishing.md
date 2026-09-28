---
title: Publishing
description: Publish the npm package.
---

# Publishing

The devtool ships as one npm package, `@santoshyadavdev/ng-devtools`: Node-side logic, RPC, CLI, overlay, popup, and the built UI in `dist/public`.

```bash
# Builds on prepack, then publishes
pnpm devtools:publish
```

## Steps

1. Update the version in `packages/ng-devtools/package.json`.
2. Run `pnpm devtools:publish`. The package build bundles the UI.

To build the package without publishing, run `pnpm devtools:build-pkg`.

The Chrome extension has its own version in `extension/manifest.json`. See [Build the extension](/contributing/chrome-extension).
