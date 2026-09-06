import { analyzeJourneyGaps } from "./index.js";

const G_TAXONOMY = Object.freeze([
  { id: "G1", name: "Label", meaning: "Names, wording, and lexical identity." },
  { id: "G2", name: "Node", meaning: "Semantic entity or target identity." },
  { id: "G3", name: "Boundary", meaning: "Limits, thresholds, validation, and reachable edges." },
  { id: "G4", name: "Edge", meaning: "Transitions, navigation, and relations between states." },
  { id: "G5", name: "Operation", meaning: "Actions and effects performed by the user or system." },
  { id: "G6", name: "Perspective", meaning: "Actor, role, access channel, device, or viewpoint." },
  { id: "G7", name: "Granularity", meaning: "Scale, grouping, list/detail, pagination, or information density." },
  { id: "G8", name: "Evidence", meaning: "Confirmation, feedback, assertion, or proof state." },
  { id: "G9", name: "Prerequisite", meaning: "Preconditions, permissions, validation, and required state." },
  { id: "G10", name: "Conflict", meaning: "Competing actions, races, duplicates, and contradictory states." },
  { id: "G11", name: "Temporal", meaning: "Timing, retry, expiry, ordering, interruption, and freshness." },
  { id: "G12", name: "Authority", meaning: "Authoritative source, role delegation, backend ownership, and approval." }
]);

const PRIORITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });

const SCENARIO_G_HINTS = Object.freeze({
  CORE_SUCCESS: ["G4", "G5", "G8"],
  VALIDATION_RECOVERY: ["G3", "G5", "G9"],
  REQUEST_FAILURE_RETRY: ["G4", "G5", "G11"],
  SLOW_RESPONSE_FEEDBACK: ["G8", "G11"],
  DOUBLE_SUBMIT: ["G5", "G10", "G11"],
  REFRESH_PRESERVES_PROGRESS: ["G4", "G11"],
  BACK_FORWARD_CONTINUITY: ["G4", "G11"],
  LEAVE_AND_RETURN: ["G4", "G9", "G11"],
  SESSION_EXPIRY_RECOVERY: ["G9", "G11", "G12"],
  MOBILE_PRIMARY_ACTION: ["G3", "G5", "G6"],
  ZOOM_TEXT_SCALE: ["G3", "G6", "G7"],
  KEYBOARD_ONLY: ["G5", "G6"],
  STATE_RESTORE_AFTER_ERROR: ["G4", "G8", "G11"],
  EMPTY_OR_ZERO_STATE: ["G3", "G7", "G8"],
  PAYMENT_DECLINED_RETRY: ["G5", "G9", "G11", "G12"],
  PAYMENT_SUCCESS_CALLBACK_DELAY: ["G4", "G8", "G11", "G12"],
  OTP_INTERRUPT_RETURN: ["G4", "G9", "G11", "G12"],
  DUPLICATE_ORDER_AFTER_REFRESH: ["G5", "G10", "G11", "G12"],
  EMAIL_VERIFY_RETURN: ["G4", "G9", "G11", "G12"],
  EXISTING_ACCOUNT_RECOVERY: ["G2", "G5", "G9", "G12"],
  MFA_INTERRUPT_RETURN: ["G4", "G9", "G11", "G12"],
  LOCKOUT_RECOVERY: ["G5", "G9", "G11", "G12"],
  RESET_LINK_EXPIRED: ["G4", "G9", "G11"],
  RESET_RETURN_TO_LOGIN: ["G4", "G5", "G9"],
  DECLINE_RETENTION_CONTINUE: ["G4", "G5", "G6"],
  CANCEL_STATUS_PERSISTS: ["G4", "G8", "G11", "G12"],
  BOOKING_SLOT_RACE: ["G3", "G10", "G11", "G12"],
  BOOKING_TIMEZONE_BOUNDARY: ["G3", "G6", "G11"],
  BOOKING_DOUBLE_CONFIRM: ["G5", "G10", "G11", "G12"],
  UPLOAD_INTERRUPTED_RESUME: ["G4", "G5", "G11"],
  UPLOAD_PROCESSING_DELAY: ["G5", "G8", "G11", "G12"],
  UPLOAD_REPLACE_IDENTITY: ["G2", "G5", "G8"],
  SEARCH_STALE_RESPONSE: ["G4", "G7", "G10", "G11"],
  SEARCH_FILTER_RETURN_CONTINUITY: ["G4", "G7", "G11"],
  SEARCH_PAGINATION_CONTINUITY: ["G4", "G7", "G11"]
});

