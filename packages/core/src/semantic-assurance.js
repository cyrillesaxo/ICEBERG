import { analyzeJourneyGaps } from "./index.js";

const G_TAXONOMY = Object.freeze([
  ["G1", "Label", "Names, wording, and lexical identity."],
  ["G2", "Node", "Semantic entity or target identity."],
  ["G3", "Boundary", "Limits, thresholds, validation, and reachable edges."],
  ["G4", "Edge", "Transitions, navigation, and relations between states."],
  ["G5", "Operation", "Actions and effects performed by the user or system."],
  ["G6", "Perspective", "Actor, role, access channel, device, or viewpoint."],
  ["G7", "Granularity", "Scale, grouping, list/detail, pagination, or information density."],
  ["G8", "Evidence", "Confirmation, feedback, assertion, or proof state."],
  ["G9", "Prerequisite", "Preconditions, permissions, validation, and required state."],
  ["G10", "Conflict", "Competing actions, races, duplicates, and contradictory states."],
  ["G11", "Temporal", "Timing, retry, expiry, ordering, interruption, and freshness."],
  ["G12", "Authority", "Authoritative source, role delegation, backend ownership, and approval."]
].map(([id, name, meaning]) => Object.freeze({ id, name, meaning })));

const PRIORITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });

const SCENARIO_G_HINTS = Object.freeze({
  CORE_SUCCESS: ["G4", "G5", "G8"], VALIDATION_RECOVERY: ["G3", "G5", "G9"],
  REQUEST_FAILURE_RETRY: ["G4", "G5", "G11"], SLOW_RESPONSE_FEEDBACK: ["G8", "G11"],
  DOUBLE_SUBMIT: ["G5", "G10", "G11"], REFRESH_PRESERVES_PROGRESS: ["G4", "G11"],
  BACK_FORWARD_CONTINUITY: ["G4", "G11"], LEAVE_AND_RETURN: ["G4", "G9", "G11"],
  SESSION_EXPIRY_RECOVERY: ["G9", "G11", "G12"], MOBILE_PRIMARY_ACTION: ["G3", "G5", "G6"],
  ZOOM_TEXT_SCALE: ["G3", "G6", "G7"], KEYBOARD_ONLY: ["G5", "G6"],
  STATE_RESTORE_AFTER_ERROR: ["G4", "G8", "G11"], EMPTY_OR_ZERO_STATE: ["G3", "G7", "G8"],
  PAYMENT_DECLINED_RETRY: ["G5", "G9", "G11", "G12"], PAYMENT_SUCCESS_CALLBACK_DELAY: ["G4", "G8", "G11", "G12"],
  OTP_INTERRUPT_RETURN: ["G4", "G9", "G11", "G12"], DUPLICATE_ORDER_AFTER_REFRESH: ["G5", "G10", "G11", "G12"],
  EMAIL_VERIFY_RETURN: ["G4", "G9", "G11", "G12"], EXISTING_ACCOUNT_RECOVERY: ["G2", "G5", "G9", "G12"],
  MFA_INTERRUPT_RETURN: ["G4", "G9", "G11", "G12"], LOCKOUT_RECOVERY: ["G5", "G9", "G11", "G12"],
  RESET_LINK_EXPIRED: ["G4", "G9", "G11"], RESET_RETURN_TO_LOGIN: ["G4", "G5", "G9"],
  DECLINE_RETENTION_CONTINUE: ["G4", "G5", "G6"], CANCEL_STATUS_PERSISTS: ["G4", "G8", "G11", "G12"],
  BOOKING_SLOT_RACE: ["G3", "G10", "G11", "G12"], BOOKING_TIMEZONE_BOUNDARY: ["G3", "G6", "G11"],
  BOOKING_DOUBLE_CONFIRM: ["G5", "G10", "G11", "G12"], UPLOAD_INTERRUPTED_RESUME: ["G4", "G5", "G11"],
  UPLOAD_PROCESSING_DELAY: ["G5", "G8", "G11", "G12"], UPLOAD_REPLACE_IDENTITY: ["G2", "G5", "G8"],
  SEARCH_STALE_RESPONSE: ["G4", "G7", "G10", "G11"], SEARCH_FILTER_RETURN_CONTINUITY: ["G4", "G7", "G11"],
  SEARCH_PAGINATION_CONTINUITY: ["G4", "G7", "G11"]
});

