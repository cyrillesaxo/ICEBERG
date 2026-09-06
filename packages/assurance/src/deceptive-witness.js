const SUPPORT_STATES = new Set(["linked-pass", "runtime-pass", "reproduced-witness", "verified"]);
const ANTI_STATES = new Set(["linked-fail", "runtime-fail", "reproduced-antiwitness"]);
const UNKNOWN_STATES = new Set(["unknown", "unverified", "candidate", "candidate-covered", "partial", "runtime-candidate"]);

const SEVERITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });

const DECEPTIVE_WITNESS_RULES = Object.freeze({
  FIXED_WAIT: {
    distortion: "TEMPORAL_ASSUMPTION",
    severity: "high",
    blockedScopes: ["deterministic-stability", "interaction-readiness"],
    broadScopeRisk: false,
    why: "A fixed delay can make the test green without witnessing the real readiness condition.",
    licensedClaim: "The asserted postcondition held after the configured delay under the tested conditions.",
    probe: {
      id: "PROBE_REAL_READINESS",
      goal: "Replace elapsed-time evidence with an observable readiness invariant and vary response timing."
    }
  },
  FORCED_ACTION: {
    distortion: "ACTIONABILITY_BYPASS",
    severity: "high",
    blockedScopes: ["user-actionability", "interaction-readiness", "cognitive-usability", "accessibility-complete"],
    broadScopeRisk: true,
    why: "A forced action bypasses visibility, stability, hit-target, or occlusion conditions a user must satisfy.",
    licensedClaim: "The bound handler/path can execute when the automation framework bypasses actionability checks.",
    probe: {
      id: "PROBE_NATURAL_ACTIONABILITY",
      goal: "Replay without force and assert visibility, stability, hit-target reachability, and resulting state."
    }
  },
  SKIPPED_TEST: {
    distortion: "NON_EXECUTION_PRESENTED_AS_COVERAGE",
    severity: "medium",
    blockedScopes: ["suite-completeness", "production-journey-health"],
    broadScopeRisk: false,
    nonWitness: true,
    why: "A skipped scenario can exist in source while contributing no runtime witness.",
    licensedClaim: "A coverage obligation is declared in source; execution is not established.",
    probe: {
      id: "PROBE_EXECUTE_SKIPPED_OBLIGATION",
      goal: "Enable the scenario with real assertions and obtain explicit runtime evidence."
    }
  },
  FOCUSED_TEST: {
    distortion: "SUITE_EXCLUSION",
    severity: "critical",
    blockedScopes: ["suite-completeness", "production-journey-health"],
    broadScopeRisk: true,
    why: "Focused execution can produce a green run while silently excluding other obligations.",
    licensedClaim: "The focused subset ran; the full suite is not established by that run.",
    probe: {
      id: "PROBE_FULL_SUITE_EXECUTION",
      goal: "Remove focus markers and verify the intended suite manifest actually executes."
    }
  },
  RETRY_ENABLED: {
    distortion: "RETRY_LAUNDERING",
    severity: "medium",
    blockedScopes: ["deterministic-stability"],
    broadScopeRisk: false,
    why: "Retry policy can hide first-attempt instability if retry-dependent success is flattened into PASS.",
    licensedClaim: "The scenario may eventually pass under the configured retry policy; first-attempt stability is not established.",
    probe: {
      id: "PROBE_FIRST_ATTEMPT_STABILITY",
      goal: "Inspect first-attempt outcome and repeated clean runs with retries disabled for the targeted scenario."
    }
  },
  NETWORK_MOCK: {
    distortion: "AUTHORITY_SUBSTITUTION",
    severity: "medium",
    blockedScopes: ["external-authority-path", "production-journey-health", "business-outcome"],
    broadScopeRisk: true,
    why: "A mocked authority can make frontend behavior deterministic while real integration, latency, callback, and authority semantics remain unobserved.",
    licensedClaim: "The frontend handled the supplied mocked response under the tested conditions.",
    probe: {
      id: "PROBE_REAL_AUTHORITY_BOUNDARY",
      goal: "Exercise the real or contract-faithful authority boundary including delay, error, and return-state semantics."
    }
  },
  VISUAL_ONLY_ORACLE: {
    distortion: "ORACLE_SCOPE_NARROWING",
    severity: "medium",
    blockedScopes: ["task-continuity", "semantic-target-identity", "cognitive-usability", "accessibility-complete"],
    broadScopeRisk: true,
    why: "A visual match can remain green while semantic identity, focus, actionability, or task completion is wrong.",
    licensedClaim: "The rendered pixels matched the configured visual oracle within its tolerance policy.",
    probe: {
      id: "PROBE_SEMANTIC_TASK_INVARIANT",
      goal: "Add semantic/state assertions for target identity, focus/actionability, and task completion."
    }
  },
  INDEX_BASED_TARGET: {
    distortion: "SEMANTIC_IDENTITY_DRIFT",
    severity: "medium",
    blockedScopes: ["semantic-target-identity", "task-continuity"],
    broadScopeRisk: false,
    why: "An ordinal selector can continue resolving after reorder while targeting a different semantic entity.",
    licensedClaim: "An element at the selected ordinal position was exercised; semantic identity needs separate evidence.",
    probe: {
      id: "PROBE_STABLE_SEMANTIC_IDENTITY",
      goal: "Target by stable semantic identity and perturb ordering/cardinality to test identity continuity."
    }
  },
  DISABLED_ASSERTION_FAILURE: {
    distortion: "ASSERTION_FAILURE_MASKING",
    severity: "high",
    blockedScopes: ["assertion-integrity", "technical-ui-runtime", "production-journey-health"],
    broadScopeRisk: true,
    why: "Soft/failure-tolerant assertion configuration can allow execution to continue and requires proof that failed checks still fail the final result.",
    licensedClaim: "Execution continued through soft assertions; final claim licensing depends on the runner's aggregate failure semantics.",
    probe: {
      id: "PROBE_ASSERTION_FAILURE_PROPAGATION",
      goal: "Seed a known failing assertion and verify the final test/run is non-green."
    }
  }
});

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeRisk(item) {
  if (typeof item === "string") return { id: item };
  return item || {};
}

