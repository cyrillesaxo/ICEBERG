import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSemanticAssurance,
  measureDeceptiveWitnesses,
  semanticTaxonomy,
  semanticTypesForScenario
} from "../packages/core/src/semantic-assurance.js";

test("exposes the 12-type semantic taxonomy", () => {
  const taxonomy = semanticTaxonomy();
  assert.equal(taxonomy.length, 12);
  assert.deepEqual(taxonomy.map((item) => item.id), Array.from({ length: 12 }, (_, i) => `G${i + 1}`));
});

test("maps interruption and authority scenarios onto typed semantic coordinates", () => {
  const types = semanticTypesForScenario({
    id: "OTP_INTERRUPT_RETURN",
    title: "Leave checkout for OTP and return with state intact",
    signals: ["otp", "return", "resume"],
    category: "interruption"
  }, [{ id: "auth-session" }, { id: "external-redirect" }]);
  for (const expected of ["G4", "G9", "G11", "G12"]) assert.ok(types.includes(expected));
});

test("deceptive witness correction withholds unjustified certainty", () => {
  const scenario = {
    id: "OTP_INTERRUPT_RETURN",
    title: "Leave checkout for OTP and return with state intact",
    priority: "critical",
    evidence: { state: "candidate-covered", score: 1, files: [{ file: "a.spec.js" }, { file: "b.spec.js" }] }
  };
  const findings = measureDeceptiveWitnesses(scenario, [
    { id: "NETWORK_MOCK", hits: 3 },
    { id: "RETRY_ENABLED", hits: 1 }
  ], [{ id: "auth-session" }, { id: "external-redirect" }]);
  assert.ok(findings.some((item) => item.id === "DW_MOCKED_PATH_AS_PRODUCTION_AUTHORITY"));
  assert.ok(findings.some((item) => item.id === "DW_CORRELATED_STATIC_CHANNEL"));
});

test("builds a bounded manifold receipt and First Bite recommendation", () => {
  const report = {
    riskSignals: [{ id: "auth-session" }, { id: "external-redirect" }, { id: "async-network" }],
    testEvidenceRisks: [{ id: "NETWORK_MOCK", hits: 2, severity: "medium" }],
    scenarios: [
      {
        id: "CORE_SUCCESS",
        title: "Complete checkout successfully",
        priority: "critical",
        evidence: { state: "candidate-covered", score: 1, files: [{ file: "checkout.spec.js" }] }
      },
      {
        id: "OTP_INTERRUPT_RETURN",
        title: "Leave checkout for OTP and return with state intact",
        priority: "critical",
        evidence: { state: "missing", score: 0, files: [] }
      }
    ],
    gaps: [
      {
        id: "OTP_INTERRUPT_RETURN",
        title: "Leave checkout for OTP and return with state intact",
        priority: "critical",
        evidence: { state: "missing", score: 0, files: [] }
      }
    ]
  };

  const result = buildSemanticAssurance(report);
  assert.equal(result.schema, "ui-iceberg-semantic-assurance-v0.1");
  assert.equal(result.admission.status, "INCONCLUSIVE");
  assert.ok(result.summary.activeCoordinates > 0);
  assert.ok(result.summary.semanticEntropy > 0);
  assert.ok(result.coordinates.find((item) => item.id === "G11").applicable);
  assert.equal(result.firstBite.next.scenarioId, "OTP_INTERRUPT_RETURN");
  assert.ok(result.couplingCandidates.some((item) => item.gTypes.includes("G11") && item.gTypes.includes("G12")));
});
