import test from "node:test";
import assert from "node:assert/strict";
import {
  admitEvidence,
  analyzeReactivationImpact,
  buildClaimChallenge,
  inspectDeceptiveWitness,
  issueAssuranceReceipt,
  listDeceptionMechanisms,
  listSemanticTypes,
  reviewClaim,
  selectFirstBite
} from "../packages/assurance/src/index.js";

test("First Bite preserves recommendation boundary", () => {
  const result = selectFirstBite([
    { id: "LOW", priority: "low", evidence: { state: "missing", score: 0 }, source: "ui-iceberg-core" },
    { id: "OTP_INTERRUPT_RETURN", priority: "critical", evidence: { state: "missing", score: 0 }, source: "journey-profile" }
  ], [{ id: "external-redirect", hits: 2 }]);
  assert.equal(result.testNext.id, "OTP_INTERRUPT_RETURN");
  assert.match(result.boundary, /not a defect probability/i);
});

test("forced action turns nominal green interaction evidence into a deceptive witness candidate", () => {
  const result = inspectDeceptiveWitness({
    claim: { id: "primary-action", scope: "user-actionability" },
    witness: {
      id: "W1",
      state: "linked-pass",
      channel: "playwright",
      evidenceRisks: ["FORCED_ACTION"]
    }
  });
  assert.equal(result.classification, "DECEPTIVE_WITNESS_CANDIDATE");
  assert.equal(result.claimLicense.requestedScope, "not-licensed");
  assert.equal(result.recommendedProbe.id, "PROBE_NATURAL_ACTIONABILITY");
  assert.deepEqual(result.claimLicense.blockingDistortions, ["ACTIONABILITY_BYPASS"]);
});

test("network mock blocks broad technical runtime admission when it is the only strong witness", () => {
  const result = admitEvidence({
    claim: { id: "otp-return", statement: "Checkout survives the real OTP return boundary." },
    scope: "technical-ui-runtime",
    evidence: [{
      id: "W1",
      state: "linked-pass",
      channel: "playwright",
      evidenceRisks: ["NETWORK_MOCK"]
    }]
  });
  assert.equal(result.verdict, "INCONCLUSIVE");
  assert.equal(result.licenses["technical-ui-runtime"], "unknown");
  assert.deepEqual(result.evidenceSummary.deceptiveSupportingWitnesses, ["W1"]);
  assert.equal(result.deceptiveWitnessAudit.firstDeceptionProbe.recommendedProbe.id, "PROBE_REAL_AUTHORITY_BOUNDARY");
  assert.ok(result.semanticEntropy.unresolvedInterpretations.some((item) => item.includes("AUTHORITY_SUBSTITUTION")));
});

test("clean independent witness can still license scope when another green witness is deceptive", () => {
  const result = admitEvidence({
    claim: { id: "otp-return" },
    scope: "technical-ui-runtime",
    evidence: [
      { id: "W-MOCK", state: "linked-pass", channel: "playwright", evidenceRisks: ["NETWORK_MOCK"] },
      { id: "W-REAL", state: "linked-pass", channel: "playwright" }
    ]
  });
  assert.equal(result.verdict, "ADMITTED_WITH_SCOPE");
  assert.deepEqual(result.evidenceSummary.licensingSupportingWitnesses, ["W-REAL"]);
  assert.deepEqual(result.evidenceSummary.deceptiveSupportingWitnesses, ["W-MOCK"]);
});

