import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const skillRoot = path.join(root, "skills", "ui-iceberg");

async function read(relative) {
  return fs.readFile(path.join(skillRoot, relative), "utf8");
}

test("ui-iceberg skill has Agent Skills-compatible frontmatter", async () => {
  const skill = await read("SKILL.md");
  assert.ok(skill.startsWith("---\n"));

  const end = skill.indexOf("\n---\n", 4);
  assert.ok(end > 0, "SKILL.md must close YAML frontmatter");

  const frontmatter = skill.slice(4, end);
  assert.match(frontmatter, /^name: ui-iceberg$/m);

  const description = frontmatter.match(/^description: (.+)$/m)?.[1];
  assert.ok(description, "description is required");
  assert.ok(description.length <= 1024, "description must fit Agent Skills limit");
  assert.match(description, /hidden UI bugs|hidden UI/i);
  assert.match(description, /Playwright/i);

  assert.match(frontmatter, /^license: Apache-2\.0$/m);
  assert.match(skill, /Unknown is not PASS/);
  assert.match(skill, /implementation signal[\s\S]*scenario hypothesis[\s\S]*evidence/);
});

test("ui-iceberg skill progressive-disclosure resources exist", async () => {
  const required = [
    "references/OPERATIONS.md",
    "references/EVIDENCE_MODEL.md",
    "references/CONSTRAINT_SURFACES.md",
    "assets/ICEBERG_RECEIPT_TEMPLATE.md",
    "examples/LEXYREAD.md",
    "evals/trigger-cases.json"
  ];

  for (const relative of required) {
    const stat = await fs.stat(path.join(skillRoot, relative));
    assert.ok(stat.isFile(), `${relative} should exist`);
  }
});

test("ui-iceberg trigger evals include positive and negative cases", async () => {
  const evals = JSON.parse(await read("evals/trigger-cases.json"));
  assert.equal(evals.skill, "ui-iceberg");
  assert.ok(evals.cases.some((item) => item.should_activate === true));
  assert.ok(evals.cases.some((item) => item.should_activate === false));
  assert.ok(evals.cases.some((item) => /green/i.test(item.prompt)));
  assert.ok(evals.cases.some((item) => /navigation/i.test(item.prompt)));
});
