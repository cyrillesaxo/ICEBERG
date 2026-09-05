const BASE_SCENARIOS = Object.freeze([
  {
    id: "CORE_SUCCESS",
    category: "core",
    title: "Complete the primary journey successfully",
    priority: "critical",
    signals: ["success", "complete", "confirmation", "dashboard"],
    why: "Establishes the core conversion path before testing edge conditions."
  },
  {
    id: "VALIDATION_RECOVERY",
    category: "validation",
    title: "Correct invalid input and continue without restarting",
    priority: "high",
    signals: ["validation", "invalid", "required", "error"],
    why: "Tests whether validation errors are actionable and recoverable."
  },
  {
    id: "REQUEST_FAILURE_RETRY",
    category: "recovery",
    title: "Recover after a request fails and retry successfully",
    priority: "critical",
    signals: ["retry", "failed", "failure", "network", "error"],
    why: "A happy-path test does not establish recovery after backend or network failure."
  },
  {
    id: "SLOW_RESPONSE_FEEDBACK",
    category: "state",
    title: "Stay oriented during a slow response",
    priority: "high",
    signals: ["loading", "pending", "spinner", "slow"],
    why: "Slow operations expose missing loading, duplicate-action, and feedback states."
  },
  {
    id: "DOUBLE_SUBMIT",
    category: "state",
    title: "Prevent duplicate effects when the primary action is triggered twice",
    priority: "critical",
    signals: ["double", "duplicate", "idempotent", "disabled"],
    why: "Duplicate submission can create duplicate orders, accounts, bookings, or writes."
  },
  {
    id: "REFRESH_PRESERVES_PROGRESS",
    category: "interruption",
    title: "Refresh mid-journey without losing recoverable progress",
    priority: "high",
    signals: ["refresh", "reload", "persist", "restore"],
    why: "State that exists only in memory can disappear even when every screen works independently."
  },
  {
    id: "BACK_FORWARD_CONTINUITY",
    category: "interruption",
    title: "Use browser back/forward without corrupting journey state",
    priority: "high",
    signals: ["back", "forward", "history", "navigation"],
    why: "Navigation transitions are common hidden failure edges."
  },
  {
    id: "LEAVE_AND_RETURN",
    category: "interruption",
    title: "Leave the app and return without losing task context",
    priority: "critical",
    signals: ["resume", "return", "visibility", "background", "interrupt"],
    why: "External steps such as OTP, email verification, banking, or document lookup often interrupt a critical journey."
  },
  {
    id: "SESSION_EXPIRY_RECOVERY",
    category: "session",
    title: "Recover when the session expires during the journey",
    priority: "high",
    signals: ["session", "expired", "login", "reauth"],
    why: "Session boundaries frequently force users to reconstruct work unless explicitly handled."
  },
  {
    id: "MOBILE_PRIMARY_ACTION",
    category: "responsive",
    title: "Keep the primary action reachable on a small mobile viewport",
    priority: "high",
    signals: ["mobile", "viewport", "responsive", "keyboard"],
    why: "Responsive layouts can preserve rendering while hiding or obstructing the next required action."
  },
  {
    id: "ZOOM_TEXT_SCALE",
    category: "accessibility",
    title: "Complete the journey with increased zoom or text size",
    priority: "high",
    signals: ["zoom", "text size", "font", "scale"],
    why: "Layout continuity under text scaling is not established by desktop happy-path coverage."
  },
  {
    id: "KEYBOARD_ONLY",
    category: "accessibility",
    title: "Complete the journey using keyboard interaction only",
    priority: "high",
    signals: ["keyboard", "tab", "focus", "enter"],
    why: "Element presence does not establish operability through the keyboard access channel."
  },
  {
    id: "STATE_RESTORE_AFTER_ERROR",
    category: "recovery",
    title: "Preserve valid user input after an error",
    priority: "high",
    signals: ["preserve", "restore", "form", "draft", "error"],
    why: "Forcing users to re-enter valid data creates avoidable rework and drop-off risk."
  },
  {
    id: "EMPTY_OR_ZERO_STATE",
    category: "state",
    title: "Handle the empty or zero-data state without a dead end",
    priority: "medium",
    signals: ["empty", "zero", "no data", "none"],
    why: "Production data cardinality often includes states absent from seeded test fixtures."
  }
]);

