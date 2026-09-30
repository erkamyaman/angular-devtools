<!--
Title format (becomes the squash commit on main):
<type>(<scope>): <short summary>
See docs/contributing/commit-message-guidelines.md
-->

## What and why

<!-- What does this change, and why is it needed? Link the issue: Fixes #123 -->

## How it was verified

- [ ] `pnpm commit:check` (commit messages follow the guidelines)
- [ ] `pnpm format:check`
- [ ] `pnpm typecheck` and the `ngc` template check (`pnpm exec ngc -p app/tsconfig.json --noEmit`)
- [ ] `pnpm test` and `pnpm test:devtools`
- [ ] `pnpm skills:check` (when `.claude/` changed)
- [ ] `pnpm docs:build` and the docs updated (when behavior, options or agent tools changed)
- [ ] `pnpm extension:build` and `extension/ui` committed (when `app/` changed)
- [ ] Checked in the browser with axe (when the UI changed)

## Screenshots

<!-- For UI changes: before and after, dark theme, and a narrow width if layout changed. -->

## Notes for reviewers

<!-- Anything unusual: trade-offs, follow-ups, known limits. -->