function normalizedRisks(input = {}) {
  const explicit = input.evidenceRisks || input.risks || input.witness?.evidenceRisks || input.witness?.risks || [];
  const characteristics = input.characteristics || input.witness?.characteristics || {};
  const characteristicMap = {
    fixedWait: "FIXED_WAIT",
    forcedAction: "FORCED_ACTION",
    skippedTest: "SKIPPED_TEST",
    focusedTest: "FOCUSED_TEST",
    retryEnabled: "RETRY_ENABLED",
    networkMock: "NETWORK_MOCK",
    visualOnlyOracle: "VISUAL_ONLY_ORACLE",
    indexBasedTarget: "INDEX_BASED_TARGET",
    disabledAssertionFailure: "DISABLED_ASSERTION_FAILURE"
  };
  const inferred = Object.entries(characteristicMap)
    .filter(([key]) => characteristics[key] === true)
    .map(([, id]) => ({ id, source: "characteristic" }));
  const seen = new Set();
  return [...explicit.map(normalizeRisk), ...inferred].filter((risk) => {
    if (!risk.id || seen.has(risk.id)) return false;
    seen.add(risk.id);
    return true;
  });
}

function blocksScope(rule, scope) {
  if (rule.blockedScopes.includes(scope)) return true;
  return scope === "technical-ui-runtime" && rule.broadScopeRisk === true;
}

function classify(witnessState, matched, blocking) {
  if (ANTI_STATES.has(witnessState)) return "ANTIWITNESS";
  if (UNKNOWN_STATES.has(witnessState) || !witnessState) return "UNKNOWN_WITNESS";
  if (witnessState === "linked-flaky") return "DECEPTIVE_WITNESS_CANDIDATE";
  if (matched.some((item) => item.rule.nonWitness)) return "NON_WITNESS_OBLIGATION";
  if (!SUPPORT_STATES.has(witnessState)) return "UNKNOWN_WITNESS";
  if (blocking.length) return "DECEPTIVE_WITNESS_CANDIDATE";
  if (matched.length) return "WEAKENED_WITNESS";
  return "CLEAN_WITNESS";
}

function topProbe(matched) {
  const ordered = [...matched].sort((a, b) =>
    (SEVERITY_WEIGHT[b.rule.severity] || 0) - (SEVERITY_WEIGHT[a.rule.severity] || 0) || a.id.localeCompare(b.id)
  );
  const top = ordered[0];
  return top ? { ...top.rule.probe, triggeredBy: top.id, distortion: top.rule.distortion, severity: top.rule.severity } : null;
}

