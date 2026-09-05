import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeJourneyGaps, generateScenarios, scanRepository } from "../packages/core/src/index.js";

async function fixtureRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ui-iceberg-"));
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "fixture-shop", dependencies: { react: "^19.0.0" }, devDependencies: { "@playwright/test": "^1.50.0" } })
  );
  await fs.writeFile(
    path.join(root, "src", "Checkout.jsx"),
    `export function Checkout(){ return <button>Pay now</button>; }`
  );
  await fs.writeFile(
    path.join(root, "tests", "checkout.spec.js"),
    `test('checkout success', async ({ page }) => { await page.getByRole('button', {name:'Pay now'}).click(); await expect(page.getByText('Confirmation')).toBeVisible(); });\n` +
      `test('payment declined retry', async ({ page }) => { /* declined payment retry */ });\n`
  );
  return root;
}

test("scanRepository detects UI/test frameworks and a checkout candidate", async () => {
  const root = await fixtureRepo();
  const scan = await scanRepository(root);
  assert.equal(scan.packageName, "fixture-shop");
  assert.ok(scan.frameworks.ui.includes("react"));
  assert.ok(scan.frameworks.test.includes("playwright"));
  assert.equal(scan.counts.tests, 1);
  assert.ok(scan.candidateJourneys.some((item) => item.name === "checkout"));
});

test("checkout scenario plan includes high-value interruption and distributed-state cases", () => {
  const plan = generateScenarios("checkout");
  const ids = new Set(plan.scenarios.map((scenario) => scenario.id));
  assert.ok(ids.has("OTP_INTERRUPT_RETURN"));
  assert.ok(ids.has("DUPLICATE_ORDER_AFTER_REFRESH"));
  assert.ok(ids.has("REQUEST_FAILURE_RETRY"));
  assert.ok(ids.has("KEYBOARD_ONLY"));
});

test("gap analysis distinguishes candidate-covered from unverified scenarios", async () => {
  const root = await fixtureRepo();
  const report = await analyzeJourneyGaps(root, "checkout");
  assert.ok(report.summary["candidate-covered"] >= 1);
  assert.ok(report.gaps.length >= 1);
  assert.ok(report.testNext);
  assert.match(report.evidencePolicy.statement, /cannot certify scenario coverage/i);
});