const RISK_SIGNAL_G_HINTS = Object.freeze({
  "async-network": ["G4", "G5", "G11"],
  "optimistic-ui": ["G5", "G10", "G11"],
  "auth-session": ["G9", "G11", "G12"],
  "browser-persistence": ["G4", "G11"],
  "multi-context": ["G4", "G10", "G11"],
  "offline-capable": ["G4", "G11"],
  "external-redirect": ["G4", "G11"],
  "feature-flags": ["G6", "G9"],
  internationalization: ["G1", "G6"],
  rtl: ["G6", "G7"],
  "date-time": ["G3", "G11"],
  "file-upload": ["G2", "G5", "G11"],
  "virtualized-list": ["G2", "G7"],
  "progressive-list": ["G4", "G7", "G11"],
  "modal-overlay": ["G3", "G4", "G5", "G6"],
  "occluding-overlay": ["G3", "G5"],
  realtime: ["G4", "G10", "G11"],
  "client-cache": ["G4", "G11"],
  "device-permission": ["G6", "G9", "G12"],
  "search-filter": ["G1", "G4", "G7"],
  "complex-form": ["G3", "G5", "G9"],
  "draft-editing": ["G4", "G11"]
});

const TEXT_G_HINTS = Object.freeze([
  ["G1", /\b(label|copy|wording|locale|translation|message|name)\b/i],
  ["G2", /\b(identity|entity|target|selector|item|record|account|file)\b/i],
  ["G3", /\b(boundary|limit|validation|invalid|required|viewport|threshold|zero|empty)\b/i],
  ["G4", /\b(return|back|forward|redirect|navigation|transition|route|resume|refresh)\b/i],
  ["G5", /\b(action|submit|retry|cancel|upload|confirm|complete|click|operation)\b/i],
  ["G6", /\b(role|mobile|keyboard|access|user|admin|rtl|timezone|perspective)\b/i],
  ["G7", /\b(list|pagination|page|granularity|filter|search|detail|zoom|scale)\b/i],
  ["G8", /\b(feedback|confirmation|status|assert|evidence|loading|error|success)\b/i],
  ["G9", /\b(auth|permission|prerequisite|required|session|login|verify|validation)\b/i],
  ["G10", /\b(race|duplicate|conflict|concurrent|double|stale)\b/i],
  ["G11", /\b(timeout|retry|expiry|expired|delay|slow|interrupt|refresh|realtime|resume|timing|time)\b/i],
  ["G12", /\b(authority|authoritative|backend|server|role|approval|entitlement|payment|subscription)\b/i]
]);

