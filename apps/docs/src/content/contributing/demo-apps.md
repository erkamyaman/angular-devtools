---
title: Demo apps
description: The Angular Travel demo and the Analog demo in the repository.
---

# Demo apps

The repository has two demo apps, so every inspector has something to show.

## Angular Travel

The repository includes a demo app, **Angular Travel** (`src/`), that looks and behaves like a real booking site so every inspector has something to show:

- **Destinations**: search, region filter and sort kept in the URL, backed by an `@ngrx/signals` store (`withState`, `withComputed`, `withMethods`)
- **Trip pages**: loaded by a resolver that redirects unknown trips, with a route title resolver
- **Booking**: a Signal Forms checkout with a departure date rule, a seat limit and an unsaved-changes guard
- **My Trips**: behind a sign-in guard that redirects to a reactive form and back
- **DevTools Lab** (`/examples`): small, focused pages for signals, components, DI, routes, forms, pipes and HTTP
- **SSR & HTTP** (`/examples/http`): a product list fetched from `/api/products` during SSR and replayed from the transfer cache. The endpoint accepts `?delay=` and `?fail=` for backend scenarios; run the SSR server (`pnpm build --configuration development && node dist/angular-devtools/server/server.mjs`) to see server calls

Run `pnpm start` and click the amber button in the corner to open the devtools. Destination photos are from Unsplash, credited in `public/destinations/CREDITS.md`.

The demo shows the full setup: the hub in `src/server.ts`, the overlay and `registerNgrxSignals` in `src/main.ts`, and the HTTP providers in `src/app/app.config.ts`.

## Analog demo

`examples/analog` is an Analog app wired with the [Vite plugin](/getting-started/vite).

```bash
pnpm analog:dev
```

The script builds the devtools package, then starts the Vite dev server.
