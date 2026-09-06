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
const PRIOR_ALPHA = 1;
const PRIOR_BETA = 1;

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
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
  return uniq(values
    .map((value) => typeof value === "string" ? value : value?.id || value?.code)
    .map(normalizeSemanticType));
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
      return deceptiveTypes.includes(semanticType)
        ? { nominal: 1, corrected: 0.5, role: "support-withheld-on-type" }
        : { nominal: 1, corrected: 0.75, role: "support-narrowed-outside-distortion" };
    }
    if (audit?.classification === "WEAKENED_WITNESS") {
      return { nominal: 1, corrected: 0.75, role: "weakened-support" };
    }
    return { nominal: 1, corrected: 1, role: "support" };
  }

  if (FLAKY_STATES.has(state)) {
    return semanticType === SEMANTIC_TYPES.G11_TEMPORAL
      ? { nominal: 0.75, corrected: 0.5, role: "flaky-temporal-support-withheld" }
      : { nominal: 0.75, corrected: 0.65, role: "flaky-support-narrowed" };
  }

  if (UNRESOLVED_STATES.has(state) || !state) {
    return { nominal: 0.5, corrected: 0.5, role: "unresolved" };
  }
  return { nominal: 0.5, corrected: 0.5, role: "unresolved" };
}

function evidenceCoverage(item, claimTypes, activeTypes) {
  const explicit = normalizeTypeList(item.semanticTypes || item.gapTypes || []);
  const coverage = [{ id: SEMANTIC_TYPES.G8_EVIDENCE, weight: 1, basis: "evidence-channel" }];

  if (explicit.length) {
    for (const id of explicit) {
      if (id !== SEMANTIC_TYPES.G8_EVIDENCE) {
        coverage.push({ id, weight: 1, basis: "explicit-evidence-type" });
      }
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

function posteriorBreakdown(rows, field) {
  const terms = rows.map((row) => ({
    witnessId: row.witnessId,
    weight: row.weight,
    value: row[field],
    product: round(row.weight * row[field]),
    role: row.role,
    coverageBasis: row.coverageBasis
  }));
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const weightedValue = rows.reduce((sum, row) => sum + row.weight * row[field], 0);
  const numerator = PRIOR_ALPHA + weightedValue;
  const denominator = PRIOR_ALPHA + PRIOR_BETA + totalWeight;
  return {
    formula: "p_hat = (alpha0 + Σ_j w_j*x_j) / (alpha0 + beta0 + Σ_j w_j)",
    prior: { alpha0: PRIOR_ALPHA, beta0: PRIOR_BETA },
    terms,
    weightedEvidenceSum: round(weightedValue),
    totalEvidenceWeight: round(totalWeight),
    numerator: round(numerator),
    denominator: round(denominator),
    substitution: `(${PRIOR_ALPHA} + ${round(weightedValue)}) / (${PRIOR_ALPHA} + ${PRIOR_BETA} + ${round(totalWeight)})`,
    result: round(clamp(numerator / denominator))
  };
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
        const ordered = [types[i], types[j]].sort((a, b) =>
          SEMANTIC_TYPE_CATALOG[a].code.localeCompare(SEMANTIC_TYPE_CATALOG[b].code, undefined, { numeric: true })
        );
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
    const entropyTerms = covered.map((id) => ({
      semanticType: id,
      weight: round(weights[id]),
      entropy: byId.get(id).entropy.corrected,
      product: round(weights[id] * byId.get(id).entropy.corrected)
    }));
    const riskTerms = covered.map((id) => ({
      semanticType: id,
      weight: round(weights[id]),
      risk: byId.get(id).risk.corrected,
      product: round(weights[id] * byId.get(id).risk.corrected)
    }));
    const entropyCoverage = entropyTerms.reduce((sum, term) => sum + term.product, 0);
    const riskCoverage = riskTerms.reduce((sum, term) => sum + term.product, 0);
    const mechanismCount = candidate.mechanismsCovered?.length || 0;
    const couplingCoverage = Math.max(0, covered.length - 1);
    const cost = Math.max(1, candidate.cost || 1);
    const numerator = 2 * entropyCoverage + riskCoverage + mechanismCount * 0.5 + couplingCoverage * 0.25;
    const value = numerator / cost;

    return {
      probeId: candidate.id,
      title: candidate.title,
      semanticTypesCovered: covered,
      mechanismsCovered: candidate.mechanismsCovered || [],
      expectedEntropyCoverage: round(entropyCoverage),
      decisionRiskCoverage: round(riskCoverage),
      couplingCoverage,
      relativeCost: cost,
      semanticValue: round(value),
      calculation: {
        formula: "V_probe = (2*E_cov + R_cov + 0.5*M + 0.25*C) / cost",
        entropyTerms,
        riskTerms,
        mechanismCount,
        couplingCoverage,
        numerator: round(numerator),
        denominator: cost,
        substitution: `(2*${round(entropyCoverage)} + ${round(riskCoverage)} + 0.5*${mechanismCount} + 0.25*${couplingCoverage}) / ${cost}`,
        result: round(value)
      },
      boundary: "Semantic value ranks probes by currently unresolved typed evidence; it is not expected defect yield, monetary ROI, or calibrated information gain."
    };
  }).sort((a, b) => b.semanticValue - a.semanticValue || a.relativeCost - b.relativeCost || a.probeId.localeCompare(b.probeId));
}

function aggregateCalculation(coordinates, valueAccessor, label, formula) {
  const terms = coordinates.map((coordinate) => ({
    semanticType: coordinate.id,
    code: coordinate.code,
    weight: coordinate.weight,
    value: valueAccessor(coordinate),
    product: round(coordinate.weight * valueAccessor(coordinate))
  }));
  const result = terms.reduce((sum, term) => sum + term.product, 0);
  return {
    label,
    formula,
    terms,
    substitution: terms.map((term) => `${term.weight}*${term.value}`).join(" + ") || "0",
    result: round(result)
  };
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
    const nominalCalc = posteriorBreakdown(observations, "nominalValue");
    const correctedCalc = posteriorBreakdown(observations, "correctedValue");
    const nominal = nominalCalc.result;
    const corrected = correctedCalc.result;
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
      weight: round(weights[id]),
      pHat: round(corrected),
      nominalP: round(nominal),
      referenceVector: round(corrected - 1),
      referenceMagnitude: round(1 - corrected),
      temporalDelta: round(temporalDelta),
      trajectoryDirection: temporalDirection(temporalDelta),
      entropy: {
        nominal: round(nominalEntropy),
        corrected: round(currentEntropy),
        deceptiveWitnessDelta: round(currentEntropy - nominalEntropy),
        temporalFlux: Number.isFinite(previousEntropy) ? round(currentEntropy - previousEntropy) : null
      },
      risk: {
        nominal: round(1 - nominal),
        corrected: round(currentRisk),
        deceptiveWitnessDelta: round(currentRisk - (1 - nominal)),
        temporalFlux: Number.isFinite(previousRisk) ? round(currentRisk - previousRisk) : null
      },
      calculations: {
        satisfactionEstimate: {
          nominal: nominalCalc,
          corrected: correctedCalc
        },
        referenceDisplacement: {
          formula: "Delta_i = p_hat_i - p_target_i",
          target: 1,
          substitution: `${round(corrected)} - 1`,
          result: round(corrected - 1)
        },
        entropy: {
          formula: "h(p) = -p*log2(p) - (1-p)*log2(1-p)",
          nominal: { p: round(nominal), result: round(nominalEntropy) },
          corrected: { p: round(corrected), result: round(currentEntropy) },
          deceptiveWitnessDelta: {
            formula: "DeltaH_DW = h(p_corrected) - h(p_nominal)",
            substitution: `${round(currentEntropy)} - ${round(nominalEntropy)}`,
            result: round(currentEntropy - nominalEntropy)
          }
        },
        risk: {
          formula: "r_i = 1 - p_hat_i",
          nominal: { substitution: `1 - ${round(nominal)}`, result: round(1 - nominal) },
          corrected: { substitution: `1 - ${round(corrected)}`, result: round(currentRisk) },
          deceptiveWitnessDelta: {
            formula: "DeltaR_DW = r_corrected - r_nominal",
            substitution: `${round(currentRisk)} - ${round(1 - nominal)}`,
            result: round(currentRisk - (1 - nominal))
          }
        },
        temporal: Number.isFinite(previousP)
          ? {
              formula: "Delta_t p_i = p_i(t1) - p_i(t0)",
              previous: round(previousP),
              current: round(corrected),
              substitution: `${round(corrected)} - ${round(previousP)}`,
              result: round(temporalDelta),
              direction: temporalDirection(temporalDelta)
            }
          : {
              formula: "Delta_t p_i = p_i(t1) - p_i(t0)",
              status: "unavailable-no-prior-receipt"
            }
      },
      deceptiveMechanisms,
      observations: observations.map((row) => ({
        witnessId: row.witnessId,
        state: row.state,
        channel: row.channel,
        role: row.role,
        weight: row.weight,
        nominalValue: row.nominalValue,
        correctedValue: row.correctedValue,
        coverageBasis: row.coverageBasis,
        distortions: row.distortions
      }))
    };
  });

  const entropyNominalCalc = aggregateCalculation(
    coordinates,
    (coordinate) => coordinate.entropy.nominal,
    "Nominal semantic entropy",
    "H_S^nominal = Σ_i w_i*h(p_i^nominal)"
  );
  const entropyCorrectedCalc = aggregateCalculation(
    coordinates,
    (coordinate) => coordinate.entropy.corrected,
    "Corrected semantic entropy",
    "H_S = Σ_i w_i*h(p_hat_i)"
  );
  const riskNominalCalc = aggregateCalculation(
    coordinates,
    (coordinate) => coordinate.risk.nominal,
    "Nominal semantic risk",
    "R_S^nominal = Σ_i w_i*(1-p_i^nominal)"
  );
  const riskCorrectedCalc = aggregateCalculation(
    coordinates,
    (coordinate) => coordinate.risk.corrected,
    "Corrected semantic risk",
    "R_S = Σ_i w_i*(1-p_hat_i)"
  );

  const nominalEntropy = entropyNominalCalc.result;
  const semanticEntropy = entropyCorrectedCalc.result;
  const nominalRisk = riskNominalCalc.result;
  const semanticRisk = riskCorrectedCalc.result;
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
  const pressureContext = uniq([...(input.pressures || []), ...(input.riskSignals || [])]
    .map((item) => typeof item === "string" ? item : item?.id));
  const firstBiteFrontier = buildProbeFrontier(challenge, coordinates, weights);

  const calculationReceipt = {
    schema: "ui-iceberg-calculation-receipt-v0.6",
    precision: 4,
    coordinateCalculations: coordinates.map((coordinate) => ({
      semanticType: coordinate.id,
      code: coordinate.code,
      weight: coordinate.weight,
      calculations: coordinate.calculations
    })),
    aggregates: {
      semanticEntropy: {
        nominal: entropyNominalCalc,
        corrected: entropyCorrectedCalc,
        deceptiveWitnessCorrection: {
          formula: "DeltaH_DW = H_S(corrected) - H_S(nominal)",
          substitution: `${semanticEntropy} - ${nominalEntropy}`,
          result: round(deceptionDeltaH)
        }
      },
      semanticRisk: {
        nominal: riskNominalCalc,
        corrected: riskCorrectedCalc,
        deceptiveWitnessCorrection: {
          formula: "DeltaR_DW = R_S(corrected) - R_S(nominal)",
          substitution: `${semanticRisk} - ${nominalRisk}`,
          result: round(deceptionDeltaR)
        }
      },
      temporalFlux: Number.isFinite(deltaH) && Number.isFinite(deltaR)
        ? {
            entropy: {
              formula: "DeltaH_S = H_S(t1) - H_S(t0)",
              previous: round(previousEntropy),
              current: semanticEntropy,
              substitution: `${semanticEntropy} - ${round(previousEntropy)}`,
              result: round(deltaH)
            },
            risk: {
              formula: "DeltaR_S = R_S(t1) - R_S(t0)",
              previous: round(previousRisk),
              current: semanticRisk,
              substitution: `${semanticRisk} - ${round(previousRisk)}`,
              result: round(deltaR)
            },
            classification: fluxClassification(deltaH, deltaR)
          }
        : { status: "unavailable-no-prior-receipt" }
    },
    firstBite: firstBiteFrontier.map((candidate) => ({
      probeId: candidate.probeId,
      calculation: candidate.calculation
    })),
    boundary: "Calculation receipts show exactly how displayed values are produced from the supplied evidence and configured weights. They do not upgrade the authority of the inputs, calibrate defect probability, or create missing tensor/coupling weights."
  };

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
      semanticEntropy,
      semanticRisk,
      nominalSemanticEntropy: nominalEntropy,
      nominalSemanticRisk: nominalRisk,
      deceptiveWitnessCorrection: {
        entropyDelta: round(deceptionDeltaH),
        riskDelta: round(deceptionDeltaR),
        classification: deceptionDeltaH > EPSILON && deceptionDeltaR > EPSILON
          ? "deceptive-certainty-retracted"
          : Math.abs(deceptionDeltaH) <= EPSILON && Math.abs(deceptionDeltaR) <= EPSILON
            ? "no-material-deceptive-correction"
            : "mixed-deceptive-correction"
      },
      temporalFlux: {
        mode: Number.isFinite(deltaH) && Number.isFinite(deltaR)
          ? "finite-difference-between-receipts"
          : "unavailable-no-prior-receipt",
        entropyDelta: round(deltaH),
        riskDelta: round(deltaR),
        classification: fluxClassification(deltaH, deltaR)
      }
    },
    pressureContext,
    couplingCandidates: buildCouplings(challenge, activeTypes),
    firstBiteFrontier,
    calculations: calculationReceipt,
    boundary: "This is an evidence-bounded manifold projection, not a calibrated defect probability. Deceptive-witness correction retracts unsupported positive evidence toward unknown; it never fabricates negative evidence. Coupling candidates are co-activation hypotheses only. No regime metric tensor, residue weight, causal failure mode, monetary cost, or remediation timeline is inferred without separate authority."
  };
}
