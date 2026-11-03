# Changelog

## 0.1.1

- `package.json` carries the `comchatx` field the Plugins page reads: its Chinese `about` and `description`, `mark`, `section` and `order`, and `builds` naming `@amaster.ai/pi-channels`, which the page installs with it. pi-channels ships no skill of its name, so it is named in `builds`, not `needs`; the package still neither bundles nor lists it as a dependency.

## 0.1.0

- One skill, `cx-feishu`: what pi-channels' `notify` needs to reach a Feishu group bot from a ComChatX box, and what `Sent` means.