const DECEPTIVE_WITNESS_RULES = Object.freeze({
  FIXED_WAIT: {
    id: "DW_TIMING_SLEEP_AS_READINESS",
    gTypes: ["G8", "G11"],
    hiddenDefeater: "The test waits for elapsed time rather than witnessing the actual readiness condition."
  },
  FORCED_ACTION: {
    id: "DW_FORCED_ACTION_AS_USER_ACTIONABILITY",
    gTypes: ["G3", "G5", "G6"],
    hiddenDefeater: "The automation bypasses actionability constraints that a real user must satisfy."
  },
  FOCUSED_TEST: {
    id: "DW_FOCUSED_SUBSET_AS_SUITE_HEALTH",
    gTypes: G_TAXONOMY.map((item) => item.id),
    hiddenDefeater: "A focused subset can be green while relevant witnesses outside that subset never ran."
  },
  RETRY_ENABLED: {
    id: "DW_RETRY_PASS_AS_STABILITY",
    gTypes: ["G8", "G10", "G11"],
    hiddenDefeater: "Retry-dependent success does not witness deterministic first-attempt stability."
  },
  NETWORK_MOCK: {
    id: "DW_MOCKED_PATH_AS_PRODUCTION_AUTHORITY",
    gTypes: ["G4", "G8", "G11", "G12"],
    hiddenDefeater: "The mocked path can bypass production integration, latency, authority, or recovery behavior."
  },
  VISUAL_ONLY_ORACLE: {
    id: "DW_VISUAL_MATCH_AS_SEMANTIC_CORRECTNESS",
    gTypes: ["G1", "G2", "G3", "G4", "G5", "G6", "G8"],
    hiddenDefeater: "Visual equality does not witness semantic target identity, operability, or task completion."
  },
  INDEX_BASED_TARGET: {
    id: "DW_SELECTOR_RESOLUTION_AS_TARGET_IDENTITY",
    gTypes: ["G2", "G4", "G5", "G7"],
    hiddenDefeater: "An index can continue resolving after ordering changes while pointing at a different semantic entity."
  },
  DISABLED_ASSERTION_FAILURE: {
    id: "DW_SOFT_ASSERT_AS_CLEAN_PASS",
    gTypes: ["G8"],
    hiddenDefeater: "A continued execution path can be mistaken for clean evidence if assertion failures are not preserved in the final result."
  }
});

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function intersection(a, b) {
  const right = new Set(b);
  return a.filter((value) => right.has(value));
}

function binaryEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function riskSignalIds(riskSignals = []) {
  return riskSignals.map((signal) => typeof signal === "string" ? signal : signal.id).filter(Boolean);
}

