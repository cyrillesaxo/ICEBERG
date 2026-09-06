import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSemanticManifoldProjection,
  issueAssuranceReceipt,
  reviewClaim
} from "../packages/assurance/src/index.js";

function deceptiveReview(extra = {}) {
  return reviewClaim({
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
      evidenceRisks: ["NETWORK_MOCK"]
    }],
    pressures: ["otp-return"],
    riskSignals: ["external-redirect"],
    includeInternal: true,
    ...extra
  });
}

test("claim review exposes a bounded semantic manifold only in internal output", () => {
  const internal = deceptiveReview();
  assert.equal(internal.internal.semanticManifold.schema, "ui-iceberg-semantic-manifold-v0.6");
  assert.equal(internal.internal.semanticManifold.temporalVector, null);
  assert.equal(internal.internal.semanticManifold.summary.temporalFlux.mode, "unavailable-no-prior-receipt");
  assert.ok(internal.internal.semanticManifold.coordinates.every((coordinate) =>
    coordinate.trajectoryDirection === "unresolved-no-prior-receipt"
  ));

  const publicReview = reviewClaim({
    claim: { id: "otp-return", semanticTypes: ["G4", "G11", "G12"] },
    evidence: [{ id: "W1", state: "linked-pass", evidenceRisks: ["NETWORK_MOCK"] }]
  });
  assert.equal(publicReview.internal, undefined);
  assert.doesNotMatch(JSON.stringify(publicReview.userFacing), /G\d+_|semantic manifold|semantic entropy|first bite|admission/i);
});

test("network-mock deceptive witness retracts certainty on affected semantic types", () => {
  const manifold = deceptiveReview().internal.semanticManifold;
  const g12 = manifold.coordinates.find((coordinate) => coordinate.id === "G12_AUTHORITY");
  const g4 = manifold.coordinates.find((coordinate) => coordinate.id === "G4_EDGE");

  assert.ok(g12.nominalP > g12.pHat);
  assert.ok(g12.entropy.deceptiveWitnessDelta > 0);
  assert.ok(g12.risk.deceptiveWitnessDelta > 0);
  assert.ok(g12.observations.some((observation) => observation.role === "support-withheld-on-type"));

  assert.ok(g4.nominalP > g4.pHat);
  assert.ok(g4.observations.some((observation) => observation.role === "support-narrowed-outside-distortion"));
  assert.ok(g12.risk.deceptiveWitnessDelta > g4.risk.deceptiveWitnessDelta);
});

test("explicit typed evidence receives stronger coordinate coverage than claim-level inference", () => {
  const result = reviewClaim({
    claim: { id: "authority", semanticTypes: ["G4", "G12"] },
    evidence: [{
      id: "W-AUTH",
      state: "linked-pass",
      channel: "runtime-contract",
      semanticTypes: ["G12"]
    }],
    includeInternal: true
  });
  const manifold = result.internal.semanticManifold;
  const g12 = manifold.coordinates.find((coordinate) => coordinate.id === "G12_AUTHORITY");
  const g4 = manifold.coordinates.find((coordinate) => coordinate.id === "G4_EDGE");
  assert.ok(g12.pHat > g4.pHat);
  assert.ok(g12.observations.some((observation) => observation.coverageBasis === "explicit-evidence-type"));
});

test("prior manifold enables temporal direction and finite-difference entropy/risk flux", () => {
  const before = deceptiveReview().internal.semanticManifold;
  const after = reviewClaim({
    claim: {
      id: "otp-return",
      semanticTypes: ["G4", "G11", "G12"]
    },
    scope: "technical-ui-runtime",
    evidence: [{
      id: "W-REAL",
      state: "linked-pass",
      channel: "production-contract",
      semanticTypes: ["G12"]
    }],
    previousSemanticManifold: before,
    includeInternal: true
  }).internal.semanticManifold;

  const g12 = after.coordinates.find((coordinate) => coordinate.id === "G12_AUTHORITY");
  assert.ok(g12.temporalDelta > 0);
  assert.equal(g12.trajectoryDirection, "toward-admitted-regime");
  assert.notEqual(after.temporalVector, null);
  assert.equal(after.summary.temporalFlux.mode, "finite-difference-between-receipts");
  assert.equal(typeof after.summary.temporalFlux.entropyDelta, "number");
  assert.equal(typeof after.summary.temporalFlux.riskDelta, "number");
});

test("couplings remain hypotheses and never invent a metric-tensor weight", () => {
  const manifold = deceptiveReview().internal.semanticManifold;
  const authorityCoupling = manifold.couplingCandidates.find((candidate) =>
    candidate.semanticTypes.includes("G12_AUTHORITY") && candidate.semanticTypes.includes("G8_EVIDENCE")
  );
  assert.ok(authorityCoupling);
  assert.equal(authorityCoupling.status, "co-activated-hypothesis");
  assert.equal("weight" in authorityCoupling, false);
  assert.match(authorityCoupling.boundary, /no metric-tensor weight/i);
});

test("semantic First Bite frontier is entropy/risk-aware but remains ordinal", () => {
  const manifold = deceptiveReview().internal.semanticManifold;
  assert.ok(manifold.firstBiteFrontier.length > 0);
  const next = manifold.firstBiteFrontier[0];
  assert.equal(typeof next.semanticValue, "number");
  assert.ok(next.expectedEntropyCoverage >= 0);
  assert.ok(next.decisionRiskCoverage >= 0);
  assert.match(next.boundary, /not expected defect yield/i);
  assert.deepEqual(manifold.pressureContext.sort(), ["external-redirect", "otp-return"]);
});

test("assurance receipt preserves manifold state deterministically", () => {
  const claimReview = deceptiveReview();
  const a = issueAssuranceReceipt({ project: "fixture", journey: "checkout", claimReview });
  const b = issueAssuranceReceipt({ project: "fixture", journey: "checkout", claimReview });
  assert.equal(a.receiptId, b.receiptId);
  assert.deepEqual(a.semanticManifold, claimReview.internal.semanticManifold);
});

test("direct manifold API never fabricates temporal direction without prior evidence", () => {
  const manifold = buildSemanticManifoldProjection({
    claim: { id: "simple", semanticTypes: ["G8"] },
    evidence: [{ id: "W1", state: "linked-pass", semanticTypes: ["G8"] }],
    challenge: { semanticTypes: [{ id: "G8_EVIDENCE" }], deceptionMechanisms: [], probeCandidates: [] },
    admission: { deceptiveWitnessAudit: { audits: [] } }
  });
  assert.equal(manifold.temporalVector, null);
  assert.equal(manifold.coordinates[0].trajectoryDirection, "unresolved-no-prior-receipt");
});
