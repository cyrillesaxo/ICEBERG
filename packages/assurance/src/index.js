import crypto from "node:crypto";
import { prioritizeScenarioGaps, scenarioContextSignalMap } from "../../core/src/prioritize.js";
import { auditDeceptiveWitnesses, inspectDeceptiveWitness, listDeceptiveWitnessRules } from "./deceptive-witness.js";
import {
  buildClaimChallenge,
  buildPlainLanguageReview,
  listDeceptionMechanisms,
  listSemanticTypes
} from "./semantic-claim.js";

const STRONG_SUPPORT_STATES = new Set(["linked-pass", "runtime-pass", "reproduced-witness", "verified"]);
const STRONG_ANTI_STATES = new Set(["linked-fail", "runtime-fail", "reproduced-antiwitness"]);
const UNRESOLVED_STATES = new Set(["unknown", "unverified", "candidate", "candidate-covered", "partial", "runtime-candidate", "linked-flaky"]);

const DEFAULT_LICENSES = Object.freeze([
  "technical-ui-runtime",
  "accessibility-complete",
  "cognitive-usability",
  "production-journey-health",
  "business-outcome"
]);

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeEvidence(item = {}, index = 0) {
  if (typeof item === "string") return { id: `E-${index + 1}`, state: item };
  return {
    id: item.id || `E-${index + 1}`,
    state: item.state || "unknown",
    channel: item.channel || null,
    source: item.source || null,
    scope: item.scope || null,
    scenarioId: item.scenarioId || null,
    note: item.note || null,
    evidenceRisks: item.evidenceRisks || item.risks || [],
    characteristics: item.characteristics || {}
  };
}

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

function evidenceStateCounts(evidence) {
  return evidence.reduce((acc, item) => {
    acc[item.state] = (acc[item.state] || 0) + 1;
    return acc;
  }, {});
}

export function selectFirstBite(gaps = [], riskSignals = [], options = {}) {
  const ranked = prioritizeScenarioGaps(gaps, riskSignals);
  const deceptiveAudit = auditDeceptiveWitnesses(options.deceptiveWitnesses || []);
  const testNext = ranked[0] || null;
  const deceptionNext = deceptiveAudit.firstDeceptionProbe;
  const sameScenarioDeception = Boolean(
    testNext && deceptionNext && deceptionNext.scenarioId && deceptionNext.scenarioId === testNext.id
  );

  return {
    schema: "ui-iceberg-first-bite-v0.4",
    testNext,
    alternatives: ranked.slice(1, 4),
    considered: ranked.length,
    deceptiveWitnessNext: deceptionNext,
    recommendedNext: sameScenarioDeception
      ? {
          kind: "DECEPTIVE_WITNESS_PROBE",
          scenarioId: testNext.id,
          probe: deceptionNext.recommendedProbe,
          reason: "The highest-value scenario gap is also supported by a witness whose evidence channel can overstate the requested claim. Probe the distortion before admitting the apparent support."
        }
      : testNext
        ? {
            kind: "SCENARIO_GAP_PROBE",
            scenarioId: testNext.id,
            probe: testNext,
            reason: "The highest-ranked scenario gap remains the smallest bounded next test; deceptive-witness probes are exposed separately when they concern other claims."
          }
        : deceptionNext
          ? {
              kind: "DECEPTIVE_WITNESS_PROBE",
              scenarioId: deceptionNext.scenarioId || null,
              probe: deceptionNext.recommendedProbe,
              reason: "No scenario gap was supplied, but an apparent witness has a claim-blocking evidence-channel distortion worth discriminating."
            }
          : null,
    deceptiveWitnessAudit: {
      total: deceptiveAudit.total,
      counts: deceptiveAudit.counts,
      taxonomyStatus: deceptiveAudit.taxonomyStatus
    },
    boundary: "First Bite ranks discriminating test hypotheses and can prioritize a deceptive-witness probe when it directly contaminates the top scenario claim. It is not a defect probability, proof of user impact, or admission verdict."
  };
}

