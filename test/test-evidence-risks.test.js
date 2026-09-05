import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { scanRepository } from "../packages/core/src/index.js";

async function riskyTestFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ui-iceberg-evidence-"));
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ name: "evidence-risk-fixture", devDependencies: { "@playwright/test": "^1.50.0" } }));
  await fs.writeFile(path.join(root, "src", "Checkout.js"), `export async function pay(){ return fetch('/api/pay'); }`);
  await fs.writeFile(
    path.join(root, "tests", "checkout.spec.js"),
    `
      test.skip('legacy payment retry', async ({ page }) => {});
      test('forced payment', async ({ page }) => {
        await page.route('**/api/pay', route => route.fulfill({ status: 200, body: '{}' }));
        await page.waitForTimeout(1000);
        await page.locator('.pay').click({ force: true });
      });
    `
  );
  return root;
}

test("scanRepository reports bounded test evidence risks without calling them product defects", async () => {
  const root = await riskyTestFixture();
  const scan = await scanRepository(root);
  const ids = new Set(scan.testEvidenceRisks.map((risk) => risk.id));

  assert.ok(ids.has("FIXED_WAIT"));
  assert.ok(ids.has("FORCED_ACTION"));
  assert.ok(ids.has("SKIPPED_TEST"));
  assert.ok(ids.has("NETWORK_MOCK"));
  assert.ok(scan.testEvidenceRisks.every((risk) => risk.evidenceClass === "test-evidence-risk"));
  assert.ok(scan.testEvidenceRisks.every((risk) => typeof risk.boundary === "string" && risk.boundary.length > 20));
  assert.ok(scan.testEvidenceRisks.every((risk) => typeof risk.meaning === "string" && risk.meaning.length > 20));
  assert.match(scan.hardeningPolicy.testEvidence, /not proof of product defects/i);
});
