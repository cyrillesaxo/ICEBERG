const SEVERITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });

export const SEMANTIC_TYPES = Object.freeze({
  G1_LABEL: "G1_LABEL",
  G2_NODE: "G2_NODE",
  G3_BOUNDARY: "G3_BOUNDARY",
  G4_EDGE: "G4_EDGE",
  G5_OPERATION: "G5_OPERATION",
  G6_PERSPECTIVE: "G6_PERSPECTIVE",
  G7_GRANULARITY: "G7_GRANULARITY",
  G8_EVIDENCE: "G8_EVIDENCE",
  G9_PREREQUISITE: "G9_PREREQUISITE",
  G10_CONFLICT: "G10_CONFLICT",
  G11_TEMPORAL: "G11_TEMPORAL",
  G12_AUTHORITY: "G12_AUTHORITY"
});

export const SEMANTIC_TYPE_CATALOG = Object.freeze({
  [SEMANTIC_TYPES.G1_LABEL]: { code: "G1", name: "Label", invariant: "concept-present/name-missing" },
  [SEMANTIC_TYPES.G2_NODE]: { code: "G2", name: "Node", invariant: "distinct-concept-representation" },
  [SEMANTIC_TYPES.G3_BOUNDARY]: { code: "G3", name: "Boundary", invariant: "category-boundary-preservation" },
  [SEMANTIC_TYPES.G4_EDGE]: { code: "G4", name: "Edge", invariant: "relation-direction-preservation" },
  [SEMANTIC_TYPES.G5_OPERATION]: { code: "G5", name: "Operation", invariant: "procedure-availability" },
  [SEMANTIC_TYPES.G6_PERSPECTIVE]: { code: "G6", name: "Perspective", invariant: "viewpoint-accessibility" },
  [SEMANTIC_TYPES.G7_GRANULARITY]: { code: "G7", name: "Granularity", invariant: "unit-size-fit" },
  [SEMANTIC_TYPES.G8_EVIDENCE]: { code: "G8", name: "Evidence", invariant: "authoritative-witness-availability" },
  [SEMANTIC_TYPES.G9_PREREQUISITE]: { code: "G9", name: "Prerequisite", invariant: "supporting-subgraph-availability" },
  [SEMANTIC_TYPES.G10_CONFLICT]: { code: "G10", name: "Conflict", invariant: "governing-invariant-consistency" },
  [SEMANTIC_TYPES.G11_TEMPORAL]: { code: "G11", name: "Temporal", invariant: "freshness-under-current-pressure" },
  [SEMANTIC_TYPES.G12_AUTHORITY]: { code: "G12", name: "Authority", invariant: "earned-governing-standing" }
});

export const DECEPTION_MECHANISMS = Object.freeze({
  UNTRACEABLE_DEPTH: {
    id: "UNTRACEABLE_DEPTH",
    name: "Untraceable depth",
    definition: "Shallow evidence posing as deep evidence.",
    userReason: "The green result is not yet traceable to the thing this claim actually depends on.",
    probe: {
      id: "CHECK_REAL_SOURCE",
      title: "Trace the result to the real source",
      goal: "Repeat the check using source-linked or runtime-authoritative evidence instead of a shortcut, proxy, or simulation."
    },
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G12_AUTHORITY],
    cost: 2
  },
  INFLATED_SCOPE: {
    id: "INFLATED_SCOPE",
    name: "Inflated scope",
    definition: "Narrow evidence stretched into a broader conclusion.",
    userReason: "A narrow check is being used as proof for conditions it did not actually cover.",
    probe: {
      id: "CHECK_CLAIM_BOUNDARY",
      title: "Test the boundary the claim is relying on",
      goal: "Vary the important context the current check did not cover and assert that the same invariant still holds."
    },
    semanticTypes: [SEMANTIC_TYPES.G3_BOUNDARY, SEMANTIC_TYPES.G6_PERSPECTIVE, SEMANTIC_TYPES.G7_GRANULARITY, SEMANTIC_TYPES.G11_TEMPORAL],
    cost: 2
  },
  LOADED_CHANNEL: {
    id: "LOADED_CHANNEL",
    name: "Loaded channel",
    definition: "The medium or presentation carries persuasive force the underlying evidence does not.",
    userReason: "The presentation or test output may look convincing even if the underlying behavior was not checked.",
    probe: {
      id: "CHECK_WITHOUT_PRESENTATION",
      title: "Check the behavior without relying on presentation",
      goal: "Add state or semantic assertions, or use an independent channel, so pixels, badges, or runner status cannot carry the conclusion alone."
    },
    semanticTypes: [SEMANTIC_TYPES.G2_NODE, SEMANTIC_TYPES.G5_OPERATION, SEMANTIC_TYPES.G8_EVIDENCE],
    cost: 1
  },
  LOADED_FRAME: {
    id: "LOADED_FRAME",
    name: "Loaded frame",
    definition: "The framing biases the target conclusion before the evidence is weighed.",
    userReason: "The wording, defaults, or comparison setup may be steering the result.",
    probe: {
      id: "CHECK_NEUTRAL_FRAME",
      title: "Repeat the choice with neutral framing",
      goal: "Remove directional wording, default emphasis, or asymmetric comparison and check whether the result still holds."
    },
    semanticTypes: [SEMANTIC_TYPES.G6_PERSPECTIVE, SEMANTIC_TYPES.G10_CONFLICT],
    cost: 1
  },
  UNSTATED_IMPLICATION: {
    id: "UNSTATED_IMPLICATION",
    name: "Unstated implication",
    definition: "A conclusion is smuggled in through what the evidence leaves unsaid.",
    userReason: "The green result is being used to imply important outcomes that were never explicitly checked.",
    probe: {
      id: "CHECK_IMPLIED_OUTCOMES",
      title: "Check what the green result is silently implying",
      goal: "Turn the implied postconditions into explicit assertions and test them directly."
    },
    semanticTypes: [SEMANTIC_TYPES.G4_EDGE, SEMANTIC_TYPES.G5_OPERATION, SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G9_PREREQUISITE],
    cost: 1
  }
});

