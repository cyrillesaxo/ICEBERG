import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const cli = path.join(root, "packages", "cli", "bin", "ui-iceberg.js");

test("CLI help exposes the v0.5 review command", () => {
  const run = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /UI Iceberg v0\.5/i);
  assert.match(run.stdout, /review --input=claim\.json/i);
});

test("CLI review prints plain-language evidence review without internal vocabulary", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "iceberg-review-"));
  const inputPath = path.join(dir, "claim.json");
  await fs.writeFile(inputPath, JSON.stringify({
    claim: {
      id: "checkout-otp",
      statement: "Checkout survives OTP interruption and return.",
      semanticTypes: ["G4", "G11", "G12"]
    },
    scope: "technical-ui-runtime",
    evidence: [{
      id: "W1",
      state: "linked-pass",
      channel: "playwright",
      scenarioId: "OTP_INTERRUPT_RETURN",
      evidenceRisks: ["NETWORK_MOCK", "VISUAL_ONLY_ORACLE"]
    }]
  }), "utf8");

  try {
    const run = spawnSync(process.execPath, [cli, "review", `--input=${inputPath}`], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /WHY THIS MAY STILL BE MISLEADING/i);
    assert.match(run.stdout, /BEST NEXT CHECK/i);
    assert.match(run.stdout, /STILL UNKNOWN/i);
    assert.doesNotMatch(run.stdout, /G\d+_|deceptive witness|semantic entropy|first bite|admission|antiwitness|TERM/i);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("CLI review JSON can expose internals only with --internal", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "iceberg-review-json-"));
  const inputPath = path.join(dir, "claim.json");
  await fs.writeFile(inputPath, JSON.stringify({
    claim: { id: "checkout-otp", semanticTypes: ["G11", "G12"] },
    evidence: [{ id: "W1", state: "linked-pass", evidenceRisks: ["NETWORK_MOCK"] }]
  }), "utf8");

  try {
    const defaultRun = spawnSync(process.execPath, [cli, "review", `--input=${inputPath}`, "--json"], { encoding: "utf8" });
    assert.equal(defaultRun.status, 0, defaultRun.stderr);
    const defaultResult = JSON.parse(defaultRun.stdout);
    assert.equal(defaultResult.internal, undefined);

    const internalRun = spawnSync(process.execPath, [cli, "review", `--input=${inputPath}`, "--internal", "--json"], { encoding: "utf8" });
    assert.equal(internalRun.status, 0, internalRun.stderr);
    const internalResult = JSON.parse(internalRun.stdout);
    assert.equal(internalResult.internal.challenge.deceptionMechanisms.length, 5);
    assert.ok(internalResult.internal.challenge.semanticTypes.some((item) => item.id === "G12_AUTHORITY"));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
