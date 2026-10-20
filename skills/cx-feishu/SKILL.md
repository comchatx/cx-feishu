---
name: cx-feishu
description: "Sending a message to a Feishu (飞书) group bot from a ComChatX box - a report, an alert, a heartbeat's result - with pi-channels (`@amaster.ai/pi-channels`) and its `notify` tool; what pi-channels' own words miss here. Needs @amaster.ai/pi-channels; if no notify tool is offered, it is not installed, and the seller installs it in Plugins once it is listed there, or it is installed with `pi install -l npm:@amaster.ai/pi-channels` run in /tenant (without -l it is gone at the box's next start). cx-feishu itself installs the same way: Plugins once listed, or `pi install -l npm:cx-feishu` in /tenant."
---

## Where the bot's address comes from

- A bot is a route in pi-channels' settings: `notify action:"list"` shows the routes and hides their addresses. Send to a route by its name as `adapter`.
- An address the seller gives on the Plugins page works from the box's next open, not in the conversation already open.
- A `pi-channels` section in `/tenant/.pi/settings.json` replaces the one from Plugins as a whole: its routes are the only ones, and the Plugins bot is gone until that section is removed.
- An address the seller says in chat, or one passed as `recipient`, is kept in the conversation's file. A `recipient` passed with a route replaces the route's own address for that send. Use the route and pass no `recipient`.

## What a send needs

- Pass the message as `json`, the body a Feishu bot reads, for example `{"msg_type":"text","content":{"text":"..."}}`. Without `json`, `notify` posts its own envelope (`text`, `source`, `metadata`, `timestamp`), which Feishu takes no text from and refuses.
- `action:"test"` has no `json`, so it posts that envelope: a bot refuses it. Test with a `send` and a short `json` text instead.
- A bot with keywords refuses any message whose text lacks one of them; ask the seller for the bot's keywords and put one in the text. A bot with 签名校验 (signature check) or an IP whitelist refuses every send from here.

## What "Sent" means

- `notify` says `Sent` on any HTTP 2xx and never reads the reply. Feishu refuses with HTTP 200 and a nonzero `code` in the body (a missing keyword is `19024`), so `Sent` does not mean the message was shown. When it matters, ask the seller whether it arrived; if it did not, the cause is one of those above.

## What does not come back

- Replies in the Feishu group reach no conversation here: a webhook bot only receives.
- pi-channels' `feishu` and `dingtalk` adapters listen for replies unless their `eventMode` is `off`. A listener holds a connection open and keeps the box awake, and awake time is billed; the `webhook` adapter holds nothing open.
