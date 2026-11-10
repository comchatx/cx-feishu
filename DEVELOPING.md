# Developing cx-feishu

A [pi](https://pi.dev) package for sending messages to a Feishu (飞书) group bot from a [ComChatX](https://comchatx.com) box with [pi-channels](https://www.npmjs.com/package/@amaster.ai/pi-channels) (`@amaster.ai/pi-channels`) and its `notify` tool. It sends nothing itself and neither bundles nor lists pi-channels: the seller installs pi-channels beside it.

It is one skill, `cx-feishu`, telling the model what pi-channels' own words miss here: where a bot's address comes from and what overrides it, that a Feishu bot reads only the raw `json` body (`notify`'s default envelope, and its `test` action without `json`, are refused), what keywords, 签名校验 and IP whitelists do to a send, that `Sent` means an HTTP 2xx and Feishu refuses with HTTP 200 and a nonzero `code`, that replies come back to no conversation, and that a listener keeps the box awake.

## A bot

One `webhook` adapter and one route, in the `pi-channels` section of pi's settings:

```json
{
  "pi-channels": {
    "adapters": { "feishu": { "type": "webhook" } },
    "routes": { "team": { "adapter": "feishu", "recipient": "${FEISHU_HOOK}" } }
  }
}
```

pi-channels expands `${VAR}` in the global and agent-directory settings, not in a project's `.pi/settings.json`; a project's `pi-channels` section replaces the others' key by key — `adapters`, `routes` and `bridge` each — so a section meant to stop another layer's bot carries all three.

## Install

```bash
pi install -l npm:@amaster.ai/pi-channels@0.1.28
pi install -l npm:cx-feishu
```

pi-channels is named at 0.1.28, the version this package is checked against, so pi keeps that version. Run in `/tenant`; without `-l` the install is gone at the box's next start. On ComChatX, a seller installs both from the Plugins page once they are listed.

## Develop

```bash
npm ci
npm run typecheck
npm test               # loads the package with the pinned pi, and sends through pi-channels 0.1.28 to a stub on 127.0.0.1
```
