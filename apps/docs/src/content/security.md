---
title: Access and redaction
description: Who can reach the devtools, and which values are redacted before they leave the page.
---

# Access and redaction

The devtools read your running app and send what they find to a server on your machine. This page covers who can reach that server, and what is redacted on the way.

## Local-only access

### Vite plugin

The devtools only answer this machine, and only pages served from `localhost`, `127.0.0.1` or the Chrome extension, so another website open in your browser can't reach them. If you open the dev server through another hostname that points to your machine (for example `myapp.test`), list it in Vite's `server.allowedHosts` and the devtools trust it too. Other origins can be added with `ngDevtools({ allowedOrigins: ['https://tunnel.example'] })`.

In detail, a request to the devtools must:

- come from a loopback address (`127.0.0.1` or `::1`), and
- have no `Origin` header, or an origin that is a loopback host, a Chrome extension, an entry in `allowedOrigins`, or a host that Vite's `server.allowedHosts` accepts.

Other requests get `403` with the message "ng-devtools only answers requests from this machine." WebSocket upgrades follow the same rules.

```ts
// vite.config.ts
export default defineConfig({
  server: { allowedHosts: ['myapp.test'] },
  plugins: [analog(), ngDevtools({ allowedOrigins: ['https://tunnel.example'] })],
});
```

### Express hub

`initNgDevtoolsHub()` has two checks, both on by default:

- **One-time code** (`auth`): the server prints a code, and a browser can read data only after it exchanges that code. Pass `auth: false` to turn it off on a machine only you use.
- **Origin check** (`allowedOrigins`): only loopback origins can open the WebSocket. Pass a list to allow more origins. `false` turns the check off.

```ts
// server.ts
const devtools = initNgDevtoolsHub({
  auth: false,
  allowedOrigins: ['https://tunnel.example'],
});
app.use(devtools.nodeMiddleware);
```

The demo app in this repository sets `allowedOrigins: false` because it runs as a public demo. Keep the check on for your own apps.

### MCP endpoint

The HTTP MCP endpoint answers only requests from a loopback address that carry a loopback `Origin` header. See [MCP server](/agents/mcp-server#http).

### Chrome extension

The extension connects only to pages served from `localhost` or `127.0.0.1`. On other hosts the panel shows the UI without data.

## What is redacted

Live values leave the page: they are sent to the devtools server, shown in the panel and returned to agents. Redacted values are replaced with `[redacted]`.

### Forms

Values of password fields, fields with a password, one-time-code or credit-card `autocomplete`, fields inside `.sentry-mask`, `.rr-mask`, `[data-private]` or `[data-ng-devtools="mask"]`, and fields whose name contains a secret word (password, token, card, cvv, apiKey and similar) are replaced with `[redacted]`, and those values are also removed from error messages. `[data-ng-devtools="unmask"]` opts a field back in; `window.__NG_DEVTOOLS_FORMS__ = { mask: ['iban'], unmask: ['passport'] }` does the same by key. DevTools never writes secret fields. Other values are sent as they are, so keep real credentials out of forms you inspect, and don't expose the dev server beyond localhost.

The secret words are: password, passwd, passphrase, passcode, pass, pwd, secret, token, otp, totp, pin, cvv, cvc, csc, ssn, iban, card, cc, credential and credentials. Names are split on camelCase and punctuation, so `userPassword` and `card_number` both match. The pairs apiKey, privateKey, secretKey, accessKey, ccNum, ccNumber and securityCode match as well.

### Router

Query, matrix and fragment keys that look secret (token, password, api key, code, sig, session, jwt and similar), including inside encoded return URLs, JWTs, bearer tokens, long opaque tokens and route params with such names are replaced with `[redacted]` in URLs, params, data and messages. A secret route param is only known once the route is recognized or found in the config, so a navigation that fails before that (for example inside a lazy route that failed to load) can still show it in its URL.

A navigation whose URL was redacted cannot be replayed.

### Components, signals and NgRx

Component inputs, signal values and NgRx state use the same secret names as forms. A value whose name looks secret is replaced with `[redacted]`. JWTs and bearer tokens inside strings and error messages are replaced too.

### Analog

Server call previews and URLs are redacted: secret-looking keys in JSON bodies, secret query parameters, JWTs and bearer tokens. Only JSON and plain text responses get a preview, and it is cut at 1000 characters. The `load()` data preview on the open page redacts secret-looking keys too.

### Not redacted

Response previews and TransferState values in the [SSR & HTTP tab](/inspectors/ssr-http) are not redacted: they are sent to the devtools server as they are, so don't expose the dev server beyond localhost.
