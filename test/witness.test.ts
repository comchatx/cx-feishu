import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, expect, it } from "vitest";
import { scratch } from "./pi.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PI = join(ROOT, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const PRELOAD = new URL("./fixtures/loopback-hook.mjs", import.meta.url).href;
/** The version this package is checked against; its install lines name the same one. */
const PI_CHANNELS = "npm:@amaster.ai/pi-channels@0.1.28";
const STUB_HOST = "feishu-hook.invalid";

const piEnv = (agentDir: string): NodeJS.ProcessEnv => ({
  PATH: process.env["PATH"], HOME: agentDir, PI_CODING_AGENT_DIR: agentDir, PI_OFFLINE: "1", PI_SKIP_VERSION_CHECK: "1", PI_TELEMETRY: "0",
});

/** A tenant tree with pi-channels as `pi install -l` from npm leaves it: the npm registry is read here and nowhere else. */
let installRoot: string;
beforeAll(() => {
  installRoot = mkdtempSync(join(tmpdir(), "pi-package-install-"));
  const tenant = join(installRoot, "tenant");
  const agentDir = join(installRoot, "agent");
  mkdirSync(tenant);
  mkdirSync(agentDir);
  execFileSync(process.execPath, [PI, "install", "-l", PI_CHANNELS], { cwd: tenant, env: { ...piEnv(agentDir), PI_OFFLINE: "0", npm_config_ignore_scripts: "true" }, stdio: "pipe" });
}, 180_000);
afterAll(() => rmSync(installRoot, { recursive: true, force: true }));

const listen = async (server: ReturnType<typeof createServer>) => {
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  return (server.address() as AddressInfo).port;
};

it("pi-channels at its pinned version offers notify, and a send with json posts that body to the bot unchanged", async () => {
  const home = scratch();
  const tenant = join(home, "tenant");
  const agentDir = join(home, "agent");
  cpSync(join(installRoot, "tenant"), tenant, { recursive: true });
  mkdirSync(agentDir);

  const posts: { method: string | undefined; path: string | undefined; type: string | undefined; body: string }[] = [];
  const hook = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      posts.push({ method: request.method, path: request.url, type: request.headers["content-type"], body: Buffer.concat(chunks).toString() });
      response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ code: 0, msg: "success", data: {} }));
    });
  });

  const json = JSON.stringify({ msg_type: "text", content: { text: "cx-feishu witness" } });
  const tools: string[][] = [];
  const results: string[] = [];
  const model = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as { model: string; tools?: { function?: { name: string } }[]; messages: { role: string; content: unknown }[] };
      tools.push((body.tools ?? []).map((tool) => tool.function?.name ?? ""));
      const last = body.messages.at(-1)!;
      if (last.role === "tool") results.push(typeof last.content === "string" ? last.content : JSON.stringify(last.content));
      const chunk = (delta: unknown, finish: string | null) =>
        `data: ${JSON.stringify({ id: "x", object: "chat.completion.chunk", created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason: finish }], ...(finish === null ? {} : { usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }) })}\n\n`;
      response.writeHead(200, { "content-type": "text/event-stream" });
      if (last.role === "user") {
        const call = { index: 0, id: "call_1", type: "function", function: { name: "notify", arguments: JSON.stringify({ action: "send", adapter: "bot", json }) } };
        response.write(chunk({ role: "assistant", tool_calls: [call] }, null));
        response.write(chunk({}, "tool_calls"));
      } else {
        response.write(chunk({ role: "assistant", content: "Done." }, null));
        response.write(chunk({}, "stop"));
      }
      response.end("data: [DONE]\n\n");
    });
  });
  const [hookPort, modelPort] = [await listen(hook), await listen(model)];
  try {
    writeFileSync(join(agentDir, "settings.json"), JSON.stringify({
      defaultProvider: "fixture", defaultModel: "fixture-a", defaultThinkingLevel: "off", defaultProjectTrust: "always", quietStartup: true, retry: { enabled: false },
      "pi-channels": { adapters: { feishu: { type: "webhook" } }, routes: { bot: { adapter: "feishu", recipient: `https://${STUB_HOST}/open-apis/bot/v2/hook/witness` } } },
    }));
    writeFileSync(join(agentDir, "models.json"), JSON.stringify({ providers: { fixture: { baseUrl: `http://127.0.0.1:${modelPort}/v1`, apiKey: "fixture", api: "openai-completions", models: [{ id: "fixture-a", name: "fixture-a", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 1024 }] } } }));

    const child = spawn(process.execPath, ["--import", PRELOAD, PI, "--mode", "rpc"], {
      cwd: tenant, env: { ...piEnv(agentDir), STUB_HOST, STUB_PORT: String(hookPort) }, stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    const settled = new Promise<void>((done) => {
      createInterface({ input: child.stdout }).on("line", (line) => { try { if ((JSON.parse(line) as { type?: string }).type === "agent_settled") done(); } catch { /* not a message */ } });
    });
    child.stdin.write(`${JSON.stringify({ id: "1", type: "prompt", message: "Tell the team the report is ready." })}\n`);
    await settled;
    const exited = new Promise<void>((done) => child.once("exit", () => done()));
    child.kill("SIGTERM");
    await exited;

    expect(tools[0], stderr).toContain("notify");
    expect(results).toEqual(['Sent via "bot".']);
    expect(posts).toEqual([{ method: "POST", path: "/open-apis/bot/v2/hook/witness", type: "application/json", body: json }]);
  } finally {
    hook.closeAllConnections();
    model.closeAllConnections();
    hook.close();
    model.close();
  }
}, 120_000);