export function semanticTypesForScenario(scenario = {}, riskSignals = []) {
  const ids = new Set(SCENARIO_G_HINTS[scenario.id] || []);
  const contextual = uniq([
    ...(scenario.riskSignals || []),
    ...(scenario.matchedRiskSignals || []),
    ...riskSignalIds(riskSignals)
  ]);
  for (const signal of contextual) {
    for (const gType of RISK_SIGNAL_G_HINTS[signal] || []) ids.add(gType);
  }
  const text = [scenario.id, scenario.category, scenario.title, scenario.why, ...(scenario.signals || [])].filter(Boolean).join(" ");
  for (const [gType, regex] of TEXT_G_HINTS) if (regex.test(text)) ids.add(gType);
  return [...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function rawEvidenceSupport(evidence = {}) {
  const state = evidence.state || "unknown";
  const score = Number.isFinite(evidence.score) ? clamp(evidence.score) : 0.5;
  if (state === "linked-pass" || state === "reproduced-invariant") return state === "linked-pass" ? 0.9 : 0.98;
  if (state === "linked-flaky") return 0.65;
  if (state === "linked-fail" || state === "reproduced-defect") return state === "linked-fail" ? 0.15 : 0.02;
  if (state === "candidate-covered") return 0.5 + 0.2 * score;
  if (state === "partial") return 0.5 + 0.08 * score;
  return 0.5;
}

function witnessChannel(evidence = {}) {
  const state = evidence.state || "unknown";
  if (state.startsWith("linked-") || state.startsWith("runtime-")) return "runtime";
  if (state.startsWith("reproduced-")) return "discriminating-probe";
  if (state === "candidate-covered" || state === "partial") return "static-source";
  return "none";
}

export function measureDeceptiveWitnesses(scenario, testEvidenceRisks = [], riskSignals = []) {
  const gTypes = semanticTypesForScenario(scenario, riskSignals);
  const evidenceState = scenario?.evidence?.state || "unknown";
  const hasPositiveCandidate = ["candidate-covered", "partial", "linked-pass", "linked-flaky", "runtime-candidate"].includes(evidenceState);
  if (!hasPositiveCandidate) return [];

  const findings = [];
  for (const risk of testEvidenceRisks) {
    const rule = DECEPTIVE_WITNESS_RULES[risk.id];
    if (!rule) continue;
    const affected = intersection(gTypes, rule.gTypes);
    if (!affected.length) continue;
    findings.push({
      id: rule.id,
      status: "suspected_dw",
      sourceRisk: risk.id,
      scenarioId: scenario.id,
      affectedTypes: affected,
      localWitness: evidenceState,
      hiddenDefeater: rule.hiddenDefeater,
      entropyEffect: "WITHHOLD_UNJUSTIFIED_ENTROPY_REDUCTION",
      inferenceWeight: Math.min(1, 0.45 + Math.log2(1 + (risk.hits || 1)) * 0.12),
      boundary: "This flags a claim-licensing risk, not a proven product defect."
    });
  }

  const staticFiles = scenario?.evidence?.files || [];
  if (witnessChannel(scenario.evidence) === "static-source" && staticFiles.length > 1) {
    findings.push({
      id: "DW_CORRELATED_STATIC_CHANNEL",
      status: "suspected_dw",
      sourceRisk: "STATIC_LEXICAL_CHANNEL",
      scenarioId: scenario.id,
      affectedTypes: gTypes,
      localWitness: evidenceState,
      hiddenDefeater: "Multiple lexical matches remain one static evidence channel until independent runtime or authoritative witnesses are established.",
      entropyEffect: "NO_INDEPENDENCE_CREDIT",
      inferenceWeight: 0.5,
      boundary: "Multiple files may later prove independent; the static scan does not assume independence."
    });
  }

  return findings;
}

function correctedSupport(scenario, deceptiveWitnesses) {
  const raw = rawEvidenceSupport(scenario.evidence);
  if (raw <= 0.5 || !deceptiveWitnesses.length) return raw;
  const penalty = clamp(deceptiveWitnesses.reduce((sum, item) => sum + item.inferenceWeight * 0.18, 0), 0, 0.85);
  return 0.5 + (raw - 0.5) * (1 - penalty);
}

function pressureIdsForScenario(scenario, riskSignals = []) {
  const active = new Set(riskSignalIds(riskSignals));
  const declared = uniq([...(scenario.riskSignals || []), ...(scenario.matchedRiskSignals || [])]);
  const gs = semanticTypesForScenario(scenario, riskSignals);
  const inferred = Object.entries(RISK_SIGNAL_G_HINTS)
    .filter(([, types]) => intersection(gs, types).length > 0)
    .map(([signal]) => signal)
    .filter((signal) => active.has(signal));
  return uniq([...declared.filter((signal) => active.has(signal)), ...inferred]);
}

function probeCost(scenario) {
  const text = `${scenario?.id || ""} ${scenario?.title || ""}`.toLowerCase();
  if (/concurrent|race|multi.?tab|realtime|offline|upload/.test(text)) return { units: 3, band: "medium" };
  if (/auth|mfa|otp|session|redirect|callback|payment/.test(text)) return { units: 2, band: "low-medium" };
  return { units: 1, band: "low" };
}

function makeFirstBite(report, scenarioSemantics) {
  const gaps = report.gaps || [];
  const byId = new Map(scenarioSemantics.map((item) => [item.scenarioId, item]));
  const ranked = gaps.map((scenario) => {
    const semantic = byId.get(scenario.id) || {
      gTypes: semanticTypesForScenario(scenario, report.riskSignals || []),
      entropy: 1,
      deceptiveWitnessCount: 0,
      pressures: pressureIdsForScenario(scenario, report.riskSignals || [])
    };
    const criticality = PRIORITY_WEIGHT[scenario.priority] || 1;
    const couplingCoverage = Math.max(0, semantic.gTypes.length - 1);
    const uncertaintyKilled = semantic.entropy;
    const pressureCoverage = semantic.pressures.length;
    const deceptiveDiscrimination = semantic.deceptiveWitnessCount;
    const cost = probeCost(scenario);
    const value = (criticality * 2 + uncertaintyKilled * 3 + pressureCoverage * 1.4 + couplingCoverage * 0.8 + deceptiveDiscrimination) / cost.units;
    return {
      scenarioId: scenario.id,
      title: scenario.title,
      semanticTypes: semantic.gTypes,
      pressures: semantic.pressures,
      uncertaintyKilled: Number(uncertaintyKilled.toFixed(3)),
      couplingCoverage,
      deceptiveWitnessesTested: deceptiveDiscrimination,
      relativeCost: cost.band,
      score: Number(value.toFixed(3)),
      rationale: `Targets ${semantic.gTypes.join(", ") || "an unresolved journey invariant"}${pressureCoverage ? ` under ${semantic.pressures.join(", ")} pressure` : ""}; ranking maximizes uncertainty and pressure discrimination per relative probe cost.`,
      boundary: "First Bite is a probe-ordering heuristic. Relative cost is not an engineering estimate or monetary quote."
    };
  }).sort((a, b) => b.score - a.score || a.scenarioId.localeCompare(b.scenarioId));

  return {
    objective: "maximize (uncertainty killed + decision-critical coverage + pressure discrimination + coupling coverage) / relative probe cost",
    next: ranked[0] || null,
    frontier: ranked.slice(0, 5)
  };
}

function buildCouplingCandidates(scenarioSemantics) {
  const pairs = new Map();
  for (const scenario of scenarioSemantics) {
    const types = scenario.gTypes;
    for (let i = 0; i < types.length; i += 1) {
      for (let j = i + 1; j < types.length; j += 1) {
        const key = `${types[i]}×${types[j]}`;
        const entry = pairs.get(key) || { id: key, gTypes: [types[i], types[j]], scenarioIds: [], pressures: new Set(), support: 0 };
        entry.scenarioIds.push(scenario.scenarioId);
        for (const pressure of scenario.pressures) entry.pressures.add(pressure);
        entry.support += PRIORITY_WEIGHT[scenario.priority] || 1;
        pairs.set(key, entry);
      }
    }
  }
  return [...pairs.values()]
    .map((entry) => ({ ...entry, pressures: [...entry.pressures], scenarioIds: uniq(entry.scenarioIds) }))
    .sort((a, b) => b.support - a.support || a.id.localeCompare(b.id))
    .slice(0, 12);
}

export function buildSemanticAssurance(report = {}, options = {}) {
  const riskSignals = report.riskSignals || [];
  const testEvidenceRisks = report.testEvidenceRisks || [];
  const scenarios = report.scenarios || [];

  const scenarioSemantics = scenarios.map((scenario) => {
    const gTypes = semanticTypesForScenario(scenario, riskSignals);
    const deceptiveWitnesses = measureDeceptiveWitnesses(scenario, testEvidenceRisks, riskSignals);
    const pHat = correctedSupport(scenario, deceptiveWitnesses);
    return {
      scenarioId: scenario.id,
      title: scenario.title,
      priority: scenario.priority,
      gTypes,
      pressures: pressureIdsForScenario(scenario, riskSignals),
      witnessChannel: witnessChannel(scenario.evidence),
      rawSupport: Number(rawEvidenceSupport(scenario.evidence).toFixed(4)),
      correctedSupport: Number(pHat.toFixed(4)),
      driftFromAdmittedRegime: Number((pHat - 1).toFixed(4)),
      entropy: Number(binaryEntropy(pHat).toFixed(4)),
      risk: Number((1 - pHat).toFixed(4)),
      deceptiveWitnessCount: deceptiveWitnesses.length,
      deceptiveWitnesses
    };
  });

  const coordinates = G_TAXONOMY.map((g) => {
    const active = scenarioSemantics.filter((scenario) => scenario.gTypes.includes(g.id));
    if (!active.length) {
      return {
        ...g,
        applicable: false,
        scenarioCount: 0,
        pHat: null,
        drift: 0,
        direction: "not-applicable",
        entropy: 0,
        risk: 0,
        pressures: [],
        deceptiveWitnesses: []
      };
    }
    const weighted = active.reduce((acc, scenario) => {
      const w = PRIORITY_WEIGHT[scenario.priority] || 1;
      acc.weight += w;
      acc.support += scenario.correctedSupport * w;
      return acc;
    }, { weight: 0, support: 0 });
    const pHat = weighted.support / weighted.weight;
    const drift = pHat - 1;
    const deceptive = active.flatMap((scenario) => scenario.deceptiveWitnesses);
    return {
      ...g,
      applicable: true,
      scenarioCount: active.length,
      scenarioIds: active.map((scenario) => scenario.scenarioId),
      pHat: Number(pHat.toFixed(4)),
      drift: Number(drift.toFixed(4)),
      direction: drift < -0.05 ? "away-from-admitted-regime" : drift > 0.05 ? "toward-admitted-regime" : "stable",
      entropy: Number(binaryEntropy(pHat).toFixed(4)),
      risk: Number((1 - pHat).toFixed(4)),
      pressures: uniq(active.flatMap((scenario) => scenario.pressures)),
      deceptiveWitnesses: uniq(deceptive.map((item) => item.id))
    };
  });

  const applicable = coordinates.filter((coordinate) => coordinate.applicable);
  const totalWeight = applicable.reduce((sum, coordinate) => sum + Math.max(1, coordinate.scenarioCount), 0) || 1;
  const entropy = applicable.reduce((sum, coordinate) => sum + coordinate.entropy * Math.max(1, coordinate.scenarioCount), 0) / totalWeight;
  const risk = applicable.reduce((sum, coordinate) => sum + coordinate.risk * Math.max(1, coordinate.scenarioCount), 0) / totalWeight;
  const driftNorm = Math.sqrt(applicable.reduce((sum, coordinate) => sum + coordinate.drift ** 2, 0));
  const deceptiveWitnesses = scenarioSemantics.flatMap((scenario) => scenario.deceptiveWitnesses);

  const previous = options.previous || null;
  const previousEntropy = previous?.summary?.semanticEntropy;
  const previousRisk = previous?.summary?.semanticRisk;
  const fluxMode = Number.isFinite(previousEntropy) && Number.isFinite(previousRisk) ? "temporal" : "reference-to-observed";
  const entropyDelta = fluxMode === "temporal" ? entropy - previousEntropy : entropy;
  const riskDelta = fluxMode === "temporal" ? risk - previousRisk : risk;

  return {
    schema: "ui-iceberg-semantic-assurance-v0.1",
    manifold: {
      model: "RCT semantic manifold / local UI journey chart",
      reference: "admitted journey regime",
      coordinateSystem: "G1-G12 typed semantic taxonomy",
      driftDefinition: "Delta_G = p_hat(observed evidence) - p_target, with p_target = 1 for applicable required invariants",
      entropyDefinition: "H_S = weighted binary entropy over evidence-bounded constraint satisfaction estimates",
      riskDefinition: "R_S = weighted (1 - p_hat)",
      boundary: "Static candidate evidence is intentionally weakly licensed. Numeric support is a bounded scan diagnostic, not a runtime defect probability."
    },
    summary: {
      semanticEntropy: Number(entropy.toFixed(4)),
      semanticRisk: Number(risk.toFixed(4)),
      driftNorm: Number(driftNorm.toFixed(4)),
      activeCoordinates: applicable.length,
      deceptiveWitnesses: deceptiveWitnesses.length,
      entropyRiskFlux: {
        mode: fluxMode,
        entropyDelta: Number(entropyDelta.toFixed(4)),
        riskDelta: Number(riskDelta.toFixed(4)),
        classification: entropyDelta < 0 && riskDelta < 0
          ? "genuine-convergence"
          : entropyDelta > 0 && riskDelta > 0
            ? "uncertain-divergence"
            : entropyDelta < 0 && riskDelta > 0
              ? "deceptive-stabilization"
              : entropyDelta > 0 && riskDelta < 0
                ? "improving-but-uncertain"
                : "stable-or-unresolved"
      }
    },
    coordinates,
    scenarioSemantics,
    deceptiveWitnesses,
    couplingCandidates: buildCouplingCandidates(scenarioSemantics),
    firstBite: makeFirstBite(report, scenarioSemantics),
    admission: {
      status: "INCONCLUSIVE",
      reason: "A static repository scan can locate typed semantic gaps and deceptive-witness risks, but cannot license journey correctness without explicit runtime or discriminating probe evidence.",
      hardGate: deceptiveWitnesses.some((item) => item.sourceRisk === "FOCUSED_TEST") ? "FOCUSED_TEST_EVIDENCE_RISK" : null
    }
  };
}

export function semanticTaxonomy() {
  return G_TAXONOMY.map((item) => ({ ...item }));
}

export async function analyzeJourneySemantics(rootDir, journeyName, options = {}) {
  const report = await analyzeJourneyGaps(rootDir, journeyName, options);
  const semanticAssurance = buildSemanticAssurance(report, { previous: options.previousSemanticAssurance });
  return { ...report, semanticAssurance };
}