const SCENARIO_RISK_HINTS = Object.freeze({
  REQUEST_FAILURE_RETRY: ["async-network"], SLOW_RESPONSE_FEEDBACK: ["async-network"],
  DOUBLE_SUBMIT: ["async-network", "optimistic-ui"], REFRESH_PRESERVES_PROGRESS: ["browser-persistence", "draft-editing"],
  BACK_FORWARD_CONTINUITY: ["browser-persistence", "search-filter"], LEAVE_AND_RETURN: ["external-redirect", "browser-persistence", "auth-session"],
  SESSION_EXPIRY_RECOVERY: ["auth-session"], MOBILE_PRIMARY_ACTION: ["occluding-overlay"], KEYBOARD_ONLY: ["modal-overlay"],
  STATE_RESTORE_AFTER_ERROR: ["complex-form", "draft-editing"], PAYMENT_DECLINED_RETRY: ["async-network"],
  PAYMENT_SUCCESS_CALLBACK_DELAY: ["async-network", "realtime", "client-cache"], OTP_INTERRUPT_RETURN: ["external-redirect", "browser-persistence", "auth-session"],
  DUPLICATE_ORDER_AFTER_REFRESH: ["async-network", "optimistic-ui", "client-cache"], EMAIL_VERIFY_RETURN: ["external-redirect", "browser-persistence"],
  EXISTING_ACCOUNT_RECOVERY: ["auth-session"], MFA_INTERRUPT_RETURN: ["external-redirect", "auth-session"], LOCKOUT_RECOVERY: ["auth-session"],
  RESET_LINK_EXPIRED: ["auth-session", "date-time"], RESET_RETURN_TO_LOGIN: ["auth-session", "external-redirect"],
  CANCEL_STATUS_PERSISTS: ["client-cache", "browser-persistence"], BOOKING_SLOT_RACE: ["async-network", "realtime"],
  BOOKING_TIMEZONE_BOUNDARY: ["date-time", "internationalization"], BOOKING_DOUBLE_CONFIRM: ["async-network", "optimistic-ui"],
  UPLOAD_INTERRUPTED_RESUME: ["file-upload", "offline-capable"], UPLOAD_PROCESSING_DELAY: ["file-upload", "async-network", "realtime"],
  UPLOAD_REPLACE_IDENTITY: ["file-upload"], SEARCH_STALE_RESPONSE: ["search-filter", "async-network"],
  SEARCH_FILTER_RETURN_CONTINUITY: ["search-filter", "browser-persistence"], SEARCH_PAGINATION_CONTINUITY: ["search-filter", "progressive-list", "virtualized-list"]
});

const RISK_SIGNAL_G_HINTS = Object.freeze({
  "async-network": ["G4", "G5", "G11"], "optimistic-ui": ["G5", "G10", "G11"],
  "auth-session": ["G9", "G11", "G12"], "browser-persistence": ["G4", "G11"],
  "multi-context": ["G4", "G10", "G11"], "offline-capable": ["G4", "G11"],
  "external-redirect": ["G4", "G11"], "feature-flags": ["G6", "G9"], internationalization: ["G1", "G6"],
  rtl: ["G6", "G7"], "date-time": ["G3", "G11"], "file-upload": ["G2", "G5", "G11"],
  "virtualized-list": ["G2", "G7"], "progressive-list": ["G4", "G7", "G11"],
  "modal-overlay": ["G3", "G4", "G5", "G6"], "occluding-overlay": ["G3", "G5"],
  realtime: ["G4", "G10", "G11"], "client-cache": ["G4", "G11"],
  "device-permission": ["G6", "G9", "G12"], "search-filter": ["G1", "G4", "G7"],
  "complex-form": ["G3", "G5", "G9"], "draft-editing": ["G4", "G11"]
});

