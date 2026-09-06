import {
  DECEPTION_MECHANISMS,
  SEMANTIC_TYPE_CATALOG,
  SEMANTIC_TYPES
} from "./semantic-claim.js";

const SUPPORT_STATES = new Set(["linked-pass", "runtime-pass", "reproduced-witness", "verified"]);
const ANTI_STATES = new Set(["linked-fail", "runtime-fail", "reproduced-antiwitness"]);
const UNRESOLVED_STATES = new Set(["unknown", "unverified", "candidate", "candidate-covered", "partial", "runtime-candidate"]);
const FLAKY_STATES = new Set(["linked-flaky"]);
const EPSILON = 0.01;
const PRIOR_STRENGTH = 1;

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function binaryEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

function normalizeSemanticType(value = "") {
  const raw = String(value || "").trim().toUpperCase();
  if (SEMANTIC_TYPE_CATALOG[raw]) return raw;
  const key = Object.keys(SEMANTIC_TYPE_CATALOG).find((candidate) =>
    candidate.startsWith(`${raw}_`) || SEMANTIC_TYPE_CATALOG[candidate].code === raw
  );
  return key || null;
}

function normalizeTypeList(values = []) {
  return uniq(values.map((value) => typeof value === "string" ? value : value?.id || value?.code).map(normalizeSemanticType));
}

function auditMap(admission = {}) {
  return new Map((admission.deceptiveWitnessAudit?.audits || [])
    .filter((audit) => audit.witnessId)
    .map((audit) => [audit.witnessId, audit]));
}

function deceptiveTypesForWitness(challenge = {}, witnessId) {
  return uniq((challenge.deceptionMechanisms || []).flatMap((mechanism) => {
    if (mechanism.status !== "triggered") return [];
    if (!(mechanism.triggeredBy || []).some((trigger) => trigger.witnessId === witnessId)) return [];
    return DECEPTION_MECHANISMS[mechanism.id]?.semanticTypes || [];
  }));
}

function evidenceValue(state, audit, semanticType, deceptiveTypes, forceAnti = false) {
  if (forceAnti || ANTI_STATES.has(state)) return { nominal: 0, corrected: 0, role: "antiwitness" };
  if (SUPPORT_STATES.has(state)) {
    if (audit?.classification === "DECEPTIVE_WITNESS_CANDIDATE" || audit?.classification === "NON_WITNESS_OBLIGATION") {
      const directlyAffected = deceptiveTypes.includes(semanticType);
      return directlyAffected
        ? { nominal: 1, corrected: 0.5, role: "support-withheld-on-type" }
        : { nominal: 1, corrected: 0.75, role: "support-narrowed-outside-distortion" };
    }
    if (audit?.classification === "WEAKENED_WITNESS") return { nominal: 1, corrected: 0.75, role: "weakened-support" };
    return { nominal: 1, corrected: 1, role: "support" };
  }
  if (FLAKY_STATES.has(state)) {
    return semanticType === SEMANTIC_TYPES.G11_TEMPORAL
      ? { nominal: 0.75, corrected: 0.5, role: "flaky-temporal-support-withheld" }
      : { nominal: 0.75, corrected: 0.65, role: "flaky-support-narrowed" };
  }
  if (UNRESOLVED_STATES.has(state) || !state) return { nominal: 0.5, corrected: 0.5, role: "unresolved" };
  return { nominal: 0.5, corrected: 0.5, role: "unresolved" };
}

function evidenceCoverage(item, claimTypes, activeTypes) {
  const explicit = normalizeTypeList(item.semanticTypes || item.gapTypes || []);
  const coverage = [{ id: SEMANTIC_TYPES.G8_EVIDENCE, weight: 1, basis: "evidence-channel" }];
  if (explicit.length) {
    for (const id of explicit) {
      if (id !== SEMANTIC_TYPES.G8_EVIDENCE) coverage.push({ id, weight: 1, basis: "explicit-evidence-type" });
    }
    return coverage;
  }

  for (const id of claimTypes) {
    if (id !== SEMANTIC_TYPES.G8_EVIDENCE && activeTypes.includes(id)) {
      coverage.push({ id, weight: 0.5, basis: "claim-level-inference" });
    }
  }
  return coverage;
}