const RISK_CHALLENGE_MAP = Object.freeze({
  FIXED_WAIT: {
    mechanisms: ["UNTRACEABLE_DEPTH", "INFLATED_SCOPE"],
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G11_TEMPORAL]
  },
  FORCED_ACTION: {
    mechanisms: ["INFLATED_SCOPE", "UNSTATED_IMPLICATION"],
    semanticTypes: [SEMANTIC_TYPES.G5_OPERATION, SEMANTIC_TYPES.G8_EVIDENCE]
  },
  SKIPPED_TEST: {
    mechanisms: ["INFLATED_SCOPE"],
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G9_PREREQUISITE]
  },
  FOCUSED_TEST: {
    mechanisms: ["INFLATED_SCOPE"],
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE]
  },
  RETRY_ENABLED: {
    mechanisms: ["INFLATED_SCOPE"],
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G11_TEMPORAL]
  },
  NETWORK_MOCK: {
    mechanisms: ["UNTRACEABLE_DEPTH", "INFLATED_SCOPE"],
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G11_TEMPORAL, SEMANTIC_TYPES.G12_AUTHORITY]
  },
  VISUAL_ONLY_ORACLE: {
    mechanisms: ["LOADED_CHANNEL", "UNSTATED_IMPLICATION"],
    semanticTypes: [SEMANTIC_TYPES.G2_NODE, SEMANTIC_TYPES.G5_OPERATION, SEMANTIC_TYPES.G8_EVIDENCE]
  },
  INDEX_BASED_TARGET: {
    mechanisms: ["UNTRACEABLE_DEPTH", "UNSTATED_IMPLICATION"],
    semanticTypes: [SEMANTIC_TYPES.G2_NODE, SEMANTIC_TYPES.G4_EDGE, SEMANTIC_TYPES.G8_EVIDENCE]
  },
  DISABLED_ASSERTION_FAILURE: {
    mechanisms: ["LOADED_CHANNEL", "UNSTATED_IMPLICATION"],
    semanticTypes: [SEMANTIC_TYPES.G8_EVIDENCE, SEMANTIC_TYPES.G10_CONFLICT]
  }
});

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSemanticType(value = "") {
  const raw = String(value || "").trim().toUpperCase();
  if (SEMANTIC_TYPE_CATALOG[raw]) return raw;
  const key = Object.keys(SEMANTIC_TYPE_CATALOG).find((candidate) =>
    candidate.startsWith(`${raw}_`) || SEMANTIC_TYPE_CATALOG[candidate].code === raw
  );
  return key || null;
}

