# Changelog

## 0.1.5

- The card's name is the one signed on 2026-11-11, "Feishu", in `comchatx.name`, the same on the Chinese and the English page.
- The README, in English and Chinese, calls each of our plugins by its card's name, not its npm name.

## 0.1.4

- The skill's line on the Plugins page is the words signed on 2026-11-10: `comchatx.skills["cx-feishu"]` carries 「把 cx 的报告和提醒发到你的飞书群。」 and "Sends cx's reports and alerts to Feishu." The skill's own `description` is unchanged.

## 0.1.3

- The card's line and the Overview, in English and Chinese, are the words signed on 2026-11-10: "Sends cx's reports and check results to your Feishu group." as npm's `description`, and 「在飞书群里收到 cx 发来的报告和检查结果。」 as `comchatx.about`. They said "A pi package that tells the model what pi-channels' notify needs to reach a Feishu group bot from a ComChatX box, and what its answer means." and 「让 cx 通过你的飞书机器人给你发消息。」.
- What only a developer reads moved from the README to `DEVELOPING.md`: the opening description and "A bot", "Install", "Develop".

## 0.1.2

- The README in Chinese, `README.zh-CN.md`, which the Plugins page draws as the Overview in Chinese.
- `comchatx.description` is removed: the Plugins page never drew it, and the card's Chinese line is `about`.

## 0.1.1

- `package.json` carries the `comchatx` field the Plugins page reads: its Chinese `about` and `description`, `mark`, `section` and `order`, and `builds` naming `@amaster.ai/pi-channels`, which the page installs with it. pi-channels ships no skill of its name, so it is named in `builds`, not `needs`; the package still neither bundles nor lists it as a dependency.

## 0.1.0

- One skill, `cx-feishu`: what pi-channels' `notify` needs to reach a Feishu group bot from a ComChatX box, and what `Sent` means.