test("First Bite prefers deception probe when it contaminates the top scenario claim", () => {
  const result = selectFirstBite([
    { id: "OTP_INTERRUPT_RETURN", priority: "critical", evidence: { state: "partial", score: 0.5 }, source: "journey-profile" }
  ], [{ id: "external-redirect", hits: 2 }], {
    deceptiveWitnesses: [{
      claim: { id: "otp-return", scope: "technical-ui-runtime" },
      scenarioId: "OTP_INTERRUPT_RETURN",
      witness: { id: "W1", scenarioId: "OTP_INTERRUPT_RETURN", state: "linked-pass", evidenceRisks: ["NETWORK_MOCK"] }
    }]
  });
  assert.equal(result.recommendedNext.kind, "DECEPTIVE_WITNESS_PROBE");
  assert.equal(result.recommendedNext.scenarioId, "OTP_INTERRUPT_RETURN");
  assert.equal(result.recommendedNext.probe.id, "PROBE_REAL_AUTHORITY_BOUNDARY");
});

test("canonical semantic taxonomy has exactly twelve types", () => {
  const types = listSemanticTypes();
  assert.equal(types.length, 12);
  assert.deepEqual(types.map((item) => item.id), [
    "G1_LABEL",
    "G2_NODE",
    "G3_BOUNDARY",
    "G4_EDGE",
    "G5_OPERATION",
    "G6_PERSPECTIVE",
    "G7_GRANULARITY",
    "G8_EVIDENCE",
    "G9_PREREQUISITE",
    "G10_CONFLICT",
    "G11_TEMPORAL",
    "G12_AUTHORITY"
  ]);
});

test("claim challenge uses exactly the five canonical deception mechanisms", () => {
  const mechanisms = listDeceptionMechanisms();
  assert.deepEqual(mechanisms.map((item) => item.id), [
    "UNTRACEABLE_DEPTH",
    "INFLATED_SCOPE",
    "LOADED_CHANNEL",
    "LOADED_FRAME",
    "UNSTATED_IMPLICATION"
  ]);
});

test("absence of a deceptive-witness detector leaves mechanism state unknown", () => {
  const challenge = buildClaimChallenge({
    claim: { id: "resume-reading", semanticTypes: ["G4"] },
    audits: []
  });
  assert.equal(challenge.deceptionMechanisms.length, 5);
  assert.ok(challenge.deceptionMechanisms.every((item) => item.status === "unknown"));
  assert.equal(challenge.selectedProbe, null);
  assert.ok(challenge.semanticTypes.some((item) => item.id === "G4_EDGE"));
  assert.ok(challenge.semanticTypes.some((item) => item.id === "G8_EVIDENCE"));
});

test("explicit mechanism check can clear one coordinate without clearing the others", () => {
  const challenge = buildClaimChallenge({
    claim: { id: "choice" },
    audits: [],
    mechanismChecks: { LOADED_FRAME: "pass" }
  });
  const frame = challenge.deceptionMechanisms.find((item) => item.id === "LOADED_FRAME");
  assert.equal(frame.status, "checked-clear");
  assert.ok(challenge.deceptionMechanisms.filter((item) => item.id !== "LOADED_FRAME").every((item) => item.status === "unknown"));
});

test("claim review mixes evidence risks into a multi-mechanism probe while hiding internal vocabulary", () => {
  const result = reviewClaim({
    claim: {
      id: "otp-return",
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
    }],
    includeInternal: true
  });

  assert.equal(result.userFacing.status, "needs-check");
  assert.ok(result.userFacing.whyThisMayBeMisleading.length >= 3);
  assert.equal(result.userFacing.bestNextCheck.title, "Run one check that removes the biggest shortcuts");
  const triggered = result.internal.challenge.deceptionMechanisms.filter((item) => item.status === "triggered").map((item) => item.id);
  assert.deepEqual(triggered, ["UNTRACEABLE_DEPTH", "INFLATED_SCOPE", "LOADED_CHANNEL", "UNSTATED_IMPLICATION"]);
  assert.equal(result.internal.challenge.deceptionMechanisms.find((item) => item.id === "LOADED_FRAME").status, "unknown");

  const visible = JSON.stringify(result.userFacing);
  assert.doesNotMatch(visible, /G\d+_|deceptive witness|semantic entropy|first bite|admission|antiwitness|TERM/i);
});