export function admitEvidence(input = {}) {
  const claim = input.claim || {};
  const scope = input.scope || claim.scope || "technical-ui-runtime";
  const evidence = (input.evidence || []).map(normalizeEvidence);
  const explicitAntiwitnesses = (input.antiwitnesses || []).map((item, index) => normalizeEvidence(item, index));
  const embeddedAntiwitnesses = evidence.filter((item) => STRONG_ANTI_STATES.has(item.state));
  const antiwitnesses = [...explicitAntiwitnesses, ...embeddedAntiwitnesses];
  const supporting = evidence.filter((item) => STRONG_SUPPORT_STATES.has(item.state));
  const flaky = evidence.filter((item) => item.state === "linked-flaky");
  const unresolved = evidence.filter((item) => UNRESOLVED_STATES.has(item.state));
  const strongAntiwitnesses = antiwitnesses.filter((item) => STRONG_ANTI_STATES.has(item.state) || item.state === "verified");

  const supportingAudits = supporting.map((item) => inspectDeceptiveWitness({
    claim,
    scope,
    witness: item,
    evidenceRisks: item.evidenceRisks,
    characteristics: item.characteristics
  }));
  const cleanSupporting = supportingAudits.filter((audit) => audit.classification === "CLEAN_WITNESS");
  const weakenedSupporting = supportingAudits.filter((audit) => audit.classification === "WEAKENED_WITNESS");
  const deceptiveSupporting = supportingAudits.filter((audit) => audit.classification === "DECEPTIVE_WITNESS_CANDIDATE");
  const eligibleSupporting = [...cleanSupporting, ...weakenedSupporting];

  let verdict = "INCONCLUSIVE";
  let rationale = "No strong runtime witness or antiwitness licenses the claim.";
  if (strongAntiwitnesses.length) {
    verdict = "REJECTED";
    rationale = "At least one strong antiwitness contradicts the requested claim within the evaluated scope.";
  } else if (eligibleSupporting.length && flaky.length === 0) {
    verdict = "ADMITTED_WITH_SCOPE";
    rationale = deceptiveSupporting.length
      ? "At least one strong witness still licenses the requested scope after deceptive-witness filtering; other apparent witnesses were weakened or excluded from licensing."
      : "Strong supporting runtime evidence exists and no strong antiwitness, claim-blocking deceptive witness, or flaky-only conflict prevents scoped admission.";
  } else if (supporting.length && deceptiveSupporting.length === supporting.length) {
    rationale = "Nominally green runtime evidence exists, but every strong supporting witness has a claim-blocking evidence-channel distortion for the requested scope.";
  } else if (supporting.length && flaky.length) {
    rationale = "Supporting runtime evidence exists, but retry-dependent/flaky evidence preserves a material contradiction in execution stability.";
  } else if (flaky.length) {
    rationale = "Retry-dependent success is not normalized to PASS; the claim remains inconclusive.";
  }

  const licenses = Object.fromEntries(DEFAULT_LICENSES.map((name) => [name, "unknown"]));
  if (!(scope in licenses)) licenses[scope] = "unknown";
  licenses[scope] = verdict === "ADMITTED_WITH_SCOPE" ? "admitted" : verdict === "REJECTED" ? "rejected" : "unknown";

  const unresolvedInterpretations = uniq([
    ...unresolved.map((item) => `${item.id}:${item.state}`),
    ...(supporting.length === 0 && strongAntiwitnesses.length === 0 ? ["no-strong-runtime-witness"] : []),
    ...(flaky.length ? ["retry-dependent-execution"] : []),
    ...deceptiveSupporting.map((audit) => `${audit.witnessId || "witness"}:deceptive-witness:${audit.distortions.map((item) => item.distortion).join("+")}`)
  ]);

  const deceptiveWitnessAudit = {
    taxonomyStatus: "bounded-public-subset",
    totalSupporting: supportingAudits.length,
    cleanSupporting: cleanSupporting.map((audit) => audit.witnessId),
    weakenedSupporting: weakenedSupporting.map((audit) => audit.witnessId),
    deceptiveSupporting: deceptiveSupporting.map((audit) => audit.witnessId),
    audits: supportingAudits,
    firstDeceptionProbe: deceptiveSupporting.find((audit) => audit.recommendedProbe) || null
  };

  const receiptCore = {
    claim,
    scope,
    evidence,
    antiwitnesses,
    deceptiveWitnessAudit,
    verdict,
    licenses
  };

  return {
    schema: "ui-iceberg-admission-v0.4",
    receiptId: `admission://${stableHash(receiptCore)}`,
    claim,
    requestedScope: scope,
    verdict,
    rationale,
    evidenceSummary: {
      total: evidence.length,
      states: evidenceStateCounts(evidence),
      nominalStrongSupportingWitnesses: supporting.map((item) => item.id),
      licensingSupportingWitnesses: eligibleSupporting.map((audit) => audit.witnessId),
      deceptiveSupportingWitnesses: deceptiveSupporting.map((audit) => audit.witnessId),
      strongAntiwitnesses: strongAntiwitnesses.map((item) => item.id),
      flakyWitnesses: flaky.map((item) => item.id)
    },
    deceptiveWitnessAudit,
    licenses,
    semanticEntropy: {
      unresolvedCount: unresolvedInterpretations.length,
      unresolvedInterpretations
    },
    boundary: "Admission is scoped to the supplied claim, evidence, and evidence channel. Nominally green evidence is filtered for bounded deceptive-witness distortions before licensing. This does not inherit stronger human, accessibility, production, causal, or business claims unless separately licensed."
  };
}

