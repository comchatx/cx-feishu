# cx-feishu

一个 [pi](https://pi.dev) 包，让 [ComChatX](https://comchatx.com) 上 cx 的电脑通过 [pi-channels](https://www.npmjs.com/package/@amaster.ai/pi-channels)（`@amaster.ai/pi-channels`）及其 `notify` 工具，向飞书群机器人发送消息。它本身不发送任何消息，既不打包 pi-channels，也不将它列为依赖：pi-channels 由卖家另外安装。

它只有一个技能 `cx-feishu`，告诉模型 pi-channels 自己的说明在这里没有讲到的内容：机器人的地址从哪里来、什么会覆盖它；飞书机器人只读取原始的 `json` 正文（`notify` 默认的封装，以及不带 `json` 的 `test` 操作，都会被拒绝）；关键词、签名校验和 IP 白名单对发送有什么影响；`Sent` 表示 HTTP 2xx，而飞书拒绝时也返回 HTTP 200 和非零的 `code`；回复不会回到任何对话；以及监听器会让 cx 的电脑保持开机。

## 机器人

一个 `webhook` 适配器和一条路由，写在 pi 设置的 `pi-channels` 部分：

```json
{
  "pi-channels": {
    "adapters": { "feishu": { "type": "webhook" } },
    "routes": { "team": { "adapter": "feishu", "recipient": "${FEISHU_HOOK}" } }
  }
}
```

pi-channels 会展开全局设置和 agent 文件夹设置中的 `${VAR}`，但不展开项目的 `.pi/settings.json`。项目的 `pi-channels` 部分会按 `adapters`、`routes` 和 `bridge` 三个键逐个替换其他层的设置，所以用来停用另一层机器人的部分，要把这三个键都写上。

## 安装

```bash
pi install -l npm:@amaster.ai/pi-channels@0.1.28
pi install -l npm:cx-feishu
```

安装时指定 pi-channels 0.1.28，这是这个包测试所用的版本，这样 pi 会保持这个版本。请在 `/tenant` 中运行；不加 `-l` 的话，安装的内容会在 cx 的电脑下次启动时消失。在 ComChatX 上，两者上架后，卖家在「插件」页安装。

## 开发

```bash
npm ci
npm run typecheck
npm test               # 用锁定版本的 pi 加载这个包，并通过 pi-channels 0.1.28 向 127.0.0.1 上的桩服务发送
```
