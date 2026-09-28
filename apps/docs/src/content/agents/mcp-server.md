---
title: MCP server
description: Connect a coding agent to the devtools over stdio or HTTP.
---

# MCP server

The devtools expose their inspectors to coding agents as *MCP tools and resources. An agent can list your routes, read the live component tree, explain why a form is invalid, or navigate the app.

There are two ways to connect. Pick one based on the data your agent needs.

| Transport                   | Live page data                       | Setup                                |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| stdio (`ng-devtools mcp`)   | No. Source scan tools only.          | A command in your MCP client config. |
| HTTP (`/__devframes/__mcp`) | Yes, with the app open in a browser. | A URL on your app's dev server.      |

## stdio

The `mcp` command starts a server over stdio in the current directory. It scans your source, but no page ever connects to it, so tools that need the running app answer that no page is attached.

**Claude Desktop**: add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ng-devtools": {
      "command": "npx",
      "args": ["@santoshyadavdev/ng-devtools", "mcp"]
    }
  }
}
```

**VS Code**: add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "ng-devtools": {
      "command": "npx",
      "args": ["@santoshyadavdev/ng-devtools", "mcp"]
    }
  }
}
```

## HTTP

When the devtools are embedded in your app's server, the MCP endpoint is also available over HTTP at `/__devframes/__mcp` (or `/__ng-devtools/__mcp` without the hub). This endpoint sees the pages that are connected to that server, so the live tools work. Open the app in a browser with the [overlay](/getting-started/overlay) loaded, then call the tools.

| Setup                                   | Endpoint                                  |
| --------------------------------------- | ----------------------------------------- |
| [Express hub](/getting-started/express) | `http://localhost:4000/__devframes/__mcp` |
| [Vite plugin](/getting-started/vite)    | `http://localhost:5173/__devframes/__mcp` |
| [Standalone CLI](/getting-started/cli)  | `http://localhost:9999/__mcp`             |

Use the port your server actually runs on.

<ngmd-callout type="warning" title="Send an Origin header">
  The HTTP endpoint only answers requests from this machine that carry a local <code>Origin</code> header, such as <code>http://localhost:4000</code>. Requests without one get <code>403 Forbidden</code>. If your MCP client does not send an <code>Origin</code> header, add it in the client config.
</ngmd-callout>

For example, in `.vscode/mcp.json`:

```json
{
  "servers": {
    "ng-devtools": {
      "type": "http",
      "url": "http://localhost:4000/__devframes/__mcp",
      "headers": { "Origin": "http://localhost:4000" }
    }
  }
}
```

## Tool names

Tools are registered with a colon, as `ng-devtools:get-routes`. MCP clients see these with an underscore, as `ng-devtools_get-routes`. Calls with either form work.

Read-only tools are marked read-only for your client. Tools that act on the app (`highlight`, `navigate`, `form-action`, `fill-form` and `analog-call-api`) are not, so your client can ask before it runs them.

## Pages

Each browser tab reports on its own and gets a page id. Tools that read live data use the most recent page by default. Pass `page` (or `pageId`) to pick another tab. Pages that stop reporting are dropped after a short time.

## Next steps

- [Tools](/agents/tools): every tool with its inputs.
- [Resources](/agents/resources): live state an agent can read.
- [Security](/security): what leaves the page and what is redacted.
