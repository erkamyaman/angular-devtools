---
title: Pipes
description: Custom and built-in pipes, where they are used, live instances, call recording and a pipe lint.
---

# Pipes

The Pipes tab lists the pipes your templates use: your own `@Pipe` classes and the built-in pipes from `@angular/common`. It shows where each one is declared and used, which components use it on the page, and what it last returned.

## Where the data comes from

- **Source**: the server scans your files for `@Pipe` classes (name, class, file, standalone and pure flags). Built-in pipes are listed when a template uses them, with every usage site.
- **Live**: the [overlay](/getting-started/overlay) finds pipe instances in the rendered views. This is read-only until you turn on recording. It needs a development build.
- **Lint**: the server checks your source for common pipe mistakes.

## Pipe list

Search by pipe name, class or file, and narrow the list with **Show pipes**: **All pipes**, **Custom**, **Built-in**, **Impure** or **On the page**. Each row shows the pipe name, its class, and chips for **N live**, **built-in**, **NgModule** (not standalone), **pure** or **impure**. Hover a row to highlight the first component that uses it.

## Details

Select a pipe to see:

- **Declaration**: its class, whether it comes from `@angular/common` or your project, its file, whether it is standalone, and whether it is pure. A pure pipe reruns only when an input changes. An impure pipe reruns on every check.
- **Used in templates**: for built-in pipes, every usage site.
- **Live on the page**: the number of instances and the components that use them. Click, hover or focus a component chip to highlight it.

## Record calls

Click **Record calls** to count calls and keep the last input and output of each pipe. Recording patches each pipe's `transform` in the inspected page, on every connected tab. Click **Stop recording** when you are done.

With recording on, the detail panel shows the call count, the last input and output, a per-instance breakdown and the last caller.

A pure pipe only runs when Angular sees a changed argument. While recording, the tab can warn when a pure pipe got an argument whose contents changed while its reference stayed the same, so it may show a stale value. This warning is experimental.

## Async subscriptions

When templates use `| async`, the tab lists each subscription with its component and latest value. Each `| async` subscribes on its own. Two on the same source mean the work runs twice, so those rows are marked **duplicate subscription**.

## Lint

| Rule                       | Severity | Finds                                                                                                                |
| -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `impure-pipe-in-for`       | warning  | An impure pipe inside an `@for` block. It runs on every check, possibly once per row.                                |
| `json-pipe-in-template`    | info     | `\| json` left in a template. It is a debugging aid.                                                                 |
| `signal-read-in-pure-pipe` | warning  | A pure pipe whose `transform()` reads a signal. Its memoization only tracks its arguments, not the signals it reads. |

## For agents

- `ng-devtools:get-pipes` lists custom pipes and the built-in pipes in use.
- `ng-devtools:lint-pipes` runs the checks above.
- `ng-devtools:explain-pipe` explains one pipe by name: where it is declared or used, purity, live counts, last input and output, the stale warning and lint findings.