const DOMAIN_SCENARIOS = Object.freeze({
  checkout: [
    {
      id: "PAYMENT_DECLINED_RETRY",
      category: "recovery",
      title: "Payment is declined, the user corrects the issue, and retries",
      priority: "critical",
      signals: ["declined", "payment", "retry", "card"],
      why: "Payment recovery is part of the conversion journey, not a separate page-level feature."
    },
    {
      id: "PAYMENT_SUCCESS_CALLBACK_DELAY",
      category: "distributed",
      title: "Payment succeeds but confirmation or entitlement is delayed",
      priority: "critical",
      signals: ["callback", "webhook", "confirmation", "entitlement", "pending"],
      why: "Distributed systems can disagree after the user has already paid."
    },
    {
      id: "OTP_INTERRUPT_RETURN",
      category: "interruption",
      title: "Leave checkout for OTP or bank verification and return with state intact",
      priority: "critical",
      signals: ["otp", "3ds", "verification", "return", "resume"],
      why: "External verification is a high-risk task-stiction edge."
    },
    {
      id: "DUPLICATE_ORDER_AFTER_REFRESH",
      category: "distributed",
      title: "Refresh after payment success without creating a duplicate order",
      priority: "critical",
      signals: ["duplicate order", "idempotency", "refresh", "payment"],
      why: "A successful UI transition can still conceal duplicate server-side effects."
    }
  ],
  signup: [
    {
      id: "EMAIL_VERIFY_RETURN",
      category: "interruption",
      title: "Leave signup to verify email and return with onboarding progress intact",
      priority: "critical",
      signals: ["verify", "email", "return", "onboarding"],
      why: "Email verification is an external interruption between two parts of one journey."
    },
    {
      id: "EXISTING_ACCOUNT_RECOVERY",
      category: "recovery",
      title: "Handle an already-registered email without trapping the user",
      priority: "high",
      signals: ["already", "existing", "sign in", "account"],
      why: "Identity conflicts should lead to a recoverable next action."
    }
  ],
  login: [
    {
      id: "MFA_INTERRUPT_RETURN",
      category: "interruption",
      title: "Complete MFA after switching apps and return to the same login attempt",
      priority: "critical",
      signals: ["mfa", "otp", "return", "login"],
      why: "Authentication commonly crosses device/app boundaries."
    },
    {
      id: "LOCKOUT_RECOVERY",
      category: "recovery",
      title: "Recover from lockout or repeated failed authentication",
      priority: "high",
      signals: ["locked", "attempts", "recover", "password"],
      why: "Failure states must expose an authorized recovery path."
    }
  ],
  password_reset: [
    {
      id: "RESET_LINK_EXPIRED",
      category: "recovery",
      title: "Expired reset link leads to a clear recovery path",
      priority: "high",
      signals: ["expired", "reset", "link", "new link"],
      why: "Time-bound links create a predictable temporal failure state."
    },
    {
      id: "RESET_RETURN_TO_LOGIN",
      category: "core",
      title: "After reset, the user can return to sign in and complete authentication",
      priority: "critical",
      signals: ["reset", "login", "sign in", "password"],
      why: "Reset success is not the user goal if authentication remains blocked."
    }
  ],
  subscription_cancel: [
    {
      id: "DECLINE_RETENTION_CONTINUE",
      category: "agency",
      title: "Decline a retention offer and continue cancellation without an artificial detour",
      priority: "critical",
      signals: ["decline", "retention", "cancel", "continue"],
      why: "Retention UI must not silently convert a cancellation goal into an obstacle course."
    },
    {
      id: "CANCEL_STATUS_PERSISTS",
      category: "distributed",
      title: "Cancellation status remains correct after refresh and re-login",
      priority: "critical",
      signals: ["cancelled", "status", "refresh", "login"],
      why: "A confirmation screen does not prove the authoritative subscription state changed."
    },
    {
      id: "AGENCY_PATH_ASYMMETRY",
      category: "agency",
      title: "Cancellation is not materially harder than keeping the subscription",
      priority: "high",
      signals: ["asymmetry", "cancel", "keep", "steps"],
      why: "Equal technical functionality can still hide materially asymmetric user agency."
    }
  ]
});

const PRIORITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });

export function normalizeJourneyName(input = "") {
  const value = String(input).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (/checkout|payment|purchase|order/.test(value)) return "checkout";
  if (/sign.?up|register|registration|onboard/.test(value)) return "signup";
  if (/password.*reset|forgot.*password|reset.*password/.test(value)) return "password_reset";
  if (/cancel.*subscription|subscription.*cancel|unsubscribe/.test(value)) return "subscription_cancel";
  if (/login|log.?in|sign.?in|authentication/.test(value)) return "login";
  return value || "generic";
}

export function generateScenarioCatalog(journeyName, options = {}) {
  const normalized = normalizeJourneyName(journeyName);
  const domain = DOMAIN_SCENARIOS[normalized] || [];
  const scenarios = [...domain, ...BASE_SCENARIOS].map((scenario, index) => ({
    ...scenario,
    journey: normalized,
    rank: index + 1,
    source: domain.includes(scenario) ? "journey-profile" : "ui-iceberg-core"
  }));

  const seen = new Set();
  const deduped = scenarios.filter((scenario) => {
    if (seen.has(scenario.id)) return false;
    seen.add(scenario.id);
    return true;
  });

  deduped.sort((a, b) => {
    const priority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    return priority || a.rank - b.rank;
  });

  const limit = Number.isFinite(options.limit) ? options.limit : null;
  return limit ? deduped.slice(0, limit) : deduped;
}

export function priorityScore(priority) {
  return PRIORITY_WEIGHT[priority] || 0;
}

export const scenarioFamilies = Object.freeze(Object.keys(DOMAIN_SCENARIOS));
