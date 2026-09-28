---
title: Standalone CLI
description: Run the devtools from the command line, build a static report, or start an MCP server.
---

# Standalone CLI

The package installs an `ng-devtools` binary. Run it from the root of your Angular workspace.

```bash
# Dev server with live RPC
npx @santoshyadavdev/ng-devtools dev

# Static report (offline HTML)
npx @santoshyadavdev/ng-devtools build --outDir dist-report

# MCP server for coding agents
npx @santoshyadavdev/ng-devtools mcp
```

## Dev server

The default command starts a local server with the devtools UI. `dev` is optional: `npx @santoshyadavdev/ng-devtools` does the same.

| Flag                  | What it does                                                                        |
| --------------------- | ----------------------------------------------------------------------------------- |
| `--port <port>`       | Port to listen on. The default is 9999. If it is taken, the next free port is used. |
| `--host <host>`       | Host to bind to. The default is `localhost`.                                        |
| `--open`, `--no-open` | Open the browser on start, or not.                                                  |
| `--no-auth`           | Turn off the one-time code the server asks for.                                     |
| `--mcp`, `--no-mcp`   | Mount the MCP endpoint at `/__mcp`, or not. It is on by default.                    |

The server scans the source files in the current directory. No page is connected to it, so the tabs show what your source declares: components, routes, signals, providers, NgRx declarations and pipes. For live data, mount the devtools in your app's own server. See [Angular CLI and Express](/getting-started/express) or [Vite and Analog](/getting-started/vite).

## Static report

`build` writes a self-contained static copy of the devtools with the source scan baked in. Open it offline or host it anywhere.

| Flag             | What it does                                          |
| ---------------- | ----------------------------------------------------- |
| `--outDir <dir>` | Output directory. The default is `dist-static`.       |
| `--pretty`       | Pretty-print the data files. They get larger on disk. |

## MCP server

`mcp` starts an MCP server over stdio for coding agents. It has no page connected, so only the source scan tools return data. See [MCP server](/agents/mcp-server) for client setup and for the HTTP endpoint that gives agents live data.
