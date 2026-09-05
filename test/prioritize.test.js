import test from "node:test";
import assert from "node:assert/strict";
import { prioritizeScenarioGaps, scoreScenarioForNextTest } from "../packages/core/src/prioritize.js";

test("repository-relevant journey scenario outranks an equally critical generic gap", () => {
  const gaps = [
    {
      id: "PAYMENT_DECLINED_RETRY",
      source: "journey-profile",
      priority: "critical",
      evidence: { state: "missing", score: 0 },
      title: "Payment declined retry"
    },
    {
      id: "OTP_INTERRUPT_RETURN",
      source: "journey-profile",
      priority: "critical",
      evidence: { state: "missing", score: 0 },
      title: "OTP return"
    }
  ];

  const ranked = prioritizeScenarioGaps(gaps, [{ id: "external-redirect", hits: 2 }, { id: "browser-persistence", hits: 1 }]);
  assert.equal(ranked[0].id, "OTP_INTERRUPT_RETURN");
  assert.ok(ranked[0].recommendation.matchedContextSignals.includes("external-redirect"));
  assert.match(ranked[0].recommendation.boundary, /not a defect probability/i);
});

test("recommendation score remains a ranking signal rather than a defect probability", () => {
  const scored = scoreScenarioForNextTest({
    id: "ASYNC_LATE_RESPONSE_OVERWRITE",
    source: "failure-pattern-library",
    priority: "critical",
    riskSignals: ["async-network"],
    matchedRiskSignals: ["async-network"],
    evidence: { state: "missing", score: 0 }
  }, ["async-network"]);

  assert.ok(scored.score > 0);
  assert.deepEqual(scored.matchedContextSignals, ["async-network"]);
  assert.match(scored.boundary, /not a defect probability/i);
});