test("claim review hides internals by default", () => {
  const result = reviewClaim({
    claim: { id: "simple" },
    evidence: [{ id: "W1", state: "linked-pass", evidenceRisks: ["FORCED_ACTION"] }]
  });
  assert.equal(result.internal, undefined);
  assert.ok(result.userFacing.bestNextCheck);
});

test("candidate evidence remains inconclusive", () => {
  const result = admitEvidence({
    claim: { id: "cart-preserved", statement: "Cart state survives OTP return." },
    evidence: [{ id: "E1", state: "candidate-covered", channel: "static-test-map" }]
  });
  assert.equal(result.verdict, "INCONCLUSIVE");
  assert.equal(result.licenses["technical-ui-runtime"], "unknown");
  assert.ok(result.semanticEntropy.unresolvedCount >= 1);
});

test("flaky execution is not normalized to pass", () => {
  const result = admitEvidence({
    claim: { id: "otp-return" },
    evidence: [{ id: "E1", state: "linked-flaky", channel: "playwright" }]
  });
  assert.equal(result.verdict, "INCONCLUSIVE");
  assert.deepEqual(result.evidenceSummary.flakyWitnesses, ["E1"]);
});

test("strong runtime witness admits only the requested scope", () => {
  const result = admitEvidence({
    claim: { id: "otp-return" },
    scope: "technical-ui-runtime",
    evidence: [{ id: "E1", state: "linked-pass", channel: "playwright" }]
  });
  assert.equal(result.verdict, "ADMITTED_WITH_SCOPE");
  assert.equal(result.licenses["technical-ui-runtime"], "admitted");
  assert.equal(result.licenses["cognitive-usability"], "unknown");
  assert.equal(result.licenses["production-journey-health"], "unknown");
});

test("strong antiwitness rejects the scoped claim", () => {
  const result = admitEvidence({
    claim: { id: "otp-return" },
    evidence: [{ id: "E1", state: "linked-pass", channel: "playwright" }],
    antiwitnesses: [{ id: "AW1", state: "reproduced-antiwitness", channel: "controlled-fixture" }]
  });
  assert.equal(result.verdict, "REJECTED");
  assert.deepEqual(result.evidenceSummary.strongAntiwitnesses, ["AW1"]);
});

test("reactivation uses explicit signals and preserves unmapped files as unknown", () => {
  const result = analyzeReactivationImpact({
    changedSignals: ["external-redirect"],
    changedFiles: ["src/payment/callback.js", "src/unmapped.js"],
    scenarios: [
      {
        id: "OTP_INTERRUPT_RETURN",
        title: "OTP leave and return",
        evidence: { state: "linked-pass" },
        dependencies: { files: ["src/payment/callback.js"] }
      },
      {
        id: "KEYBOARD_ONLY",
        title: "Keyboard path",
        dependencies: { signals: ["modal-overlay"] }
      }
    ]
  });
  assert.deepEqual(result.reactivated.map((item) => item.id), ["OTP_INTERRUPT_RETURN"]);
  assert.deepEqual(result.unknown.files, ["src/unmapped.js"]);
  assert.match(result.boundary, /not defect detection/i);
});

test("assurance receipt is deterministic for identical semantic input", () => {
  const input = {
    project: "fixture",
    journey: "checkout",
    deceptiveWitnessAudit: { counts: { DECEPTIVE_WITNESS_CANDIDATE: 1 } },
    claimReview: { userFacing: { status: "needs-check" } },
    allowedConclusion: "The linked technical scenario passed in the supplied run.",
    notEstablished: ["human usability"],
    residualUnknowns: ["production conversion"]
  };
  const a = issueAssuranceReceipt(input);
  const b = issueAssuranceReceipt(input);
  assert.equal(a.receiptId, b.receiptId);
  assert.match(a.receiptId, /^receipt:\/\//);
  assert.deepEqual(a.deceptiveWitnessAudit, input.deceptiveWitnessAudit);
  assert.deepEqual(a.claimReview, input.claimReview);
});