const TEXT_G_HINTS = Object.freeze([
  ["G1", /\b(label|copy|wording|locale|translation|message|name)\b/i], ["G2", /\b(identity|entity|target|selector|item|record|account|file)\b/i],
  ["G3", /\b(boundary|limit|validation|invalid|required|viewport|threshold|zero|empty)\b/i], ["G4", /\b(return|back|forward|redirect|navigation|transition|route|resume|refresh)\b/i],
  ["G5", /\b(action|submit|retry|cancel|upload|confirm|complete|click|operation)\b/i], ["G6", /\b(role|mobile|keyboard|access|user|admin|rtl|timezone|perspective)\b/i],
  ["G7", /\b(list|pagination|page|granularity|filter|search|detail|zoom|scale)\b/i], ["G8", /\b(feedback|confirmation|status|assert|evidence|loading|error|success)\b/i],
  ["G9", /\b(auth|permission|prerequisite|required|session|login|verify|validation)\b/i], ["G10", /\b(race|duplicate|conflict|concurrent|double|stale)\b/i],
  ["G11", /\b(timeout|retry|expiry|expired|delay|slow|interrupt|refresh|realtime|resume|timing|time)\b/i], ["G12", /\b(authority|authoritative|backend|server|role|approval|entitlement|payment|subscription)\b/i]
]);

const DW_RULES = Object.freeze({
  FIXED_WAIT: ["DW_TIMING_SLEEP_AS_READINESS", ["G8", "G11"], "The test waits for elapsed time rather than witnessing the actual readiness condition."],
  FORCED_ACTION: ["DW_FORCED_ACTION_AS_USER_ACTIONABILITY", ["G3", "G5", "G6"], "The automation bypasses actionability constraints that a real user must satisfy."],
  FOCUSED_TEST: ["DW_FOCUSED_SUBSET_AS_SUITE_HEALTH", G_TAXONOMY.map((x) => x.id), "A focused subset can be green while relevant witnesses outside that subset never ran."],
  RETRY_ENABLED: ["DW_RETRY_PASS_AS_STABILITY", ["G8", "G10", "G11"], "Retry-dependent success does not witness deterministic first-attempt stability."],
  NETWORK_MOCK: ["DW_MOCKED_PATH_AS_PRODUCTION_AUTHORITY", ["G4", "G8", "G11", "G12"], "The mocked path can bypass production integration, latency, authority, or recovery behavior."],
  VISUAL_ONLY_ORACLE: ["DW_VISUAL_MATCH_AS_SEMANTIC_CORRECTNESS", ["G1", "G2", "G3", "G4", "G5", "G6", "G8"], "Visual equality does not witness semantic target identity, operability, or task completion."],
  INDEX_BASED_TARGET: ["DW_SELECTOR_RESOLUTION_AS_TARGET_IDENTITY", ["G2", "G4", "G5", "G7"], "An index can continue resolving after ordering changes while pointing at a different semantic entity."],
  DISABLED_ASSERTION_FAILURE: ["DW_SOFT_ASSERT_AS_CLEAN_PASS", ["G8"], "Continued execution can be mistaken for clean evidence if assertion failures are not preserved in the final result."]
});

const uniq = (values) => [...new Set(values.filter(Boolean))];
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const intersection = (a, b) => { const set = new Set(b); return a.filter((x) => set.has(x)); };
const binaryEntropy = (p) => p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
const signalIds = (signals = []) => signals.map((x) => typeof x === "string" ? x : x.id).filter(Boolean);

function relevantPressureIds(scenario = {}, riskSignals = []) {
  const active = new Set(signalIds(riskSignals));
  const declared = uniq([...(scenario.riskSignals || []), ...(scenario.matchedRiskSignals || []), ...(SCENARIO_RISK_HINTS[scenario.id] || [])]);
  return declared.filter((signal) => active.has(signal));
}