function observationRows({ evidence = [], antiwitnesses = [], claimTypes, activeTypes, admission, challenge }) {
  const audits = auditMap(admission);
  const rows = [];
  const seen = new Set();

  const add = (item, forceAnti = false, index = 0) => {
    const id = item.id || `${forceAnti ? "AW" : "E"}-${index + 1}`;
    const key = `${forceAnti ? "anti" : "evidence"}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const state = item.state || (forceAnti ? "reproduced-antiwitness" : "unknown");
    const audit = audits.get(id) || null;
    const deceptiveTypes = deceptiveTypesForWitness(challenge, id);
    for (const coverage of evidenceCoverage(item, claimTypes, activeTypes)) {
      if (!activeTypes.includes(coverage.id)) continue;
      const value = evidenceValue(state, audit, coverage.id, deceptiveTypes, forceAnti);
      rows.push({
        witnessId: id,
        semanticType: coverage.id,
        weight: coverage.weight,
        coverageBasis: coverage.basis,
        state,
        channel: item.channel || null,
        nominalValue: value.nominal,
        correctedValue: value.corrected,
        role: value.role,
        deceptiveClassification: audit?.classification || null,
        distortions: (audit?.distortions || []).map((distortion) => distortion.distortion)
      });
    }
  };

  evidence.forEach((item, index) => add(item, false, index));
  antiwitnesses.forEach((item, index) => add(item, true, index));
  return rows;
}

function posterior(rows, field) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const weightedValue = rows.reduce((sum, row) => sum + row.weight * row[field], 0);
  return clamp((PRIOR_STRENGTH + weightedValue) / (2 * PRIOR_STRENGTH + totalWeight));
}

function semanticWeights(activeTypes, supplied = {}) {
  const raw = Object.fromEntries(activeTypes.map((id) => {
    const code = SEMANTIC_TYPE_CATALOG[id]?.code;
    const candidate = Number(supplied[id] ?? supplied[code] ?? 1);
    return [id, Number.isFinite(candidate) && candidate > 0 ? candidate : 1];
  }));
  const total = Object.values(raw).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, value / total]));
}

function previousCoordinateMap(previous = {}) {
  return new Map((previous.coordinates || []).flatMap((coordinate) => {
    const id = normalizeSemanticType(coordinate.id || coordinate.code);
    return id ? [[id, coordinate]] : [];
  }));
}

function temporalDirection(delta) {
  if (!Number.isFinite(delta)) return "unresolved-no-prior-receipt";
  if (delta > EPSILON) return "toward-admitted-regime";
  if (delta < -EPSILON) return "away-from-admitted-regime";
  return "stable";
}

function fluxClassification(deltaH, deltaR) {
  if (!Number.isFinite(deltaH) || !Number.isFinite(deltaR)) return "unresolved-no-prior-receipt";
  if (Math.abs(deltaH) <= EPSILON && Math.abs(deltaR) <= EPSILON) return "stable";
  if (deltaH < 0 && deltaR < 0) return "genuine-convergence";
  if (deltaH > 0 && deltaR > 0) return "chaotic-divergence";
  if (deltaH < 0 && deltaR > 0) return "deceptive-stabilization";
  if (deltaH > 0 && deltaR < 0) return "improving-but-uncertain";
  return "mixed-or-unresolved";
}

function buildCouplings(challenge = {}, activeTypes = []) {
  const pairs = new Map();
  for (const state of challenge.deceptionMechanisms || []) {
    if (state.status !== "triggered") continue;
    const types = (DECEPTION_MECHANISMS[state.id]?.semanticTypes || []).filter((id) => activeTypes.includes(id));
    for (let i = 0; i < types.length; i += 1) {
      for (let j = i + 1; j < types.length; j += 1) {
        const ordered = [types[i], types[j]].sort((a, b) => SEMANTIC_TYPE_CATALOG[a].code.localeCompare(SEMANTIC_TYPE_CATALOG[b].code, undefined, { numeric: true }));
        const key = `${ordered[0]}×${ordered[1]}`;
        const existing = pairs.get(key) || {
          id: key,
          semanticTypes: ordered,
          mechanisms: new Set(),
          witnessIds: new Set(),
          riskIds: new Set()
        };
        existing.mechanisms.add(state.id);
        for (const trigger of state.triggeredBy || []) {
          if (trigger.witnessId) existing.witnessIds.add(trigger.witnessId);
          if (trigger.riskId) existing.riskIds.add(trigger.riskId);
        }
        pairs.set(key, existing);
      }
    }
  }
  return [...pairs.values()].map((item) => ({
    id: item.id,
    semanticTypes: item.semanticTypes,
    mechanisms: [...item.mechanisms],
    witnessIds: [...item.witnessIds],
    riskIds: [...item.riskIds],
    status: "co-activated-hypothesis",
    boundary: "Co-activation is evidence for a coupling candidate only; no metric-tensor weight or causal interaction is inferred."
  }));
}

function buildProbeFrontier(challenge, coordinates, weights) {
  const byId = new Map(coordinates.map((coordinate) => [coordinate.id, coordinate]));
  return (challenge.probeCandidates || []).map((candidate) => {
    const covered = (candidate.semanticTypesCovered || []).filter((id) => byId.has(id));
    const entropyCoverage = covered.reduce((sum, id) => sum + weights[id] * byId.get(id).entropy.corrected, 0);
    const riskCoverage = covered.reduce((sum, id) => sum + weights[id] * byId.get(id).risk.corrected, 0);
    const couplingCoverage = Math.max(0, covered.length - 1);
    const cost = Math.max(1, candidate.cost || 1);
    const value = (2 * entropyCoverage + riskCoverage + (candidate.mechanismsCovered?.length || 0) * 0.5 + couplingCoverage * 0.25) / cost;
    return {
      probeId: candidate.id,
      title: candidate.title,
      semanticTypesCovered: covered,
      mechanismsCovered: candidate.mechanismsCovered || [],
      expectedEntropyCoverage: Number(entropyCoverage.toFixed(4)),
      decisionRiskCoverage: Number(riskCoverage.toFixed(4)),
      couplingCoverage,
      relativeCost: cost,
      semanticValue: Number(value.toFixed(4)),
      boundary: "Semantic value ranks probes by currently unresolved typed evidence; it is not expected defect yield, monetary ROI, or calibrated information gain."
    };
  }).sort((a, b) => b.semanticValue - a.semanticValue || a.relativeCost - b.relativeCost || a.probeId.localeCompare(b.probeId));
}

export function buildSemanticManifoldProjection(input = {}) {
  const claim = input.claim || {};
  const challenge = input.challenge || {};
  const admission = input.admission || {};
  const claimTypes = normalizeTypeList([
    ...(claim.semanticTypes || claim.gapTypes || []),
    ...(input.semanticTypes || input.gapTypes || [])
  ]);
  const activeTypes = uniq([
    ...normalizeTypeList((challenge.semanticTypes || []).map((item) => item.id || item.code)),
    ...claimTypes,
    SEMANTIC_TYPES.G8_EVIDENCE
  ]);
  const rows = observationRows({
    evidence: input.evidence || [],
    antiwitnesses: input.antiwitnesses || [],
    claimTypes,
    activeTypes,
    admission,
    challenge
  });
  const weights = semanticWeights(activeTypes, input.semanticWeights || claim.semanticWeights || {});
  const previous = previousCoordinateMap(input.previous || {});

  const coordinates = activeTypes.map((id) => {
    const observations = rows.filter((row) => row.semanticType === id);
    const nominal = posterior(observations, "nominalValue");
    const corrected = posterior(observations, "correctedValue");
    const prior = previous.get(id);
    const previousP = Number(prior?.pHat ?? prior?.satisfactionEstimate);
    const temporalDelta = Number.isFinite(previousP) ? corrected - previousP : null;
    const currentEntropy = binaryEntropy(corrected);
    const nominalEntropy = binaryEntropy(nominal);
    const previousEntropy = Number(prior?.entropy?.corrected ?? prior?.semanticEntropy);
    const currentRisk = 1 - corrected;
    const previousRisk = Number(prior?.risk?.corrected ?? prior?.semanticRisk);
    const deceptiveMechanisms = uniq((challenge.deceptionMechanisms || [])
      .filter((mechanism) => mechanism.status === "triggered" && (DECEPTION_MECHANISMS[mechanism.id]?.semanticTypes || []).includes(id))
      .map((mechanism) => mechanism.id));

    return {
      id,
      ...SEMANTIC_TYPE_CATALOG[id],
      weight: Number(weights[id].toFixed(4)),
      pHat: Number(corrected.toFixed(4)),
      nominalP: Number(nominal.toFixed(4)),
      referenceVector: Number((corrected - 1).toFixed(4)),
      referenceMagnitude: Number((1 - corrected).toFixed(4)),
      temporalDelta: temporalDelta == null ? null : Number(temporalDelta.toFixed(4)),
      trajectoryDirection: temporalDirection(temporalDelta),
      entropy: {
        nominal: Number(nominalEntropy.toFixed(4)),
        corrected: Number(currentEntropy.toFixed(4)),
        deceptiveWitnessDelta: Number((currentEntropy - nominalEntropy).toFixed(4)),
        temporalFlux: Number.isFinite(previousEntropy) ? Number((currentEntropy - previousEntropy).toFixed(4)) : null
      },
      risk: {
        nominal: Number((1 - nominal).toFixed(4)),
        corrected: Number(currentRisk.toFixed(4)),
        deceptiveWitnessDelta: Number((currentRisk - (1 - nominal)).toFixed(4)),
        temporalFlux: Number.isFinite(previousRisk) ? Number((currentRisk - previousRisk).toFixed(4)) : null
      },
      deceptiveMechanisms,
      observations: observations.map((row) => ({
        witnessId: row.witnessId,
        state: row.state,
        channel: row.channel,
        role: row.role,
        weight: row.weight,
        coverageBasis: row.coverageBasis,
        distortions: row.distortions
      }))
    };
  });

  const nominalEntropy = coordinates.reduce((sum, coordinate) => sum + coordinate.weight * coordinate.entropy.nominal, 0);
  const semanticEntropy = coordinates.reduce((sum, coordinate) => sum + coordinate.weight * coordinate.entropy.corrected, 0);
  const nominalRisk = coordinates.reduce((sum, coordinate) => sum + coordinate.weight * coordinate.risk.nominal, 0);
  const semanticRisk = coordinates.reduce((sum, coordinate) => sum + coordinate.weight * coordinate.risk.corrected, 0);
  const previousEntropy = Number(input.previous?.summary?.semanticEntropy);
  const previousRisk = Number(input.previous?.summary?.semanticRisk);
  const deltaH = Number.isFinite(previousEntropy) ? semanticEntropy - previousEntropy : null;
  const deltaR = Number.isFinite(previousRisk) ? semanticRisk - previousRisk : null;
  const deceptionDeltaH = semanticEntropy - nominalEntropy;
  const deceptionDeltaR = semanticRisk - nominalRisk;

  const referenceVector = Object.fromEntries(coordinates.map((coordinate) => [coordinate.code, coordinate.referenceVector]));
  const temporalVector = coordinates.every((coordinate) => coordinate.temporalDelta == null)
    ? null
    : Object.fromEntries(coordinates.map((coordinate) => [coordinate.code, coordinate.temporalDelta]));
  const pressureContext = uniq([...(input.pressures || []), ...(input.riskSignals || [])].map((item) => typeof item === "string" ? item : item?.id));

  return {
    schema: "ui-iceberg-semantic-manifold-v0.6",
    model: {
      manifold: "RCT semantic manifold / bounded operational chart",
      coordinateSystem: "G1-G12",
      reference: "admitted claim regime",
      satisfactionEstimate: "Beta(1,1)-smoothed evidence estimate using explicit typed witnesses when available; claim-level inference receives half weight.",
      direction: "Reference vector is displacement from the admitted regime. Temporal direction is emitted only when a prior receipt supplies the previous coordinate state.",
      entropy: "H_S = sum_i w_i h(p_hat_i)",
      risk: "R_S = sum_i w_i (1 - p_hat_i)"
    },
    referenceVector,
    temporalVector,
    coordinates,
    summary: {
      semanticEntropy: Number(semanticEntropy.toFixed(4)),
      semanticRisk: Number(semanticRisk.toFixed(4)),
      nominalSemanticEntropy: Number(nominalEntropy.toFixed(4)),
      nominalSemanticRisk: Number(nominalRisk.toFixed(4)),
      deceptiveWitnessCorrection: {
        entropyDelta: Number(deceptionDeltaH.toFixed(4)),
        riskDelta: Number(deceptionDeltaR.toFixed(4)),
        classification: deceptionDeltaH > EPSILON && deceptionDeltaR > EPSILON
          ? "deceptive-certainty-retracted"
          : Math.abs(deceptionDeltaH) <= EPSILON && Math.abs(deceptionDeltaR) <= EPSILON
            ? "no-material-deceptive-correction"
            : "mixed-deceptive-correction"
      },
      temporalFlux: {
        mode: Number.isFinite(deltaH) && Number.isFinite(deltaR) ? "finite-difference-between-receipts" : "unavailable-no-prior-receipt",
        entropyDelta: Number.isFinite(deltaH) ? Number(deltaH.toFixed(4)) : null,
        riskDelta: Number.isFinite(deltaR) ? Number(deltaR.toFixed(4)) : null,
        classification: fluxClassification(deltaH, deltaR)
      }
    },
    pressureContext,
    couplingCandidates: buildCouplings(challenge, activeTypes),
    firstBiteFrontier: buildProbeFrontier(challenge, coordinates, weights),
    boundary: "This is an evidence-bounded manifold projection, not a calibrated defect probability. Deceptive-witness correction retracts unsupported positive evidence toward unknown; it never fabricates negative evidence. Coupling candidates are co-activation hypotheses only. No regime metric tensor, residue weight, causal failure mode, monetary cost, or remediation timeline is inferred without separate authority."
  };
}