function normalizeMechanismChecks(input = {}) {
  const entries = Array.isArray(input)
    ? input.map((item) => [item.id || item.mechanism, item.status])
    : Object.entries(input || {});
  return Object.fromEntries(entries
    .map(([id, status]) => [String(id || "").toUpperCase(), String(status || "").toLowerCase()])
    .filter(([id]) => DECEPTION_MECHANISMS[id]));
}

function collectRiskRows(audits = []) {
  const rows = [];
  for (const audit of audits) {
    for (const distortion of audit.distortions || []) {
      const mapping = RISK_CHALLENGE_MAP[distortion.id];
      if (!mapping) continue;
      rows.push({
        witnessId: audit.witnessId || null,
        scenarioId: audit.scenarioId || null,
        riskId: distortion.id,
        severity: distortion.severity || "medium",
        mechanisms: [...mapping.mechanisms],
        semanticTypes: [...mapping.semanticTypes]
      });
    }
  }
  return rows;
}

function mechanismState(id, rows, checks) {
  const hits = rows.filter((row) => row.mechanisms.includes(id));
  const explicit = checks[id] || null;
  if (["pass", "clear", "checked-clear"].includes(explicit)) {
    return { id, status: "checked-clear", triggers: hits };
  }
  if (["fail", "triggered", "blocked"].includes(explicit) || hits.length) {
    return { id, status: "triggered", triggers: hits };
  }
  return { id, status: "unknown", triggers: [] };
}

function mechanismPriority(state) {
  if (state.status !== "triggered") return 0;
  return Math.max(1, ...state.triggers.map((row) => SEVERITY_WEIGHT[row.severity] || 1));
}

function makeProbeCandidate(state) {
  const mechanism = DECEPTION_MECHANISMS[state.id];
  return {
    id: mechanism.probe.id,
    title: mechanism.probe.title,
    goal: mechanism.probe.goal,
    mechanismsCovered: [state.id],
    semanticTypesCovered: [...mechanism.semanticTypes],
    cost: mechanism.cost,
    score: mechanismPriority(state) * 4 + mechanism.semanticTypes.length - mechanism.cost
  };
}

function makeCompositeProbe(triggered) {
  if (triggered.length < 2) return null;
  const mechanismsCovered = triggered.map((state) => state.id);
  const semanticTypesCovered = uniq(triggered.flatMap((state) => DECEPTION_MECHANISMS[state.id].semanticTypes));
  const steps = triggered.map((state) => DECEPTION_MECHANISMS[state.id].probe.goal);
  const cost = Math.max(2, Math.ceil(triggered.length / 2));
  const priority = triggered.reduce((sum, state) => sum + mechanismPriority(state), 0);
  return {
    id: "CHECK_COMBINED_WEAK_SPOTS",
    title: "Run one check that removes the biggest shortcuts",
    goal: "Combine the highest-value checks so one run can resolve several reasons the current green result may be misleading.",
    steps,
    mechanismsCovered,
    semanticTypesCovered,
    cost,
    score: priority * 4 + semanticTypesCovered.length + mechanismsCovered.length * 2 - cost
  };
}

function userFacingReason(state) {
  const mechanism = DECEPTION_MECHANISMS[state.id];
  return {
    title: mechanism.probe.title,
    reason: mechanism.userReason
  };
}

