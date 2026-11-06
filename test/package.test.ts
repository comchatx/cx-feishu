import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { loadPackage } from "./pi.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

it("the pinned pi loads the one skill named for the package, and nothing else", async () => {
  const { loader } = await loadPackage(ROOT);
  const skills = loader.getSkills();
  expect(skills.diagnostics).toEqual([]);
  expect(skills.skills.map((skill) => [skill.name, skill.filePath])).toEqual([["cx-feishu", join(ROOT, "skills", "cx-feishu", "SKILL.md")]]);
  expect(loader.getExtensions().extensions).toEqual([]);
  expect(loader.getPrompts().prompts).toEqual([]);
});

it("the skill's description says what it needs and how both packages install", async () => {
  const { loader } = await loadPackage(ROOT);
  const [skill] = loader.getSkills().skills;
  expect(skill!.description).toContain("if no notify tool is offered, it is not installed");
  expect(skill!.description).toContain("`pi install -l npm:@amaster.ai/pi-channels@0.1.28` run in /tenant (without -l it is gone at the box's next start)");
  expect(skill!.description).toContain("`pi install -l npm:cx-feishu` in /tenant");
});

it("the package neither bundles nor lists pi-channels, and carries no install script or extension", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as Record<string, unknown>;
  for (const field of ["dependencies", "peerDependencies", "optionalDependencies", "bundleDependencies", "bundledDependencies"]) expect(manifest[field], field).toBeUndefined();
  for (const field of ["devDependencies", "overrides"]) expect(JSON.stringify(manifest[field]), field).not.toContain("pi-channels");
  expect(manifest["scripts"]).toEqual({ typecheck: "tsc --noEmit", test: "vitest run" });
  expect(manifest["pi"]).toEqual({ skills: ["./skills"] });
  expect(readdirSync(ROOT)).not.toContain("extensions");
});

it("the comchatx field draws the card in Chinese, carries no description the page never draws, and names pi-channels in builds, never in needs, since it ships no skill of its name", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as Record<string, any>;
  const card = manifest["comchatx"];
  expect(Object.keys(card).sort()).toEqual(["about", "builds", "mark", "order", "section"]);
  expect(card.about).toMatch(/飞书/);
  expect(card).toMatchObject({ mark: { line: "megaphone" }, section: "extensions", order: 40 });
  expect(card.builds).toEqual(["@amaster.ai/pi-channels"]);
  expect(card.needs).toBeUndefined();
});

it("ships its README in English and in Chinese", () => {
  // npm 12 keys its answer by the package's name; earlier ones answer a list.
  const answer = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: ROOT, encoding: "utf8" })) as { files: { path: string }[] }[] | Record<string, { files: { path: string }[] }>;
  const packed = Array.isArray(answer) ? answer : Object.values(answer);
  expect(packed[0]!.files.map((file) => file.path)).toEqual(expect.arrayContaining(["README.md", "README.zh-CN.md"]));
});
