import test from "node:test";
import assert from "node:assert/strict";
import {
  generatePlaywrightScaffold,
  mapPlaywrightRuntimeEvidence,
  parsePlaywrightJsonReport
} from "../packages/adapters/playwright/src/index.js";

const scenarios = [
  { id: "CORE_SUCCESS", title: "Complete checkout successfully", signals: ["checkout", "confirmation"], priority: "critical" },
  { id: "OTP_INTERRUPT_RETURN", title: "Leave checkout for OTP and return", signals: ["otp", "return", "resume"], priority: "critical" },
  { id: "DOUBLE_SUBMIT", title: "Prevent duplicate effects", signals: ["double", "duplicate"], priority: "critical" },
  { id: "SESSION_EXPIRY_RECOVERY", title: "Recover after session expiry", signals: ["session", "expired"], priority: "high" }
];

const report = {
  suites: [{
    title: "checkout",
    specs: [
      {
        id: "s1",
        title: "[ICEBERG:CORE_SUCCESS] checkout reaches confirmation",
        file: "tests/checkout.spec.js",
        tests: [{ projectName: "chromium", results: [{ status: "passed", retry: 0, duration: 120 }] }]
      },
      {
        id: "s2",
        title: "@iceberg:OTP_INTERRUPT_RETURN returns from OTP",
        file: "tests/checkout.spec.js",
        tests: [{ projectName: "chromium", results: [{ status: "failed", retry: 0 }, { status: "passed", retry: 1 }] }]
      },
      {
        id: "s3",
        title: "duplicate submit is blocked",
        file: "tests/payment.spec.js",
        tests: [{ projectName: "chromium", results: [{ status: "failed", retry: 0 }] }]
      }
    ]
  }]
};

test("parser preserves retry-dependent pass as flaky", () => {
  const parsed = parsePlaywrightJsonReport(report);
  assert.equal(parsed.tests.length, 3);
  assert.equal(parsed.tests[1].outcome, "flaky-pass");
  assert.ok(parsed.tests[1].explicitScenarioIds.includes("OTP_INTERRUPT_RETURN"));
});

test("runtime evidence distinguishes explicit pass, flaky, candidate, and unverified", () => {
  const parsed = parsePlaywrightJsonReport(report);
  const mapped = mapPlaywrightRuntimeEvidence(scenarios, parsed);
  const byId = Object.fromEntries(mapped.mapped.map((item) => [item.scenarioId, item]));
  assert.equal(byId.CORE_SUCCESS.state, "linked-pass");
  assert.equal(byId.OTP_INTERRUPT_RETURN.state, "linked-flaky");
  assert.equal(byId.DOUBLE_SUBMIT.state, "runtime-candidate");
  assert.equal(byId.SESSION_EXPIRY_RECOVERY.state, "unverified");
});

test("generated Playwright scaffold is skipped by default and carries explicit scenario ids", () => {
  const scaffold = generatePlaywrightScaffold("checkout", scenarios, { limit: 2 });
  assert.match(scaffold, /test\.skip\("\[ICEBERG:CORE_SUCCESS\]/);
  assert.match(scaffold, /\[ICEBERG:OTP_INTERRUPT_RETURN\]/);
  assert.doesNotMatch(scaffold, /test\("\[ICEBERG:CORE_SUCCESS\]/);
});
