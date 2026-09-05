const PRIORITY_WEIGHT = Object.freeze({ critical: 400, high: 300, medium: 200, low: 100 });
const EVIDENCE_WEIGHT = Object.freeze({ missing: 60, unknown: 50, partial: 30, "candidate-covered": 0 });
const SOURCE_WEIGHT = Object.freeze({
  "journey-profile": 90,
  "journey-archetype": 80,
  "failure-pattern-library": 70,
  "ui-iceberg-core": 0
});

const SCENARIO_CONTEXT_SIGNALS = Object.freeze({
  REQUEST_FAILURE_RETRY: ["async-network"],
  SLOW_RESPONSE_FEEDBACK: ["async-network"],
  DOUBLE_SUBMIT: ["async-network", "optimistic-ui"],
  REFRESH_PRESERVES_PROGRESS: ["browser-persistence", "draft-editing"],
  BACK_FORWARD_CONTINUITY: ["browser-persistence", "search-filter"],
  LEAVE_AND_RETURN: ["external-redirect", "browser-persistence", "auth-session"],
  SESSION_EXPIRY_RECOVERY: ["auth-session"],
  MOBILE_PRIMARY_ACTION: ["occluding-overlay"],
  KEYBOARD_ONLY: ["modal-overlay"],
  STATE_RESTORE_AFTER_ERROR: ["complex-form", "draft-editing"],
  PAYMENT_DECLINED_RETRY: ["async-network"],
  PAYMENT_SUCCESS_CALLBACK_DELAY: ["async-network", "realtime", "client-cache"],
  OTP_INTERRUPT_RETURN: ["external-redirect", "browser-persistence", "auth-session"],
  DUPLICATE_ORDER_AFTER_REFRESH: ["async-network", "optimistic-ui", "client-cache"],
  EMAIL_VERIFY_RETURN: ["external-redirect", "browser-persistence"],
  EXISTING_ACCOUNT_RECOVERY: ["auth-session"],
  MFA_INTERRUPT_RETURN: ["external-redirect", "auth-session"],
  LOCKOUT_RECOVERY: ["auth-session"],
  RESET_LINK_EXPIRED: ["auth-session", "date-time"],
  RESET_RETURN_TO_LOGIN: ["auth-session", "external-redirect"],
  CANCEL_STATUS_PERSISTS: ["client-cache", "browser-persistence"],
  BOOKING_SLOT_RACE: ["async-network", "realtime"],
  BOOKING_TIMEZONE_BOUNDARY: ["date-time", "internationalization"],
  BOOKING_DOUBLE_CONFIRM: ["async-network", "optimistic-ui"],
  UPLOAD_INTERRUPTED_RESUME: ["file-upload", "offline-capable"],
  UPLOAD_PROCESSING_DELAY: ["file-upload", "async-network", "realtime"],
  UPLOAD_REPLACE_IDENTITY: ["file-upload"],
  SEARCH_STALE_RESPONSE: ["search-filter", "async-network"],
  SEARCH_FILTER_RETURN_CONTINUITY: ["search-filter", "browser-persistence"],
  SEARCH_PAGINATION_CONTINUITY: ["search-filter", "progressive-list", "virtualized-list"]
});

function activeRiskIds(riskSignals = []) {
  return new Set(riskSignals.map((signal) => typeof signal === "string" ? signal : signal.id).filter(Boolean));
}

export function scoreScenarioForNextTest(scenario, riskSignals = []) {
  const active = activeRiskIds(riskSignals);
  const declared = scenario.source === "failure-pattern-library"
    ? (scenario.riskSignals || [])
    : (SCENARIO_CONTEXT_SIGNALS[scenario.id] || []);
  const matchedContextSignals = declared.filter((signal) => active.has(signal));
  const directMatches = scenario.matchedRiskSignals || [];
  const contextualMatches = [...new Set([...matchedContextSignals, ...directMatches])];
  const priority = PRIORITY_WEIGHT[scenario.priority] || 0;
  const evidence = EVIDENCE_WEIGHT[scenario.evidence?.state] || 0;
  const source = SOURCE_WEIGHT[scenario.source] || 0;
  const repositoryRelevance = Math.min(120, contextualMatches.length * 35);
  const incompleteEvidence = scenario.evidence?.score != null ? Math.round((1 - scenario.evidence.score) * 20) : 10;
  const score = priority + evidence + source + repositoryRelevance + incompleteEvidence;

  return {
    score,
    factors: {
      priority,
      evidence,
      source,
      repositoryRelevance,
      incompleteEvidence
    },
    matchedContextSignals: contextualMatches,
    explanation: contextualMatches.length
      ? `Prioritized because this ${scenario.priority} scenario is unverified and the repository exposes ${contextualMatches.join(", ")} implementation pressure${contextualMatches.length === 1 ? "" : "s"}.`
      : `Prioritized from scenario severity, journey specificity, and missing/partial evidence; no repository-specific implementation pressure was required for this recommendation.`,
    boundary: "Recommendation score ranks test hypotheses. It is not a defect probability or proof of user impact."
  };
}

export function prioritizeScenarioGaps(gaps = [], riskSignals = []) {
  return gaps
    .map((scenario) => ({
      ...scenario,
      recommendation: scoreScenarioForNextTest(scenario, riskSignals)
    }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score || String(a.id).localeCompare(String(b.id)));
}

export function scenarioContextSignalMap() {
  return Object.fromEntries(Object.entries(SCENARIO_CONTEXT_SIGNALS).map(([id, signals]) => [id, [...signals]]));
}
