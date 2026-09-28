# Contributing to Angular DevTools

Thanks for your interest in contributing! This guide covers how to set up the project, the rules we follow, and how to get a change merged.

## Guidelines

| Guide                                                                       | What it covers                                                    |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Commit message guidelines](docs/contributing/commit-message-guidelines.md) | `type(scope): summary`, types, scopes, body and footer            |
| [Coding standards](docs/contributing/coding-standards.md)                   | TypeScript and Angular rules, how collectors read the page, tests |
| [UI guidelines](docs/contributing/ui-guidelines.md)                         | Theme tokens, the brand palette, page anatomy, accessibility      |
| [`AGENTS.md`](AGENTS.md)                                                    | Angular best practices for people and AI agents                   |

## Prerequisites

- Node.js 24+
- pnpm 10+

## Setup

```sh
git clone https://github.com/santoshyadavdev/angular-devtools.git
cd angular-devtools
pnpm install
```

`pnpm install` also turns on the git hooks in `.githooks/`: `pre-commit` formats the files you stage with Prettier, and `commit-msg` checks your message against the [commit message guidelines](docs/contributing/commit-message-guidelines.md) and warns when it doesn't follow them. It also sets [`.gitmessage`](.gitmessage) as your commit template.

## Project structure

```
app/                          # The devtools panel (Angular + Vite), one view per hub dock
  src/app.ts                  # Panel shell: header, tabs, dock views
  src/pages/                  # Inspector pages (components, routes, signals, injectors, store, forms, pipes, network, analog, dashboard)
  src/ui/                     # Shared UI (the dropdown)
  src/styles/                 # Theme: palette, tokens, mixins
packages/
  ng-devtools/                # The publishable package
    src/hub.ts, hub-docks.ts  # @devframes/hub setup and the dock list
    src/devframe.ts           # Server side: RPC, shared state, agent tools
    src/overlay.ts            # Script that runs in the inspected page
    src/*-collector.ts        # What each inspector reads from the page
    src/popup.ts, vite.ts     # In-page launcher, Vite plugin
    src/rpc/                  # Source scans and agent tool helpers
extension/                    # Chrome extension (extension/ui is generated)
src/                          # Angular Travel, the demo app
examples/analog/              # Analog demo app
docs/contributing/            # The guides above
.claude/skills/, .claude/agents/  # Skills and roles for AI agents
```

## Development

```sh
pnpm start                  # Angular Travel with the devtools on :4200
pnpm build --configuration development && node dist/angular-devtools/server/server.mjs
                            # SSR demo on :4000 (a plain `pnpm build` turns the launcher off)
pnpm analog:dev             # Analog demo on :5173
pnpm devtools:dev           # The panel on its own
pnpm extension:build        # Rebuild the panel into extension/ui
```

## Making changes

- **A new inspector or a data fix:** follow [Reading data from the page](docs/contributing/coding-standards.md#reading-data-from-the-page-packagesng-devtools). Collection goes in its own module, reports carry a `pageId`, and the server expires and forgets pages.
- **A new tab:** add it to `app/src/types/tab.types.ts`, `allTabs` and the template in `app/src/app.ts`, an icon in `app/src/pages/tab-icon.ts`, and usually a Dashboard card.
- **UI changes:** follow the [UI guidelines](docs/contributing/ui-guidelines.md); use the theme variables, the SCSS mixins and the shared dropdown.
- **Agent tools:** register them with `ctx.agent.registerTool()` or an RPC function's `agent` field, describe what they return and when they are empty, and add tests.

## Testing

```sh
pnpm format:check
pnpm commit:check                             # commit messages on your branch
pnpm skills:check                             # agent skills and roles
pnpm typecheck
pnpm exec ngc -p app/tsconfig.json --noEmit   # panel template check
pnpm test                                     # demo app
pnpm test:devtools                            # devtools package
```

For UI changes, also check the pages in a browser with axe, in dark and light themes and at a narrow width. The [devtools-verify skill](.claude/skills/devtools-verify/SKILL.md) lists the exact steps.

## Submitting a pull request

1. Search the open issues and pull requests first. For a bigger feature, open an issue to discuss it before you start.
2. Fork the repository and create a branch from `main`.
3. Keep one feature per pull request, with its tests (and agent tool tests when tools change).
4. If you changed `app/`, run `pnpm extension:build` and commit `extension/ui`. CI fails when it is stale.
5. Make sure all the checks above pass.
6. Open the pull request against `main` and fill in the template. **The title must follow the [commit message format](docs/contributing/commit-message-guidelines.md)**, for example `feat(router): show guard results for lazy routes`; it becomes the commit on `main` when the pull request is squash merged. CI checks the title and every commit message; a local `commit-msg` hook (enabled by `pnpm install`) checks each commit as you make it, and `pnpm commit:check` checks your whole branch.
7. Address review feedback with [fixup commits](docs/contributing/using-fixup-commits.md); don't force-push over a review in progress unless asked.

## Working with AI agents

The repository ships skills and roles for AI coding agents, so changes made with an agent follow the same rules as everyone else's. Claude Code picks them up automatically from `.claude/`; other agents can read the same files.

### Skills (`.claude/skills/`)

| Skill                                                              | Use it when                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [`devtools-ui`](.claude/skills/devtools-ui/SKILL.md)               | Building or restyling anything in the panel                                |
| [`devtools-inspector`](.claude/skills/devtools-inspector/SKILL.md) | Adding an inspector or fixing the data it shows, including agent tools     |
| [`devtools-verify`](.claude/skills/devtools-verify/SKILL.md)       | Checking a change like CI and a reviewer would, including axe in a browser |
| [`devtools-commit`](.claude/skills/devtools-commit/SKILL.md)       | Writing commits, pull request titles and descriptions                      |

### Roles (`.claude/agents/`)

| Role                                                         | Does                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| [`ui-engineer`](.claude/agents/ui-engineer.md)               | Builds and restyles panel pages to the design system    |
| [`inspector-engineer`](.claude/agents/inspector-engineer.md) | Owns data collection, the server side and agent tools   |
| [`a11y-reviewer`](.claude/agents/a11y-reviewer.md)           | Audits accessibility and visual consistency (read only) |
| [`devtools-reviewer`](.claude/agents/devtools-reviewer.md)   | Reviews a diff against these guidelines (read only)     |

When you add a new area or change a rule, update the matching guide, skill and role in the same pull request so they don't drift apart. `pnpm skills:check` (also run in CI) validates their frontmatter and checks that the files and links they mention exist.