export function reviewClaim(input = {}) {
  const claim = input.claim || {};
  const scope = input.scope || claim.scope || "technical-ui-runtime";
  const evidence = (input.evidence || []).map(normalizeEvidence);
  const admission = admitEvidence({ ...input, claim, scope, evidence });
  const challenge = buildClaimChallenge({
    claim,
    semanticTypes: input.semanticTypes,
    gapTypes: input.gapTypes,
    scenario: input.scenario,
    mechanismChecks: input.mechanismChecks,
    audits: admission.deceptiveWitnessAudit?.audits || []
  });

  const deceptiveWitnesses = evidence.map((witness) => ({
    claim,
    scope,
    scenarioId: witness.scenarioId,
    witness,
    evidenceRisks: witness.evidenceRisks,
    characteristics: witness.characteristics
  }));
  const firstBite = (input.gaps || []).length
    ? selectFirstBite(input.gaps, input.riskSignals || [], { deceptiveWitnesses })
    : null;
  const userFacing = buildPlainLanguageReview({
    admission,
    challenge,
    nextScenario: firstBite?.testNext || null
  });

  const result = {
    schema: "ui-iceberg-claim-review-v0.5",
    userFacing
  };
  if (input.includeInternal === true) {
    result.internal = {
      admission,
      challenge,
      firstBite
    };
  }
  return result;
}

function scenarioSignals(scenario, contextMap) {
  return uniq([
    ...(scenario.riskSignals || []),
    ...(scenario.matchedRiskSignals || []),
    ...(scenario.recommendation?.matchedContextSignals || []),
    ...(contextMap[scenario.id] || []),
    ...(scenario.dependencies?.signals || [])
  ]);
}

function scenarioFiles(scenario) {
  return uniq([...(scenario.dependencies?.files || [])]);
}

function pathMatches(changed, dependency) {
  const c = String(changed).replaceAll("\\", "/");
  const d = String(dependency).replaceAll("\\", "/");
  return c === d || c.startsWith(`${d}/`) || d.startsWith(`${c}/`);
}

export function analyzeReactivationImpact(input = {}) {
  const contextMap = scenarioContextSignalMap();
  const changedSignals = new Set((input.changedSignals || []).map((item) => typeof item === "string" ? item : item.id).filter(Boolean));
  const changedFiles = uniq(input.changedFiles || []);
  const scenarios = input.scenarios || input.previousReceipt?.scenarios || input.previousReceipt?.gap_map?.scenarios || [];

  const reactivated = [];
  const unaffected = [];
  const matchedFiles = new Set();

  for (const scenario of scenarios) {
    const signals = scenarioSignals(scenario, contextMap);
    const dependencies = scenarioFiles(scenario);
    const signalMatches = signals.filter((signal) => changedSignals.has(signal));
    const fileMatches = changedFiles.filter((file) => dependencies.some((dependency) => pathMatches(file, dependency)));
    fileMatches.forEach((file) => matchedFiles.add(file));

    if (signalMatches.length || fileMatches.length) {
      reactivated.push({
        id: scenario.id,
        title: scenario.title || null,
        reasons: {
          changedSignals: signalMatches,
          changedFiles: fileMatches
        },
        previousEvidence: scenario.evidence?.state || "unknown"
      });
    } else if (signals.length || dependencies.length) {
      unaffected.push({ id: scenario.id, title: scenario.title || null });
    }
  }

  const unknownFiles = changedFiles.filter((file) => !matchedFiles.has(file));
  const unknownImpact = [];
  if (unknownFiles.length) unknownImpact.push("changed-files-without-explicit-scenario-dependency");
  if (!scenarios.length) unknownImpact.push("no-scenario-dependency-state-supplied");

  return {
    schema: "ui-iceberg-reactivation-impact-v0.4",
    reactivated,
    unaffected,
    unknown: {
      files: unknownFiles,
      reasons: unknownImpact
    },
    summary: {
      scenarioCount: scenarios.length,
      reactivated: reactivated.length,
      unaffected: unaffected.length,
      unknownFiles: unknownFiles.length
    },
    boundary: "Reactivation is dependency invalidation, not defect detection. Unmapped changed files remain unknown rather than being treated as safe."
  };
}

export function issueAssuranceReceipt(input = {}) {
  const receipt = {
    schema: "ui-iceberg-assurance-receipt-v0.5",
    project: input.project || null,
    journey: input.journey || null,
    scan: input.scan || null,
    gapMap: input.gapMap || null,
    deceptiveWitnessAudit: input.deceptiveWitnessAudit || input.admission?.deceptiveWitnessAudit || null,
    claimReview: input.claimReview || null,
    testNext: input.testNext || null,
    admission: input.admission || null,
    reactivation: input.reactivation || null,
    allowedConclusion: input.allowedConclusion || null,
    notEstablished: input.notEstablished || [],
    residualUnknowns: input.residualUnknowns || []
  };
  return {
    ...receipt,
    receiptId: `receipt://${stableHash(receipt)}`,
    boundary: "The receipt preserves the supplied evidence boundary, including deceptive-witness filtering and claim-review state. Missing evidence, unknown dependencies, flaky execution, evidence-channel distortion, and unlicensed claim scopes remain explicit."
  };
}

export {
  auditDeceptiveWitnesses,
  buildClaimChallenge,
  buildPlainLanguageReview,
  inspectDeceptiveWitness,
  listDeceptionMechanisms,
  listDeceptiveWitnessRules,
  listSemanticTypes
};
