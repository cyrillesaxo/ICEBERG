const JOURNEY_ARCHETYPES = Object.freeze({
  booking: [
    {
      id: "BOOKING_SLOT_RACE",
      category: "distributed",
      title: "Handle a selected slot becoming unavailable before confirmation",
      priority: "critical",
      signals: ["slot", "unavailable", "booking", "reservation", "conflict"],
      why: "Availability can change between selection and commit; the user needs a recoverable re-selection path."
    },
    {
      id: "BOOKING_TIMEZONE_BOUNDARY",
      category: "temporal",
      title: "Preserve the intended appointment time across user/provider timezones",
      priority: "critical",
      signals: ["timezone", "utc", "appointment", "schedule", "calendar"],
      why: "A visually correct booking can still commit the wrong authoritative instant after timezone conversion."
    },
    {
      id: "BOOKING_DOUBLE_CONFIRM",
      category: "state",
      title: "Prevent duplicate reservations when confirmation is triggered twice",
      priority: "critical",
      signals: ["duplicate", "booking", "confirm", "idempotent"],
      why: "Slow confirmation and repeated clicks can create duplicate reservations or charges."
    },
    {
      id: "BOOKING_RESCHEDULE_CONTINUITY",
      category: "recovery",
      title: "Reschedule without losing service, participant, or payment context",
      priority: "high",
      signals: ["reschedule", "change", "booking", "payment", "participant"],
      why: "Rescheduling often crosses several screens and can silently reconstruct an incomplete booking."
    }
  ],
  upload: [
    {
      id: "UPLOAD_INTERRUPTED_RESUME",
      category: "recovery",
      title: "Interrupt an upload and retry or resume without treating partial data as complete",
      priority: "critical",
      signals: ["upload", "retry", "resume", "partial", "progress"],
      why: "Large uploads frequently encounter network or navigation interruptions that happy-path tests miss."
    },
    {
      id: "UPLOAD_WRONG_FILE_RECOVERY",
      category: "validation",
      title: "Reject an invalid file and let the user recover without restarting the task",
      priority: "high",
      signals: ["file type", "size", "invalid", "upload", "replace"],
      why: "Validation failures should preserve the surrounding task context and expose a clear correction path."
    },
    {
      id: "UPLOAD_PROCESSING_DELAY",
      category: "async",
      title: "Keep the user oriented when upload succeeds but server processing is delayed",
      priority: "high",
      signals: ["processing", "pending", "upload", "status", "ready"],
      why: "Transport success and business-ready state are different phases and can diverge."
    },
    {
      id: "UPLOAD_REPLACE_IDENTITY",
      category: "identity",
      title: "Replace one file without metadata or actions remaining bound to the previous file",
      priority: "high",
      signals: ["replace", "file", "metadata", "preview", "remove"],
      why: "Preview, progress, validation, and delete controls can retain stale identity after file replacement."
    }
  ],
  search: [
    {
      id: "SEARCH_STALE_RESPONSE",
      category: "async",
      title: "Ignore results from an older query when a newer search finishes first",
      priority: "critical",
      signals: ["search", "query", "stale", "response", "latest"],
      why: "Out-of-order search responses can show results for a query the user is no longer asking."
    },
    {
      id: "SEARCH_FILTER_RETURN_CONTINUITY",
      category: "persistence",
      title: "Open a result and return with query, filters, sort, and position intact",
      priority: "high",
      signals: ["search", "filter", "sort", "back", "position"],
      why: "Losing information-foraging context forces the user to reconstruct the search journey."
    },
    {
      id: "SEARCH_ZERO_RESULTS_RECOVERY",
      category: "recovery",
      title: "Recover from zero results without a dead end",
      priority: "high",
      signals: ["zero results", "no results", "clear filter", "search"],
      why: "Zero-result states should help users relax or correct constraints instead of terminating the journey."
    },
    {
      id: "SEARCH_PAGINATION_CONTINUITY",
      category: "pagination",
      title: "Paginate or infinite-scroll without duplicate, skipped, or reordered results",
      priority: "high",
      signals: ["pagination", "cursor", "load more", "duplicate", "order"],
      why: "Changing result sets and concurrent page loads commonly break identity and ordering continuity."
    }
  ]
});

export function getJourneyArchetypeScenarios(journeyName = "") {
  const key = String(journeyName).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (JOURNEY_ARCHETYPES[key] || []).map((scenario, index) => ({
    ...scenario,
    source: "journey-archetype",
    rank: index + 1
  }));
}

export const journeyArchetypeFamilies = Object.freeze(Object.keys(JOURNEY_ARCHETYPES));
