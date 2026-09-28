---
title: Access and redaction
description: Who can reach the devtools, and which values are redacted before they leave the page.
---

<ngmd-hero title="Access and redaction" gradient>
  The devtools send what they read from your app to a server on your machine. Here is who can reach that server, and what is redacted on the way.
</ngmd-hero>

# Access and redaction

The devtools read your running app and send what they find to a server on your machine. This page covers who can reach that server, and what is redacted on the way.

<ngmd-alert severity="critical">
  Don't expose the dev server beyond localhost. Some values, such as HTTP response previews, are sent as they are.
</ngmd-alert>

## At a glance

<ngmd-card-grid columns="2">
  <ngmd-card icon="zap" title="Vite plugin">
    Loopback requests only. Origins limited to loopback hosts, Chrome extensions, <code>allowedOrigins</code> and Vite's <code>server.allowedHosts</code>.
  </ngmd-card>
  <ngmd-card icon="layers" title="Express hub">
    A one-time code and a loopback origin check. Both on by default.
  </ngmd-card>
  <ngmd-card icon="terminal" title="Standalone CLI">
    Binds to <code>localhost</code> and asks for a one-time code by default.
  </ngmd-card>
  <ngmd-card icon="compass" title="Chrome extension">
    Connects only to pages served from <code>localhost</code> or <code>127.0.0.1</code>.
  </ngmd-card>
</ngmd-card-grid>

## Local-only access

### Vite plugin

The devtools only answer this machine, and only pages served from `localhost`, `127.0.0.1` or the Chrome extension, so another website open in your browser can't reach them.

In detail, a request to the devtools must:

- come from a loopback address (`127.0.0.1` or `::1`), and
- have no `Origin` header, or an origin that is a loopback host, a Chrome extension, an entry in `allowedOrigins`, or a host that Vite's `server.allowedHosts` accepts.

Other requests get `403` with the message "ng-devtools only answers requests from this machine." WebSocket upgrades follow the same rules.

If you open the dev server through another hostname that points to your machine (for example `myapp.test`), list it in Vite's `server.allowedHosts` and the devtools trust it too. Other origins can be added with `allowedOrigins`:

```ts {3-4}
// vite.config.ts
export default defineConfig({
  server: {allowedHosts: ['myapp.test']},
  plugins: [analog(), ngDevtools({allowedOrigins: ['https://tunnel.example']})],
});
```

The Vite plugin turns the one-time code off. The loopback and origin checks take its place.

### Express hub

`initNgDevtoolsHub()` has two checks, both on by default:

| Check         | Option           | What it does                                                                         |
| ------------- | ---------------- | ------------------------------------------------------------------------------------ |
| One-time code | `auth`           | The server prints a code. A browser can read data only after it exchanges that code. |
| Origin check  | `allowedOrigins` | Only loopback origins can open the WebSocket. Pass a list to allow more origins.     |

```ts {3-4}
// server.ts
const devtools = initNgDevtoolsHub({
  auth: false,
  allowedOrigins: ['https://tunnel.example'],
});
app.use(devtools.nodeMiddleware);
```

<ngmd-callout type="warning" title="Turning the checks off">
  Pass <code>auth: false</code> only on a machine only you use. <code>allowedOrigins: false</code> turns the origin check off. The demo app in this repository sets it because it runs as a public demo. Keep the check on for your own apps.
</ngmd-callout>

### Standalone CLI

The CLI server binds to `localhost` and asks for a one-time code. `--host` changes the bind address and `--no-auth` turns the code off. See [Standalone CLI](/getting-started/cli).

### MCP endpoint

The HTTP MCP endpoint answers only requests from a loopback address that carry a loopback `Origin` header. See [MCP server](/agents/mcp-server).

### Chrome extension

The extension connects only to pages served from `localhost` or `127.0.0.1`. On other hosts the panel shows the UI without data.

## What is redacted

Live values leave the page. They are sent to the devtools server, shown in the panel and returned to agents. Redacted values are replaced with `[redacted]`.

