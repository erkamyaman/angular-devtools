import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutMode } from '../layout-mode.service';
import { NgmdCard, NgmdCardGrid, NgmdCodeBlock, NgmdTab, NgmdTabs } from '../ui';
import { GithubIcon } from '../ui/github-icon';
import { DiscordIcon } from '../ui/discord-icon';
import { SponsorList } from '../components/sponsor-list';
import siteConfig from '../../ngmd.config';

const INSTALL = `npm install @santoshyadavdev/ng-devtools devframe`;

const EXPRESS = `// server.ts
import { initNgDevtoolsHub } from '@santoshyadavdev/ng-devtools/hub';

const devtools = initNgDevtoolsHub({ ws: false });
app.use(devtools.nodeMiddleware);`;

const VITE = `// vite.config.ts
import analog from '@analogjs/platform';
import ngDevtools from '@santoshyadavdev/ng-devtools/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [analog(), ngDevtools()],
});`;

const MCP = `{
  "mcpServers": {
    "ng-devtools": {
      "command": "npx",
      "args": ["@santoshyadavdev/ng-devtools", "mcp"]
    }
  }
}`;

interface Feature {
  title: string;
  icon: string;
  link: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    title: 'Components',
    icon: 'box',
    link: '/inspectors/components',
    body: 'Every instance on the page with live inputs, outputs, change detection and injected services.',
  },
  {
    title: 'Signals',
    icon: 'zap',
    link: '/inspectors/signals',
    body: 'The live signal graph of a component, with a value history for each signal.',
  },
  {
    title: 'Injectors',
    icon: 'layers',
    link: '/inspectors/injectors',
    body: 'The injector hierarchy, the lookup path for any token, and the providers at each level.',
  },
  {
    title: 'Router',
    icon: 'compass',
    link: '/inspectors/router',
    body: 'Every navigation as a story: who started it, redirects, timing, and the guard that decided it.',
  },
  {
    title: 'Forms',
    icon: 'file',
    link: '/inspectors/forms',
    body: 'Signal Forms, reactive and template-driven forms with readable errors, a timeline and a lint.',
  },
  {
    title: 'NgRx Store',
    icon: 'settings',
    link: '/inspectors/ngrx-store',
    body: 'Live signal stores and @ngrx/store state with change logs, diffs and restore.',
  },
  {
    title: 'SSR & HTTP',
    icon: 'rocket',
    link: '/inspectors/ssr-http',
    body: 'SSR and client HTTP calls, fault injection, hydration stats and the TransferState payload.',
  },
  {
    title: 'Agent tools',
    icon: 'sparkles',
    link: '/agents/tools',
    body: 'More than 40 MCP tools, so your coding agent can read and act on the running app.',
  },
  {
    title: 'Local only',
    icon: 'shield',
    link: '/security',
    body: 'The devtools answer only your machine, and secret-looking values are redacted.',
  },
];

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    NgmdCard,
    NgmdCardGrid,
    NgmdCodeBlock,
    NgmdTab,
    NgmdTabs,
    GithubIcon,
    DiscordIcon,
    SponsorList,
  ],
  template: `
    <div class="relative overflow-hidden">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-80"
        style="background-image: var(--accent-gradient-soft)"
        aria-hidden="true"
      ></div>

      <section class="relative mx-auto max-w-5xl px-4 sm:px-6 pt-20 pb-16 text-center">
        <img src="/logo-mark.svg" alt="" class="mx-auto size-16" aria-hidden="true" />
        <h1 class="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">
          <span
            class="bg-clip-text text-transparent"
            style="background-image: var(--accent-gradient)"
          >
            {{ name }}
          </span>
        </h1>
        <p class="mx-auto mt-5 max-w-2xl text-lg text-zinc-700 dark:text-zinc-300">
          {{ description }}
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            routerLink="/getting-started/introduction"
            class="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold bg-[color:var(--accent)] text-[color:var(--accent-fg)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
          >
            Get started
          </a>
          <a
            routerLink="/agents/mcp-server"
            class="inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Connect an agent
          </a>
          <a
            [href]="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <svg ngmdGithubIcon class="size-4"></svg>
            GitHub
          </a>
        </div>
      </section>
    </div>

    <section class="mx-auto max-w-5xl px-4 sm:px-6 pb-16" aria-labelledby="features-heading">
      <h2 id="features-heading" class="text-2xl font-bold tracking-tight">What you can inspect</h2>
      <p class="mt-2 text-zinc-700 dark:text-zinc-300">
        Run it in the page, from the CLI, in Chrome DevTools, or through your coding agent.
      </p>
      <ngmd-card-grid columns="3">
        @for (feature of features; track feature.link) {
          <ngmd-card [title]="feature.title" [icon]="feature.icon" [link]="feature.link">
            {{ feature.body }}
          </ngmd-card>
        }
      </ngmd-card-grid>
    </section>

    <section class="mx-auto max-w-5xl px-4 sm:px-6 pb-16" aria-labelledby="quick-start-heading">
      <h2 id="quick-start-heading" class="text-2xl font-bold tracking-tight">Quick start</h2>
      <p class="mt-2 text-zinc-700 dark:text-zinc-300">
        Install the package, then mount the devtools where your app runs.
      </p>
      <ngmd-code-block header="Terminal" language="bash" [code]="install" />
      <ngmd-tabs>
        <ngmd-tab title="Express (SSR)" icon="terminal">
          <ngmd-code-block header="server.ts" language="ts" [code]="express" />
        </ngmd-tab>
        <ngmd-tab title="Vite and Analog" icon="zap">
          <ngmd-code-block header="vite.config.ts" language="ts" [code]="vite" />
        </ngmd-tab>
        <ngmd-tab title="MCP (stdio)" icon="sparkles">
          <ngmd-code-block header="claude_desktop_config.json" language="json" [code]="mcp" />
        </ngmd-tab>
      </ngmd-tabs>
      <p class="text-zinc-700 dark:text-zinc-300">
        Then load the overlay in your app.
        <a
          routerLink="/getting-started/installation"
          class="font-medium underline underline-offset-4 hover:text-[color:var(--accent)]"
          >Read the installation guide</a
        >.
      </p>
    </section>

    <section class="mx-auto max-w-5xl px-4 sm:px-6 pb-16" aria-labelledby="sponsors-heading">
      <h2 id="sponsors-heading" class="text-2xl font-bold tracking-tight">Sponsors</h2>
      <p class="mt-2 text-zinc-700 dark:text-zinc-300">
        Thanks to our current sponsors. Your support keeps development going.
      </p>
      <div class="mt-4">
        <app-sponsor-list />
      </div>
      <a
        [href]="sponsorUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-4 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold bg-[color:var(--accent)] text-[color:var(--accent-fg)] hover:opacity-90"
      >
        Sponsor on GitHub
      </a>
    </section>

    <section class="mx-auto max-w-5xl px-4 sm:px-6 pb-24" aria-labelledby="community-heading">
      <h2 id="community-heading" class="text-2xl font-bold tracking-tight">Community</h2>
      <p class="mt-2 text-zinc-700 dark:text-zinc-300">
        Ask questions, share feedback and follow development.
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        @if (discordUrl) {
          <a
            [href]="discordUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <svg ngmdDiscordIcon class="size-4"></svg>
            Discord
          </a>
        }
        <a
          [href]="githubUrl + '/issues'"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <svg ngmdGithubIcon class="size-4"></svg>
          Issues
        </a>
      </div>
    </section>
  `,
})
export default class HomePage {
  protected readonly name = siteConfig.site.name;
  protected readonly description = siteConfig.site.description;
  protected readonly githubUrl = siteConfig.site.githubUrl;
  protected readonly discordUrl = siteConfig.site.links?.discord;
  protected readonly sponsorUrl = siteConfig.site.links?.sponsor ?? '';
  protected readonly features = FEATURES;
  protected readonly install = INSTALL;
  protected readonly express = EXPRESS;
  protected readonly vite = VITE;
  protected readonly mcp = MCP;

  constructor() {
    inject(LayoutMode).chromeHidden.set(true);
  }
}