export function semanticTypesForScenario(scenario = {}, riskSignals = []) {
  const ids = new Set(SCENARIO_G_HINTS[scenario.id] || []);
  for (const signal of relevantPressureIds(scenario, riskSignals)) for (const g of RISK_SIGNAL_G_HINTS[signal] || []) ids.add(g);
  const text = [scenario.id, scenario.category, scenario.title, scenario.why, ...(scenario.signals || [])].filter(Boolean).join(" ");
  for (const [g, regex] of TEXT_G_HINTS) if (regex.test(text)) ids.add(g);
  return [...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function rawSupport(evidence = {}) {
  const state = evidence.state || "unknown";
  const score = Number.isFinite(evidence.score) ? clamp(evidence.score) : 0.5;
  if (state === "reproduced-invariant") return 0.98;
  if (state === "reproduced-defect") return 0.02;
  if (state === "linked-pass") return 0.9;
  if (state === "linked-flaky") return 0.65;
  if (state === "linked-fail") return 0.15;
  if (state === "candidate-covered") return 0.5 + 0.2 * score;
  if (state === "partial") return 0.5 + 0.08 * score;
  return 0.5;
}

function witnessChannel(evidence = {}) {
  const state = evidence.state || "unknown";
  if (state.startsWith("linked-") || state.startsWith("runtime-")) return "runtime";
  if (state.startsWith("reproduced-")) return "discriminating-probe";
  if (["candidate-covered", "partial"].includes(state)) return "static-source";
  return "none";
}

function riskTouchesScenario(risk, scenario) {
  if (risk.id === "FOCUSED_TEST") return true;
  const riskFiles = (risk.files || []).map((x) => x.file).filter(Boolean);
  const scenarioFiles = (scenario?.evidence?.files || []).map((x) => x.file).filter(Boolean);
  if (!riskFiles.length || !scenarioFiles.length) return true;
  return intersection(riskFiles, scenarioFiles).length > 0;
}

export function measureDeceptiveWitnesses(scenario, testEvidenceRisks = [], riskSignals = []) {
  const gTypes = semanticTypesForScenario(scenario, riskSignals);
  const state = scenario?.evidence?.state || "unknown";
  if (!["candidate-covered", "partial", "linked-pass", "linked-flaky", "runtime-candidate"].includes(state)) return [];
  const findings = [];

  for (const risk of testEvidenceRisks) {
    const rule = DW_RULES[risk.id];
    if (!rule || !riskTouchesScenario(risk, scenario)) continue;
    const [id, ruleTypes, hiddenDefeater] = rule;
    const affectedTypes = intersection(gTypes, ruleTypes);
    if (!affectedTypes.length) continue;
    findings.push({
      id, status: "suspected_dw", sourceRisk: risk.id, scenarioId: scenario.id,
      affectedTypes, localWitness: state, hiddenDefeater,
      entropyEffect: "WITHHOLD_UNJUSTIFIED_ENTROPY_REDUCTION",
      inferenceWeight: Number(Math.min(1, 0.45 + Math.log2(1 + (risk.hits || 1)) * 0.12).toFixed(3)),
      boundary: "Claim-licensing risk only; this is not a proven product defect."
    });
  }

  if (witnessChannel(scenario.evidence) === "static-source" && (scenario?.evidence?.files || []).length > 1) {
    findings.push({
      id: "DW_CORRELATED_STATIC_CHANNEL", status: "suspected_dw", sourceRisk: "STATIC_LEXICAL_CHANNEL",
      scenarioId: scenario.id, affectedTypes: gTypes, localWitness: state,
      hiddenDefeater: "Multiple lexical matches remain one static evidence channel until independent runtime or authoritative witnesses are established.",
      entropyEffect: "NO_INDEPENDENCE_CREDIT", inferenceWeight: 0.5,
      boundary: "Multiple files may later prove independent; the static scan does not assume independence."
    });
  }
  return findings;
}

function correctedSupport(scenario, findings) {
  const raw = rawSupport(scenario.evidence);
  if (raw <= 0.5 || !findings.length) return raw;
  const penalty = clamp(findings.reduce((sum, x) => sum + x.inferenceWeight * 0.18, 0), 0, 0.85);
  return 0.5 + (raw - 0.5) * (1 - penalty);
}

function probeCost(scenario) {
  const text = `${scenario?.id || ""} ${scenario?.title || ""}`.toLowerCase();
  if (/concurrent|race|multi.?tab|realtime|offline|upload/.test(text)) return { units: 3, band: "medium" };
  if (/auth|mfa|otp|session|redirect|callback|payment/.test(text)) return { units: 2, band: "low-medium" };
  return { units: 1, band: "low" };
}

function firstBite(report, semantics) {
  const byId = new Map(semantics.map((x) => [x.scenarioId, x]));
  const frontier = (report.gaps || []).map((scenario) => {
    const s = byId.get(scenario.id) || { gTypes: semanticTypesForScenario(scenario, report.riskSignals), entropy: 1, pressures: [], deceptiveWitnessCount: 0 };
    const cost = probeCost(scenario);
    const criticality = PRIORITY_WEIGHT[scenario.priority] || 1;
    const couplingCoverage = Math.max(0, s.gTypes.length - 1);
    const expectedUncertaintyReduction = s.entropy;
    const score = (criticality * 2 + expectedUncertaintyReduction * 3 + s.pressures.length * 1.4 + couplingCoverage * 0.8 + s.deceptiveWitnessCount) / cost.units;
    return {
      scenarioId: scenario.id, title: scenario.title, semanticTypes: s.gTypes, pressures: s.pressures,
      expectedUncertaintyReduction: Number(expectedUncertaintyReduction.toFixed(3)), couplingCoverage,
      deceptiveWitnessesTested: s.deceptiveWitnessCount, relativeCost: cost.band, score: Number(score.toFixed(3)),
      rationale: `Targets ${s.gTypes.join(", ") || "an unresolved journey invariant"}${s.pressures.length ? ` under ${s.pressures.join(", ")} pressure` : ""}; ranking estimates discrimination value per relative probe cost.`,
      boundary: "Probe-ordering heuristic only. It is not a defect probability, engineering estimate, or monetary quote."
    };
  }).sort((a, b) => b.score - a.score || a.scenarioId.localeCompare(b.scenarioId));
  return { objective: "maximize expected uncertainty reduction + decision-critical/pressure/coupling coverage per relative probe cost", next: frontier[0] || null, frontier: frontier.slice(0, 5) };
}

function couplings(semantics) {
  const map = new Map();
  for (const s of semantics) for (let i = 0; i < s.gTypes.length; i++) for (let j = i + 1; j < s.gTypes.length; j++) {
    const gTypes = [s.gTypes[i], s.gTypes[j]];
    const id = `${gTypes[0]}×${gTypes[1]}`;
    const item = map.get(id) || { id, gTypes, scenarioIds: new Set(), pressures: new Set(), support: 0 };
    item.scenarioIds.add(s.scenarioId); for (const p of s.pressures) item.pressures.add(p); item.support += PRIORITY_WEIGHT[s.priority] || 1; map.set(id, item);
  }
  return [...map.values()].map((x) => ({ ...x, scenarioIds: [...x.scenarioIds], pressures: [...x.pressures] }))
    .sort((a, b) => b.support - a.support || a.id.localeCompare(b.id)).slice(0, 12);
}

export function buildSemanticAssurance(report = {}, options = {}) {
  const riskSignals = report.riskSignals || [];
  const testEvidenceRisks = report.testEvidenceRisks || [];
  const scenarioSemantics = (report.scenarios || []).map((scenario) => {
    const gTypes = semanticTypesForScenario(scenario, riskSignals);
    const deceptiveWitnesses = measureDeceptiveWitnesses(scenario, testEvidenceRisks, riskSignals);
    const pHat = correctedSupport(scenario, deceptiveWitnesses);
    return {
      scenarioId: scenario.id, title: scenario.title, priority: scenario.priority, gTypes,
      pressures: relevantPressureIds(scenario, riskSignals), witnessChannel: witnessChannel(scenario.evidence),
      rawSupport: Number(rawSupport(scenario.evidence).toFixed(4)), correctedSupport: Number(pHat.toFixed(4)),
      referenceDisplacement: Number((pHat - 1).toFixed(4)), entropy: Number(binaryEntropy(pHat).toFixed(4)), risk: Number((1 - pHat).toFixed(4)),
      deceptiveWitnessCount: deceptiveWitnesses.length, deceptiveWitnesses
    };
  });

  const previousCoordinates = new Map((options.previous?.coordinates || []).map((x) => [x.id, x]));
  const coordinates = G_TAXONOMY.map((g) => {
    const active = scenarioSemantics.filter((s) => s.gTypes.includes(g.id));
    if (!active.length) return { ...g, applicable: false, scenarioCount: 0, pHat: null, referenceDisplacement: 0, referenceDirection: "not-applicable", temporalDelta: null, trajectoryDirection: "not-applicable", entropy: 0, risk: 0, pressures: [], deceptiveWitnesses: [] };
    const totals = active.reduce((a, s) => { const w = PRIORITY_WEIGHT[s.priority] || 1; a.weight += w; a.support += s.correctedSupport * w; return a; }, { weight: 0, support: 0 });
    const pHat = totals.support / totals.weight;
    const displacement = pHat - 1;
    const prev = previousCoordinates.get(g.id);
    const temporalDelta = Number.isFinite(prev?.pHat) ? pHat - prev.pHat : null;
    return {
      ...g, applicable: true, scenarioCount: active.length, scenarioIds: active.map((s) => s.scenarioId), pHat: Number(pHat.toFixed(4)),
      referenceDisplacement: Number(displacement.toFixed(4)), referenceDirection: displacement < -0.05 ? "away-from-admitted-regime" : "at-admitted-regime",
      temporalDelta: temporalDelta == null ? null : Number(temporalDelta.toFixed(4)),
      trajectoryDirection: temporalDelta == null ? "unresolved-no-prior-receipt" : temporalDelta > 0.05 ? "toward-admitted-regime" : temporalDelta < -0.05 ? "away-from-admitted-regime" : "stable",
      entropy: Number(binaryEntropy(pHat).toFixed(4)), risk: Number((1 - pHat).toFixed(4)),
      pressures: uniq(active.flatMap((s) => s.pressures)), deceptiveWitnesses: uniq(active.flatMap((s) => s.deceptiveWitnesses.map((dw) => dw.id)))
    };
  });

  const applicable = coordinates.filter((x) => x.applicable);
  const totalWeight = applicable.reduce((sum, x) => sum + Math.max(1, x.scenarioCount), 0) || 1;
  const entropy = applicable.reduce((sum, x) => sum + x.entropy * Math.max(1, x.scenarioCount), 0) / totalWeight;
  const risk = applicable.reduce((sum, x) => sum + x.risk * Math.max(1, x.scenarioCount), 0) / totalWeight;
  const driftNorm = Math.sqrt(applicable.reduce((sum, x) => sum + x.referenceDisplacement ** 2, 0));
  const deceptiveWitnesses = scenarioSemantics.flatMap((s) => s.deceptiveWitnesses);
  const previousEntropy = options.previous?.summary?.semanticEntropy;
  const previousRisk = options.previous?.summary?.semanticRisk;
  const temporal = Number.isFinite(previousEntropy) && Number.isFinite(previousRisk);
  const entropyDelta = temporal ? entropy - previousEntropy : entropy;
  const riskDelta = temporal ? risk - previousRisk : risk;
  const classification = entropyDelta < 0 && riskDelta < 0 ? "genuine-convergence"
    : entropyDelta > 0 && riskDelta > 0 ? "uncertain-divergence"
      : entropyDelta < 0 && riskDelta > 0 ? "deceptive-stabilization"
        : entropyDelta > 0 && riskDelta < 0 ? "improving-but-uncertain" : "stable-or-unresolved";

  return {
    schema: "ui-iceberg-semantic-assurance-v0.1",
    manifold: {
      model: "RCT semantic manifold / local UI journey chart", reference: "admitted journey regime", coordinateSystem: "G1-G12 typed semantic taxonomy",
      driftDefinition: "Reference displacement Delta_G = p_hat(observed evidence) - p_target; temporal direction requires a prior receipt.",
      entropyDefinition: "H_S = weighted binary entropy over evidence-bounded constraint-satisfaction estimates", riskDefinition: "R_S = weighted (1 - p_hat)",
      boundary: "Static candidate evidence is weakly licensed. Numeric support is a bounded scan diagnostic, not runtime defect probability."
    },
    summary: {
      semanticEntropy: Number(entropy.toFixed(4)), semanticRisk: Number(risk.toFixed(4)), driftNorm: Number(driftNorm.toFixed(4)),
      activeCoordinates: applicable.length, deceptiveWitnesses: deceptiveWitnesses.length,
      entropyRiskFlux: { mode: temporal ? "temporal" : "reference-to-observed", entropyDelta: Number(entropyDelta.toFixed(4)), riskDelta: Number(riskDelta.toFixed(4)), classification }
    },
    coordinates, scenarioSemantics, deceptiveWitnesses, couplingCandidates: couplings(scenarioSemantics), firstBite: firstBite(report, scenarioSemantics),
    admission: {
      status: "INCONCLUSIVE",
      reason: "A static repository scan can locate typed semantic gaps and deceptive-witness risks, but cannot license journey correctness without explicit runtime or discriminating probe evidence.",
      hardGate: deceptiveWitnesses.some((x) => x.sourceRisk === "FOCUSED_TEST") ? "FOCUSED_TEST_EVIDENCE_RISK" : null
    }
  };
}

export function semanticTaxonomy() { return G_TAXONOMY.map((x) => ({ ...x })); }

export async function analyzeJourneySemantics(rootDir, journeyName, options = {}) {
  const report = await analyzeJourneyGaps(rootDir, journeyName, options);
  return { ...report, semanticAssurance: buildSemanticAssurance(report, { previous: options.previousSemanticAssurance }) };
}