export function buildClaimChallenge(input = {}) {
  const claim = input.claim || {};
  const audits = input.audits || input.deceptiveWitnessAudits || [];
  const rows = collectRiskRows(audits);
  const checks = normalizeMechanismChecks(input.mechanismChecks);
  const mechanismStates = Object.keys(DECEPTION_MECHANISMS).map((id) => mechanismState(id, rows, checks));
  const triggered = mechanismStates.filter((state) => state.status === "triggered");
  const unknown = mechanismStates.filter((state) => state.status === "unknown");

  const explicitSemanticTypes = uniq([
    ...(claim.semanticTypes || claim.gapTypes || []),
    ...(input.semanticTypes || input.gapTypes || []),
    ...(input.scenario?.semanticTypes || input.scenario?.gapTypes || [])
  ].map(normalizeSemanticType));
  const activeSemanticTypes = uniq([
    SEMANTIC_TYPES.G8_EVIDENCE,
    ...explicitSemanticTypes,
    ...rows.flatMap((row) => row.semanticTypes)
  ]);

  const candidates = triggered.map(makeProbeCandidate);
  const composite = makeCompositeProbe(triggered);
  if (composite) candidates.push(composite);
  candidates.sort((a, b) => b.score - a.score || a.cost - b.cost || a.id.localeCompare(b.id));
  const selectedProbe = candidates[0] || null;

  const probeMatrix = candidates.map((candidate) => ({
    probeId: candidate.id,
    mechanisms: Object.fromEntries(Object.keys(DECEPTION_MECHANISMS).map((id) => [id, candidate.mechanismsCovered.includes(id)])),
    semanticTypes: Object.fromEntries(activeSemanticTypes.map((id) => [id, candidate.semanticTypesCovered.includes(id)])),
    cost: candidate.cost,
    score: candidate.score
  }));

  return {
    schema: "ui-iceberg-claim-challenge-v0.5",
    claim,
    semanticTypes: activeSemanticTypes.map((id) => ({ id, ...SEMANTIC_TYPE_CATALOG[id] })),
    deceptionMechanisms: mechanismStates.map((state) => ({
      id: state.id,
      name: DECEPTION_MECHANISMS[state.id].name,
      status: state.status,
      triggerCount: state.triggers.length,
      triggeredBy: state.triggers.map((row) => ({ witnessId: row.witnessId, riskId: row.riskId, severity: row.severity }))
    })),
    probeCandidates: candidates,
    probeMatrix,
    selectedProbe,
    residualUnknownMechanisms: unknown.map((state) => state.id),
    boundary: "The five mechanism checks are structural challenge coordinates, not defect labels. Absence of a detected trigger leaves a mechanism unknown unless it was explicitly checked. Probe ranking is an ordinal testing heuristic, not a defect probability."
  };
}

export function buildPlainLanguageReview({ admission = {}, challenge = {}, nextScenario = null } = {}) {
  const triggered = (challenge.deceptionMechanisms || []).filter((item) => item.status === "triggered");
  const unknown = challenge.residualUnknownMechanisms || [];
  const verdict = admission.verdict || "INCONCLUSIVE";
  let status = "needs-check";
  let headline = "This result still needs a stronger check.";

  if (verdict === "REJECTED") {
    status = "failed-under-tested-conditions";
    headline = "The current claim does not hold under the conditions that were tested.";
  } else if (verdict === "ADMITTED_WITH_SCOPE") {
    status = "supported-for-tested-conditions";
    headline = "The evidence supports this claim for the conditions that were actually tested.";
  } else if (triggered.length) {
    headline = "The tests may be green, but the current evidence does not yet support this claim.";
  } else if ((admission.evidenceSummary?.nominalStrongSupportingWitnesses || []).length === 0) {
    status = "not-proven";
    headline = "This claim is not proven yet.";
  }

  const whyThisMayBeMisleading = triggered.map((item) => userFacingReason({ id: item.id }));
  const selected = challenge.selectedProbe;
  const bestNextCheck = selected
    ? {
        title: selected.title,
        why: selected.mechanismsCovered.length > 1
          ? `One check can address ${selected.mechanismsCovered.length} important reasons the current result may be misleading.`
          : "This is the smallest check aimed at the strongest known weakness in the current evidence.",
        steps: selected.steps || [selected.goal]
      }
    : nextScenario
      ? {
          title: nextScenario.title || nextScenario.id || "Run the highest-value missing journey check",
          why: "This is the highest-value important condition that still lacks enough evidence.",
          steps: []
        }
      : null;

  return {
    status,
    headline,
    whatLooksGood: (admission.evidenceSummary?.nominalStrongSupportingWitnesses || []).length
      ? [`${admission.evidenceSummary.nominalStrongSupportingWitnesses.length} strong runtime result(s) appear relevant to this claim.`]
      : [],
    whyThisMayBeMisleading,
    bestNextCheck,
    whatThisCheckCanTellYou: selected
      ? "Whether the current green result survives when the identified shortcuts or missing checks are removed."
      : null,
    stillUnknown: uniq([
      ...(unknown.length ? ["Some ways the current result could mislead have not yet been checked directly."] : []),
      ...((admission.semanticEntropy?.unresolvedInterpretations || []).length ? ["Some important interpretations are still unresolved."] : [])
    ])
  };
}

export function listSemanticTypes() {
  return Object.values(SEMANTIC_TYPES).map((id) => ({ id, ...SEMANTIC_TYPE_CATALOG[id] }));
}

export function listDeceptionMechanisms() {
  return Object.values(DECEPTION_MECHANISMS).map((item) => ({
    id: item.id,
    name: item.name,
    definition: item.definition,
    semanticTypes: [...item.semanticTypes],
    probe: { ...item.probe }
  }));
}