export function inspectDeceptiveWitness(input = {}) {
  const witness = input.witness || {};
  const claim = input.claim || {};
  const scope = input.scope || claim.scope || witness.scope || "technical-ui-runtime";
  const state = witness.state || input.state || "unknown";
  const risks = normalizedRisks(input);
  const matched = risks
    .filter((risk) => DECEPTIVE_WITNESS_RULES[risk.id])
    .map((risk) => ({ id: risk.id, risk, rule: DECEPTIVE_WITNESS_RULES[risk.id] }));
  if (state === "linked-flaky" && !matched.some((item) => item.id === "RETRY_ENABLED")) {
    matched.push({ id: "RETRY_ENABLED", risk: { id: "RETRY_ENABLED", source: "runtime-state" }, rule: DECEPTIVE_WITNESS_RULES.RETRY_ENABLED });
  }
  const blocking = matched.filter((item) => blocksScope(item.rule, scope));
  const classification = classify(state, matched, blocking);
  const distortions = matched.map(({ id, rule, risk }) => ({
    id,
    distortion: rule.distortion,
    severity: risk.severity || rule.severity,
    blocksRequestedScope: blocksScope(rule, scope),
    weakensScopes: [...rule.blockedScopes],
    why: rule.why,
    licensedClaim: rule.licensedClaim,
    boundary: risk.boundary || null
  }));

  return {
    schema: "ui-iceberg-deceptive-witness-v0.4",
    taxonomyStatus: "bounded-public-subset",
    witnessId: witness.id || input.id || null,
    scenarioId: witness.scenarioId || input.scenarioId || null,
    witnessState: state,
    claim,
    requestedScope: scope,
    classification,
    distortions,
    recommendedProbe: topProbe(blocking.length ? blocking : matched),
    claimLicense: {
      requestedScope: classification === "CLEAN_WITNESS" || classification === "WEAKENED_WITNESS" ? "supporting" : classification === "ANTIWITNESS" ? "contradicting" : "not-licensed",
      nominalSupport: SUPPORT_STATES.has(state),
      blockingDistortions: blocking.map((item) => item.rule.distortion),
      statement: classification === "CLEAN_WITNESS"
        ? "No known deceptive-witness distortion in the bounded public subset weakens the requested claim scope."
        : classification === "WEAKENED_WITNESS"
          ? "The witness has evidence-channel risks, but none directly blocks the requested scope in the bounded public subset."
          : classification === "DECEPTIVE_WITNESS_CANDIDATE"
            ? "The result may appear supportive while one or more evidence-channel distortions block the requested claim scope."
            : classification === "NON_WITNESS_OBLIGATION"
              ? "The artifact names an obligation but does not establish runtime execution."
              : classification === "ANTIWITNESS"
                ? "The supplied runtime state contradicts the claim under the tested conditions."
                : "The supplied evidence does not establish the requested claim."
    },
    boundary: "A deceptive-witness classification diagnoses evidence-channel distortion, not a product defect. The full 72-item research taxonomy is not vendored here; v0.4 executes only the bounded public subset derived from current test-evidence-risk detectors."
  };
}

export function auditDeceptiveWitnesses(inputs = []) {
  const audits = inputs.map((input) => inspectDeceptiveWitness(input));
  const counts = audits.reduce((acc, audit) => {
    acc[audit.classification] = (acc[audit.classification] || 0) + 1;
    return acc;
  }, {});
  const probeCandidates = audits
    .filter((audit) => audit.recommendedProbe && ["DECEPTIVE_WITNESS_CANDIDATE", "NON_WITNESS_OBLIGATION"].includes(audit.classification))
    .sort((a, b) => (SEVERITY_WEIGHT[b.recommendedProbe.severity] || 0) - (SEVERITY_WEIGHT[a.recommendedProbe.severity] || 0));
  return {
    schema: "ui-iceberg-deceptive-witness-audit-v0.4",
    taxonomyStatus: "bounded-public-subset",
    total: audits.length,
    counts,
    audits,
    firstDeceptionProbe: probeCandidates[0] || null,
    boundary: "Audit counts evidence-channel distortion candidates. They are not defect counts and do not replace runtime probes or scoped admission."
  };
}

export function listDeceptiveWitnessRules() {
  return Object.entries(DECEPTIVE_WITNESS_RULES).map(([id, rule]) => ({ id, ...rule }));
}
