---
title: Analog
description: File routes, server calls, render modes, content and lint for Analog apps.
---

# Analog

The Analog tab shows how an *Analog app is put together and what its dev server does. With the hub mounted, it lives in the **Analog** dock.

The Analog dock is always in the rail, but it shows Analog data only in Analog apps; in other apps it shows a "This app doesn’t use Analog" page. In Analog apps it is also a tab when the panel is mounted without the hub, and the Routes tab and Dashboard switch to Analog's file routes and SSR setting.

## Requirements

Add the Vite plugin next to `analog()` and load the overlay. See [Vite and Analog](/getting-started/vite). The plugin records server calls on the dev server, and the overlay reports the page that is open in the browser.

## Where the data comes from

- **Source**: the server scans your pages, layouts, `.server.ts` files, server routes, content files and `vite.config.ts`.
- **Dev server**: the Vite plugin records page renders, `load()` fetches, server functions and API calls.
- **Live**: the overlay reports the open page, the `load()` data it received and its hydration state.

## Views

The summary at the top shows the Analog version and the number of pages, API routes, server calls and issues.

- **Routes**: every page, layout and markdown file with its URL, route groups, `[param]` and catch-all segments, `.server.ts` files and routeMeta. Test a URL to see which files render it.
- **Server**: page renders (server rendered or client only), `load()` fetches, server functions and API calls with status, time and a redacted preview, plus a request playground for API routes and a button to clear the list. A `load()` that runs while a page is server rendered and again in the browser right after it loads is flagged.
- **Render**: SSR, prerendered or client only per page, from config, build output and the last request. A prerender plan compares `prerender.routes` with your pages and the build output.
- **Content**: markdown files with title, URL, slug and date.
- **Lint**: checks for duplicate URLs, missing default exports, layouts without `<router-outlet>`, orphan `.server.ts` files, API method suffixes, prerender entries and frontmatter.

## For agents

The Analog tools read the same data:

- `ng-devtools:analog-routes`, `ng-devtools:analog-explain-url` and `ng-devtools:analog-current-page` for routes and the open page.
- `ng-devtools:analog-server-calls`, `ng-devtools:analog-api-routes` and `ng-devtools:analog-call-api` for the server.
- `ng-devtools:analog-render-modes` and `ng-devtools:analog-prerender-plan` for rendering.
- `ng-devtools:analog-content` and `ng-devtools:analog-lint` for content and checks.

`analog-call-api` sends a real request to your dev server. Methods other than GET, HEAD and OPTIONS need `confirm: true`. See [Tools](/agents/tools).

## Tips

Tested with Analog 2.7 on Angular 20 (a fresh app from the Analog template, npm and pnpm) and Angular 22. The demo lives in `examples/analog` (`pnpm analog:dev`).