### Forms

A field's value is replaced with `[redacted]` when the field:

- is a password field,
- has a password, one-time-code or credit-card `autocomplete`,
- sits inside `.sentry-mask`, `.rr-mask`, `[data-private]` or `[data-ng-devtools="mask"]`, or
- has a name that contains a secret word (password, token, card, cvv, apiKey and similar).

Those values are also removed from error messages. DevTools never writes secret fields. Other values are sent as they are, so keep real credentials out of forms you inspect.

### Opt fields in or out

Mark a field in the template, or list keys on `window`:

```html
<input name="nickname" data-ng-devtools="mask" />
<input name="cardHolder" data-ng-devtools="unmask" />
```

```ts
window.__NG_DEVTOOLS_FORMS__ = {mask: ['iban'], unmask: ['passport']};
```

`[data-ng-devtools="unmask"]` opts a field back in. The `window` setting does the same by key.

<ngmd-accordion>
  <ngmd-accordion-item title="The full list of secret words">
    password, passwd, passphrase, passcode, pass, pwd, secret, token, otp, totp, pin, cvv, cvc, csc, ssn, iban, card, cc, credential and credentials. Names are split on camelCase and punctuation, so <code>userPassword</code> and <code>card_number</code> both match. The pairs apiKey, privateKey, secretKey, accessKey, ccNum, ccNumber and securityCode match as well.
  </ngmd-accordion-item>
</ngmd-accordion>

### Router

These are replaced with `[redacted]` in URLs, params, data and messages:

- query, matrix and fragment keys that look secret (token, password, api key, code, sig, session, jwt and similar), including inside encoded return URLs,
- JWTs, bearer tokens and long opaque tokens,
- route params with secret-looking names.

A secret route param is only known once the route is recognized or found in the config. A navigation that fails before that (for example inside a lazy route that failed to load) can still show it in its URL.

<ngmd-alert severity="info">
  A navigation whose URL was redacted cannot be replayed.
</ngmd-alert>

### Components, signals and NgRx

Component inputs, signal values and NgRx state use the same secret names as forms. A value whose name looks secret is replaced with `[redacted]`. JWTs and bearer tokens inside strings and error messages are replaced too.

### Analog

Server call previews and URLs are redacted: secret-looking keys in JSON bodies, secret query parameters, JWTs and bearer tokens. Only JSON and plain text responses get a preview, and it is cut at 1000 characters. The `load()` data preview on the open page redacts secret-looking keys too.

### Not redacted

<ngmd-callout type="danger" title="SSR & HTTP values are sent as they are">
  Response previews and TransferState values in the <a href="/inspectors/ssr-http">SSR & HTTP tab</a> are not redacted. They reach the devtools server unchanged, so don't expose the dev server beyond localhost.
</ngmd-callout>

## Checklist

<ngmd-workflow>
  <ngmd-step title="Keep it on your machine">
    Open the app on <code>localhost</code>. Add other hostnames or origins one by one, only when you need them.
  </ngmd-step>
  <ngmd-step title="Leave the checks on">
    Keep <code>auth</code> and the origin check on in the Express hub unless the machine is yours alone.
  </ngmd-step>
  <ngmd-step title="Use test data">
    Keep real credentials out of forms and API responses you inspect.
  </ngmd-step>
  <ngmd-step title="Mark extra secrets">
    Use <code>data-ng-devtools="mask"</code> or <code>window.__NG_DEVTOOLS_FORMS__</code> for fields the secret words miss.
  </ngmd-step>
</ngmd-workflow>

## Related pages

<ngmd-pill-row>
  <ngmd-pill href="/getting-started/vite" title="Vite and Analog"></ngmd-pill>
  <ngmd-pill href="/getting-started/express" title="Angular CLI and Express"></ngmd-pill>
  <ngmd-pill href="/inspectors/forms" title="Forms inspector"></ngmd-pill>
  <ngmd-pill href="/agents/mcp-server" title="MCP server"></ngmd-pill>
</ngmd-pill-row>
