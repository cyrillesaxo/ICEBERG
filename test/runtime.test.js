import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { emitPlaywrightScenarioSpec, verifyJourneyWithPlaywright } from "../packages/runtime/src/index.js";

async function runtimeFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ui-iceberg-runtime-"));
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.mkdir(path.join(root, ".ui-iceberg"), { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "runtime-shop", devDependencies: { "@playwright/test": "^1.50.0" } })
  );
  await fs.writeFile(
    path.join(root, "tests", "checkout.spec.js"),
    `test('[ICEBERG:CORE_SUCCESS] checkout confirmation', async () => {});\n` +
      `test('[ICEBERG:OTP_INTERRUPT_RETURN] otp return', async () => {});\n`
  );
  const report = {
    suites: [{
      title: "checkout",
      specs: [
        {
          id: "core",
          title: "[ICEBERG:CORE_SUCCESS] checkout confirmation",
          file: "tests/checkout.spec.js",
          tests: [{ projectName: "chromium", results: [{ status: "passed", retry: 0 }] }]
        },
        {
          id: "otp",
          title: "[ICEBERG:OTP_INTERRUPT_RETURN] otp return",
          file: "tests/checkout.spec.js",
          tests: [{ projectName: "chromium", results: [{ status: "failed", retry: 0 }] }]
        }
      ]
    }]
  };
  const reportPath = path.join(root, ".ui-iceberg", "playwright.json");
  await fs.writeFile(reportPath, JSON.stringify(report));
  return { root, reportPath };
}

test("runtime verification blocks a journey when an explicitly linked critical scenario fails", async () => {
  const { root, reportPath } = await runtimeFixture();
  const result = await verifyJourneyWithPlaywright(root, "checkout", reportPath);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.runtimeSummary["linked-pass"], 1);
  assert.equal(result.runtimeSummary["linked-fail"], 1);
  assert.equal(result.testNext.id, "OTP_INTERRUPT_RETURN");
  assert.match(result.evidencePolicy.admission, /not a claim of complete human/i);
});

test("Playwright scaffold keeps generated tests skipped until product-specific implementation exists", () => {
  const spec = emitPlaywrightScenarioSpec("checkout", { limit: 3 });
  assert.equal(spec.adapter, "playwright");
  assert.equal(spec.scenarios.length, 3);
  assert.match(spec.content, /test\.skip/);
  assert.match(spec.policy, /must implement product-specific/i);
});
