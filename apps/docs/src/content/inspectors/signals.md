---
title: Signals
description: The live signal graph of one component, with a value history per signal.
---

# Signals

The Signals tab shows the live signal graph of one component: its signal, computed, linkedSignal and effect nodes, and the edges between them. Only signals that a template or an effect has read appear. A signal nothing has read yet is not part of the graph.

## Where the data comes from

- **Live**: the [overlay](/getting-started/overlay) reads the graph with Angular's debug API. This needs Angular 19 or later and a development build.
- **Source**: without a live graph, the tab lists `signal()`, `computed()`, `linkedSignal()`, `effect()`, `toSignal()` and resource declarations found in your files, with signal inputs, models and queries.

## Pick a component

The **Component** picker at the top selects whose graph you see.

- **Follow the routed component** (the default) shows the component the router rendered.
- Pick any live component to pin the graph to it. Duplicates are numbered, for example `#2`.
- Without a routed component, the tab shows the first component that has signals.

A notice appears when the picked component is gone or has no graph, and the tab shows another one. The agent tool `ng-devtools:highlight` also switches the graph to the component it highlights.

## Nodes

Filter by name, or by kind with the chips. Each node card shows its kind, label, current value, epoch, dependencies and consumers, plus a **N changes** badge.

Expand a node to see:

- **Dependencies (producers)**: the nodes it reads.
- **Consumers**: the nodes and effects that read it.
- **Value history**: recent values, newest first, each with a time and a source tag.

| Source tag | Meaning                                     |
| ---------- | ------------------------------------------- |
| set        | The value was written. This entry is exact. |
| sampled    | The overlay saw a new value while polling.  |
| initial    | The first value the overlay saw.            |

The history keeps 50 changes per signal. When values change faster than the overlay polls, an entry says how many earlier values were not captured.

## For agents

- `ng-devtools:get-signals` lists signal declarations from source.
- `ng-devtools:inspect-signals` returns the graph the page reported, with history.
- The `ng-devtools:signal-graph` resource holds the live graph.

## Tips

- If a signal is missing, check that something reads it. Signals join the graph when a template or effect reads them.
- The graph shows up to 400 nodes.
