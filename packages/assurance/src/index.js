import crypto from "node:crypto";
import { prioritizeScenarioGaps, scenarioContextSignalMap } from "../../core/src/prioritize.js";

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
    note: item.note || null
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

export function selectFirstBite(gaps = [], riskSignals = []) {
  const ranked = prioritizeScenarioGaps(gaps, riskSignals);
  return {
    schema: "ui-iceberg-first-bite-v0.3",
    testNext: ranked[0] || null,
    alternatives: ranked.slice(1, 4),
    considered: ranked.length,
    boundary: "First Bite ranks discriminating test hypotheses. It is not a defect probability, proof of user impact, or admission verdict."
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

  let verdict = "INCONCLUSIVE";
  let rationale = "No strong runtime witness or antiwitness licenses the claim.";
  if (strongAntiwitnesses.length) {
    verdict = "REJECTED";
    rationale = "At least one strong antiwitness contradicts the requested claim within the evaluated scope.";
  } else if (supporting.length && flaky.length === 0) {
    verdict = "ADMITTED_WITH_SCOPE";
    rationale = "Strong supporting runtime evidence exists and no strong antiwitness or flaky-only conflict was supplied.";
  } else if (supporting.length && flaky.length) {
    rationale = "Supporting runtime evidence exists, but retry-dependent/flaky evidence preserves a material contradiction in execution stability.";
  } else if (flaky.length) {
    rationale = "Retry-dependent success is not normalized to PASS; the claim remains inconclusive.";
  }

  const licenses = Object.fromEntries(DEFAULT_LICENSES.map((name) => [name, "unknown"]));
  licenses[scope] = verdict === "ADMITTED_WITH_SCOPE" ? "admitted" : verdict === "REJECTED" ? "rejected" : "unknown";

  const unresolvedInterpretations = uniq([
    ...unresolved.map((item) => `${item.id}:${item.state}`),
    ...(supporting.length === 0 && strongAntiwitnesses.length === 0 ? ["no-strong-runtime-witness"] : []),
    ...(flaky.length ? ["retry-dependent-execution"] : [])
  ]);

  const receiptCore = {
    claim,
    scope,
    evidence,
    antiwitnesses,
    verdict,
    licenses
  };

  return {
    schema: "ui-iceberg-admission-v0.3",
    receiptId: `admission://${stableHash(receiptCore)}`,
    claim,
    requestedScope: scope,
    verdict,
    rationale,
    evidenceSummary: {
      total: evidence.length,
      states: evidenceStateCounts(evidence),
      strongSupportingWitnesses: supporting.map((item) => item.id),
      strongAntiwitnesses: strongAntiwitnesses.map((item) => item.id),
      flakyWitnesses: flaky.map((item) => item.id)
    },
    licenses,
    semanticEntropy: {
      unresolvedCount: unresolvedInterpretations.length,
      unresolvedInterpretations
    },
    boundary: "Admission is scoped to the supplied claim, evidence, and evidence channel. It does not inherit stronger human, accessibility, production, causal, or business claims unless separately licensed."
  };
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
    schema: "ui-iceberg-reactivation-impact-v0.3",
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
    schema: "ui-iceberg-assurance-receipt-v0.3",
    project: input.project || null,
    journey: input.journey || null,
    scan: input.scan || null,
    gapMap: input.gapMap || null,
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
    boundary: "The receipt preserves the supplied evidence boundary. Missing evidence, unknown dependencies, flaky execution, and unlicensed claim scopes remain explicit."
  };
}
