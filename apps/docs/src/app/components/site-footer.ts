import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GithubIcon } from '../ui/github-icon';
import { DiscordIcon } from '../ui/discord-icon';
import siteConfig from '../../ngmd.config';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, GithubIcon, DiscordIcon],
  template: `
    <footer
      class="border-t border-zinc-200 dark:border-zinc-800 py-6 px-4 sm:px-6 text-sm text-zinc-600 dark:text-zinc-400"
    >
      <div class="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© {{ year }} {{ name }} contributors. Released under the MIT License.</span>
        <nav class="flex flex-wrap items-center gap-4" aria-label="Project links">
          <a routerLink="/sponsors" class="hover:text-zinc-900 dark:hover:text-zinc-200">Sponsor</a>
          @if (discordUrl) {
            <a
              [href]="discordUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              <svg ngmdDiscordIcon class="size-4"></svg>
              Discord
            </a>
          }
          <a
            [href]="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            <svg ngmdGithubIcon class="size-4"></svg>
            {{ repo }}
          </a>
        </nav>
      </div>
    </footer>
  `,
})
export class SiteFooter {
  readonly year = new Date().getFullYear();
  readonly name = siteConfig.site.name;
  readonly githubUrl = siteConfig.site.githubUrl;
  readonly discordUrl = siteConfig.site.links?.discord;
  readonly repo = new URL(siteConfig.site.githubUrl).pathname.replace(/^\/+/, '');
}
