const FAILURE_PATTERNS = Object.freeze([
  {
    id: "ASYNC_LATE_RESPONSE_OVERWRITE",
    category: "async",
    priority: "critical",
    title: "Ignore a late response that belongs to an older user intent",
    signals: ["fetch", "axios", "request", "abortcontroller", "query", "mutation"],
    riskSignals: ["async-network"],
    why: "Out-of-order responses can overwrite newer state even when every request succeeds.",
    failureMode: "stale async result becomes authoritative UI state",
    evidenceNeed: "runtime ordering/replay",
    mapsTo: ["C09_TEMPORAL_ASYNC", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "OPTIMISTIC_ROLLBACK_CONSISTENCY",
    category: "distributed",
    priority: "critical",
    title: "Rollback an optimistic update when the authoritative commit fails",
    signals: ["optimistic", "mutation", "rollback", "pending", "saving"],
    riskSignals: ["optimistic-ui"],
    why: "Optimistic success can leave the interface ahead of authoritative state after a rejection.",
    failureMode: "local success diverges from committed state",
    evidenceNeed: "failed-authority runtime replay",
    mapsTo: ["C07_INTERACTION_STATE", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "SESSION_REFRESH_RACE",
    category: "session",
    priority: "critical",
    title: "Handle concurrent session refresh and protected requests without losing the journey",
    signals: ["token", "refresh", "session", "401", "oauth", "auth"],
    riskSignals: ["auth-session"],
    why: "Concurrent expiry/refresh paths commonly create redirect loops, duplicate refreshes, or lost work.",
    failureMode: "authentication race invalidates otherwise valid task state",
    evidenceNeed: "runtime session-boundary replay",
    mapsTo: ["C09_TEMPORAL_ASYNC", "C10_AUTHORITY_PERMISSION", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "MULTI_TAB_CONFLICT",
    category: "distributed",
    priority: "high",
    title: "Resolve conflicting edits or actions across two tabs without ghost state",
    signals: ["storage", "broadcastchannel", "localstorage", "sessionstorage", "tab"],
    riskSignals: ["browser-persistence", "multi-context"],
    why: "Multiple tabs can independently mutate stale copies of the same user state.",
    failureMode: "last writer or stale tab silently corrupts visible state",
    evidenceNeed: "multi-context runtime replay",
    mapsTo: ["C11_PERSISTENCE_CONSISTENCY", "C09_TEMPORAL_ASYNC"]
  },
  {
    id: "OFFLINE_RECONNECT_REPLAY",
    category: "recovery",
    priority: "high",
    title: "Reconnect after offline work without duplicate or lost actions",
    signals: ["offline", "online", "serviceworker", "indexeddb", "queue"],
    riskSignals: ["offline-capable"],
    why: "Queued work can be dropped, replayed twice, or applied in the wrong order after reconnect.",
    failureMode: "reconnect produces duplicate, missing, or reordered effects",
    evidenceNeed: "offline/reconnect runtime replay",
    mapsTo: ["C09_TEMPORAL_ASYNC", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "EXTERNAL_REDIRECT_RETURN_STATE",
    category: "interruption",
    priority: "critical",
    title: "Return from an external redirect with the original task state and intent intact",
    signals: ["redirect", "callback", "oauth", "3ds", "payment", "verify"],
    riskSignals: ["external-redirect"],
    why: "External authentication, payment, and verification flows often reconstruct only part of the original journey.",
    failureMode: "redirect return loses task identity or resumes the wrong state",
    evidenceNeed: "leave/return runtime replay",
    mapsTo: ["C04_OWNERSHIP", "C09_TEMPORAL_ASYNC", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "FEATURE_FLAG_COHORT_ISOLATION",
    category: "experiment",
    priority: "high",
    title: "Keep feature-flag or experiment variants isolated through the full journey",
    signals: ["feature flag", "experiment", "variant", "cohort", "ab test"],
    riskSignals: ["feature-flags"],
    why: "A user can enter one variant and finish in another when cohort state changes or is read inconsistently.",
    failureMode: "cross-variant journey semantics leak",
    evidenceNeed: "variant-bound runtime replay",
    mapsTo: ["C08_SEMANTIC_MAPPING", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "LOCALE_LAYOUT_OVERFLOW",
    category: "internationalization",
    priority: "high",
    title: "Complete the journey with long translated labels and localized values",
    signals: ["i18n", "intl", "locale", "translation", "t("],
    riskSignals: ["internationalization"],
    why: "Longer labels, number formats, and date formats can hide, clip, or reorder required actions.",
    failureMode: "localized content changes usable geometry or meaning",
    evidenceNeed: "locale projection replay",
    mapsTo: ["C05_GEOMETRY", "C06_VISIBILITY_PROJECTION", "C08_SEMANTIC_MAPPING"]
  },
  {
    id: "RTL_INTERACTION_ORDER",
    category: "internationalization",
    priority: "medium",
    title: "Preserve logical navigation and control order in right-to-left layout",
    signals: ["rtl", "dir=", "direction", "arabic", "hebrew"],
    riskSignals: ["rtl"],
    why: "Visual mirroring can diverge from DOM, focus, or action ordering.",
    failureMode: "visual and interaction order disagree",
    evidenceNeed: "RTL keyboard/runtime replay",
    mapsTo: ["C03_ORDER", "C05_GEOMETRY", "C12_ACCESS_CHANNEL"]
  },
  {
    id: "TIMEZONE_BOUNDARY",
    category: "temporal",
    priority: "high",
    title: "Keep dates, expiry, and scheduling correct across timezone/day boundaries",
    signals: ["date", "time", "timezone", "utc", "intl.datetimeformat", "expires"],
    riskSignals: ["date-time"],
    why: "Local/UTC conversion and day-boundary logic frequently shifts availability, expiry, or displayed status.",
    failureMode: "same authoritative instant maps to the wrong user-visible state",
    evidenceNeed: "multi-timezone replay",
    mapsTo: ["C08_SEMANTIC_MAPPING", "C09_TEMPORAL_ASYNC"]
  },
  {
    id: "UPLOAD_CANCEL_RESUME",
    category: "recovery",
    priority: "high",
    title: "Cancel or interrupt an upload and resume/retry without corrupting the file state",
    signals: ["upload", "file", "multipart", "dropzone", "progress"],
    riskSignals: ["file-upload"],
    why: "Large or interrupted uploads create partial server/client state that happy-path tests do not exercise.",
    failureMode: "partial upload is treated as complete or cannot be safely retried",
    evidenceNeed: "interrupted upload runtime replay",
    mapsTo: ["C07_INTERACTION_STATE", "C09_TEMPORAL_ASYNC", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "VIRTUALIZED_ITEM_IDENTITY",
    category: "identity",
    priority: "critical",
    title: "Keep item identity correct while a virtualized list recycles rendered rows",
    signals: ["virtual", "react-window", "react-virtual", "virtualized", "windowing"],
    riskSignals: ["virtualized-list"],
    why: "Recycled DOM rows can retain focus, selection, or action state from a different entity.",
    failureMode: "rendered row identity diverges from semantic entity identity",
    evidenceNeed: "scroll/recycle runtime replay",
    mapsTo: ["C01_IDENTITY", "C02_CARDINALITY", "C07_INTERACTION_STATE"]
  },
  {
    id: "INFINITE_SCROLL_DUPLICATE_SKIP",
    category: "pagination",
    priority: "high",
    title: "Load additional pages without duplicate, skipped, or reordered items",
    signals: ["infinite", "cursor", "nextpage", "pagination", "intersectionobserver"],
    riskSignals: ["progressive-list"],
    why: "Concurrent pagination and changing datasets can duplicate, skip, or reorder entities.",
    failureMode: "stream continuity breaks while the UI still renders successfully",
    evidenceNeed: "multi-page runtime replay",
    mapsTo: ["C01_IDENTITY", "C02_CARDINALITY", "C03_ORDER", "C09_TEMPORAL_ASYNC"]
  },
  {
    id: "MODAL_FOCUS_RETURN",
    category: "accessibility",
    priority: "high",
    title: "Close a modal and return focus to the correct task control",
    signals: ["dialog", "modal", "drawer", "popover", "focus"],
    riskSignals: ["modal-overlay"],
    why: "A technically functional dialog can strand keyboard and assistive-technology users after closure.",
    failureMode: "task focus/context is lost after temporary overlay",
    evidenceNeed: "keyboard focus runtime replay",
    mapsTo: ["C04_OWNERSHIP", "C07_INTERACTION_STATE", "C12_ACCESS_CHANNEL"]
  },
  {
    id: "OVERLAY_OCCLUDES_PRIMARY_ACTION",
    category: "geometry",
    priority: "high",
    title: "Keep the primary action actionable when sticky banners, keyboards, or overlays are present",
    signals: ["sticky", "fixed", "overlay", "banner", "drawer", "bottom sheet"],
    riskSignals: ["occluding-overlay"],
    why: "Rendered and enabled controls can still be physically occluded or intercept events.",
    failureMode: "visible control is not actually reachable/actionable",
    evidenceNeed: "actionability/occlusion runtime replay",
    mapsTo: ["C05_GEOMETRY", "C06_VISIBILITY_PROJECTION", "C07_INTERACTION_STATE"]
  },
  {
    id: "REALTIME_OUT_OF_ORDER_EVENT",
    category: "realtime",
    priority: "high",
    title: "Apply realtime events in a way that cannot resurrect stale state",
    signals: ["websocket", "socket.io", "eventsource", "sse", "realtime", "subscription"],
    riskSignals: ["realtime"],
    why: "Delayed or duplicated events can overwrite a newer local/server state.",
    failureMode: "stale event becomes current UI truth",
    evidenceNeed: "out-of-order event replay",
    mapsTo: ["C09_TEMPORAL_ASYNC", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "CACHE_STALE_AFTER_MUTATION",
    category: "consistency",
    priority: "high",
    title: "Do not show stale cached state after a successful mutation",
    signals: ["cache", "react-query", "tanstack", "swr", "apollo", "invalidate"],
    riskSignals: ["client-cache"],
    why: "Mutation success can coexist with a stale projection if cache invalidation or reconciliation is incomplete.",
    failureMode: "authoritative mutation succeeds while UI continues to show old data",
    evidenceNeed: "mutation/invalidation runtime replay",
    mapsTo: ["C08_SEMANTIC_MAPPING", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "PERMISSION_DENIED_RECOVERY",
    category: "permission",
    priority: "high",
    title: "Recover when a browser/device permission is denied or revoked",
    signals: ["permission", "geolocation", "camera", "microphone", "clipboard", "notifications"],
    riskSignals: ["device-permission"],
    why: "Permission denial is a normal user state and must not become a dead end.",
    failureMode: "journey assumes capability authority that the user/device did not grant",
    evidenceNeed: "denied/revoked permission replay",
    mapsTo: ["C10_AUTHORITY_PERMISSION", "C12_ACCESS_CHANNEL"]
  },
  {
    id: "SEARCH_FILTER_STATE_CONTINUITY",
    category: "search",
    priority: "medium",
    title: "Preserve search/filter intent through navigation, refresh, and back/forward",
    signals: ["search", "filter", "query", "sort", "facet"],
    riskSignals: ["search-filter"],
    why: "Search journeys often lose query/filter state when users inspect an item and return.",
    failureMode: "return path resets the user's information-foraging context",
    evidenceNeed: "navigation/refresh replay",
    mapsTo: ["C03_ORDER", "C08_SEMANTIC_MAPPING", "C11_PERSISTENCE_CONSISTENCY"]
  },
  {
    id: "FORM_AUTOFILL_VALIDATION",
    category: "form",
    priority: "medium",
    title: "Accept browser/autofill values without leaving stale validation state",
    signals: ["form", "input", "autocomplete", "autofill", "validation"],
    riskSignals: ["complex-form"],
    why: "Autofill can update values outside the event sequence assumed by custom validation code.",
    failureMode: "valid visible values coexist with invalid internal form state",
    evidenceNeed: "browser autofill runtime replay",
    mapsTo: ["C07_INTERACTION_STATE", "C08_SEMANTIC_MAPPING"]
  },
  {
    id: "UNSAVED_DRAFT_NAVIGATION",
    category: "persistence",
    priority: "high",
    title: "Navigate away and return without silently losing an unsaved draft",
    signals: ["draft", "editor", "autosave", "form", "beforeunload", "dirty"],
    riskSignals: ["draft-editing"],
    why: "Long-form work is vulnerable to accidental navigation, refresh, and session boundaries.",
    failureMode: "user work disappears without recovery or informed warning",
    evidenceNeed: "navigation/interruption replay",
    mapsTo: ["C09_TEMPORAL_ASYNC", "C11_PERSISTENCE_CONSISTENCY"]
  }
]);

const WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });

export function selectFailurePatterns(riskSignals = [], options = {}) {
  const active = new Set((riskSignals || []).map((signal) => typeof signal === "string" ? signal : signal.id));
  const limit = Number.isFinite(options.limit) ? options.limit : 6;
  return FAILURE_PATTERNS
    .map((pattern) => ({
      ...pattern,
      matchedRiskSignals: pattern.riskSignals.filter((signal) => active.has(signal)),
      source: "failure-pattern-library",
      provenance: "generalized-industry-pattern",
      proofBoundary: "Pattern applicability is a test hypothesis. It is not evidence that the defect exists in this repository."
    }))
    .filter((pattern) => pattern.matchedRiskSignals.length > 0)
    .sort((a, b) => {
      const matchDelta = b.matchedRiskSignals.length - a.matchedRiskSignals.length;
      if (matchDelta) return matchDelta;
      return (WEIGHT[b.priority] || 0) - (WEIGHT[a.priority] || 0);
    })
    .slice(0, limit);
}

export function listFailurePatterns() {
  return FAILURE_PATTERNS.map((pattern) => ({ ...pattern }));
}
