# Angular DevTools

Inspect Angular component trees, signals, dependency injection, routes, forms, pipes and NgRx stores at dev time, build time, or through a coding agent. Built with [Devframe](https://devfra.me) so the same tool runs as an embedded panel, standalone CLI, static report, MCP server, or Chrome DevTools extension.

## Documentation

The full documentation lives in [`apps/docs`](./apps/docs/src/content/getting-started/introduction.md):

- [Getting started](./apps/docs/src/content/getting-started/introduction.md): install, Express SSR, Vite and Analog, the CLI, the popup and hub, the overlay, and the Chrome extension
- [Inspectors](./apps/docs/src/content/inspectors/dashboard.md): Dashboard, Components, Injectors, Signals, NgRx Store, Forms, Router, Pipes, SSR & HTTP, and Analog
- [Agent tools](./apps/docs/src/content/agents/mcp-server.md): the MCP server, every tool and resource
- [Security](./apps/docs/src/content/security.md): local-only access and what is redacted
- [Contributing](./apps/docs/src/content/contributing/development.md): development setup, demo apps, the extension and publishing

Links inside these pages point to docs site routes, so they don't work when you read the files on GitHub. To follow them, run the docs site locally with `pnpm docs:dev`.

## Quick start

```sh
npm install @santoshyadavdev/ng-devtools devframe
```

**Angular app with SSR (Express)**: mount the devtools hub in your server.

```ts
// server.ts
import { initNgDevtoolsHub } from '@santoshyadavdev/ng-devtools/hub';

const devtools = initNgDevtoolsHub({ ws: false });
app.use(devtools.nodeMiddleware);
```

**Analog (Vite)**: add the plugin next to `analog()`.

```ts
// vite.config.ts
import analog from '@analogjs/platform';
import ngDevtools from '@santoshyadavdev/ng-devtools/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [analog(), ngDevtools()],
});
```

Then load the overlay in development, and a floating button appears on your page:

```ts
import '@santoshyadavdev/ng-devtools/overlay';
```

**Coding agents**: run the MCP server.

```sh
npx @santoshyadavdev/ng-devtools mcp
```

## Community

Join the conversation, ask questions, and share feedback on [Discord](https://discord.gg/YRTyJd6Qx).

## Sponsors

If Angular DevTools helps your work, please consider [sponsoring the project on GitHub](https://github.com/sponsors/santoshyadavdev). Your support keeps development going.

Thanks to our current sponsors:

<!-- sponsors -->

<a href="https://github.com/coderabbitai"><img src="https://github.com/coderabbitai.png?size=60" width="60" height="60" alt="CodeRabbit" /></a>
<a href="https://github.com/umairhm"><img src="https://github.com/umairhm.png?size=60" width="60" height="60" alt="umairhm" /></a>
<a href="https://github.com/Sonichigo"><img src="https://github.com/Sonichigo.png?size=60" width="60" height="60" alt="Sonichigo" /></a>
<!-- /sponsors -->

## License

MIT
