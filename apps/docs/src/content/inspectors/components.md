---
title: Components
description: Every component instance on the page, with live inputs, outputs and injected services.
---

# Components

The Components tab lists every component instance on the page, in the order Angular rendered them. Hover a row to highlight its host element in the page. Select it to read its live inputs, outputs and injected services.

## Where the data comes from

- **Live**: the [overlay](/getting-started/overlay) walks the page with Angular's debug API and sends the tree every few seconds.
- **Source**: the server scans your files for `@Component` and `@Directive` classes. The tab falls back to this list when no page is connected, or when the page reports no instances (for example a production build).

## The tree

Each row shows the class name, the host tag, a chip with the route path for routed components, and **+N** when directives sit on the same host. Filter by class, tag or directive name.

- **Hover or focus** a row to highlight the element in the page.
- **Click** a row, or press Enter or Space, to select it.
- Use the arrow keys, Home and End to move through the tree.

The tree shows up to 2000 components. A notice appears when the page has more.

## Details

The detail panel for the selected instance shows:

- The class name, the host tag, and the source file and line.
- **Change detection**, **Encapsulation**, the **Host path**, and for routed components, the route and outlet that rendered it.
- **Inputs** with their live values (and aliases).
- **Outputs**, each marked **listened** or **no listener**.
- **DOM listeners** on the host element.
- One block per directive on the host.
- **Injected**: each token the component injects, with its flags and the injector that provided it, or **not provided**.

When a form belongs to the selected component, a **Show … in Forms** button opens it in the [Forms tab](/inspectors/forms).

## Source mode

Without live data, the tab lists what the source declares. Expand a row to see its class, file, standalone flag, inputs and outputs. Use **Refresh** to scan again.

## For agents

- `ng-devtools:get-components` lists components and directives from source.
- `ng-devtools:highlight` highlights a component in the page.
- The `ng-devtools:component-tree` resource holds the live tree.

See [Tools](/agents/tools) and [Resources](/agents/resources).

## Requirements

Live data needs a development build, because it reads `ng.getComponent` from Angular's debug API. Input values are shortened: nested values stop at a few levels, and long strings are cut. Values with secret-looking names are replaced with `[redacted]`. See [Security](/security).
