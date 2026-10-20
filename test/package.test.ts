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
  expect(skill!.description).toContain("`pi install -l npm:@amaster.ai/pi-channels` run in /tenant (without -l it is gone at the box's next start)");
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
