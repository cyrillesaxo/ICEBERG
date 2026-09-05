import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scanRepository, analyzeJourneyGaps } from "../packages/core/src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.resolve(here, "../examples/quickstart-checkout");

test("60-second quickstart fixture produces a meaningful checkout scan", async () => {
  const scan = await scanRepository(fixture);
  assert.equal(scan.packageName, "ui-iceberg-quickstart-checkout");
  assert.ok(scan.frameworks.ui.includes("react"));
  assert.ok(scan.frameworks.test.includes("playwright"));
  assert.ok(scan.candidateJourneys.some((journey) => journey.name === "checkout"));
});

test("quickstart gap map finds important scenarios the fixture does not cover", async () => {
  const result = await analyzeJourneyGaps(fixture, "checkout");
  const byId = new Map(result.scenarios.map((scenario) => [scenario.id, scenario]));

  assert.equal(byId.get("CORE_SUCCESS")?.evidence.state, "candidate-covered");
  assert.equal(byId.get("PAYMENT_DECLINED_RETRY")?.evidence.state, "candidate-covered");
  assert.notEqual(byId.get("OTP_INTERRUPT_RETURN")?.evidence.state, "candidate-covered");
  assert.notEqual(byId.get("DUPLICATE_ORDER_AFTER_REFRESH")?.evidence.state, "candidate-covered");
  assert.ok(result.gaps.length > 0);
  assert.ok(result.testNext, "quickstart should recommend a next test");
});
