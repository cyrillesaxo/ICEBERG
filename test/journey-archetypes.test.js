import test from "node:test";
import assert from "node:assert/strict";
import { generateScenarios } from "../packages/core/src/index.js";
import { getJourneyArchetypeScenarios, journeyArchetypeFamilies } from "../packages/scenarios/src/journey-archetypes.js";

test("booking archetype covers concurrency, time, idempotency, and rescheduling", () => {
  const ids = new Set(getJourneyArchetypeScenarios("booking").map((scenario) => scenario.id));
  assert.ok(ids.has("BOOKING_SLOT_RACE"));
  assert.ok(ids.has("BOOKING_TIMEZONE_BOUNDARY"));
  assert.ok(ids.has("BOOKING_DOUBLE_CONFIRM"));
  assert.ok(ids.has("BOOKING_RESCHEDULE_CONTINUITY"));
});

test("upload archetype covers interruption, validation, processing, and identity", () => {
  const ids = new Set(getJourneyArchetypeScenarios("upload").map((scenario) => scenario.id));
  assert.ok(ids.has("UPLOAD_INTERRUPTED_RESUME"));
  assert.ok(ids.has("UPLOAD_WRONG_FILE_RECOVERY"));
  assert.ok(ids.has("UPLOAD_PROCESSING_DELAY"));
  assert.ok(ids.has("UPLOAD_REPLACE_IDENTITY"));
});

test("search archetype covers stale results, return continuity, zero-state recovery, and pagination", () => {
  const ids = new Set(getJourneyArchetypeScenarios("search").map((scenario) => scenario.id));
  assert.ok(ids.has("SEARCH_STALE_RESPONSE"));
  assert.ok(ids.has("SEARCH_FILTER_RETURN_CONTINUITY"));
  assert.ok(ids.has("SEARCH_ZERO_RESULTS_RECOVERY"));
  assert.ok(ids.has("SEARCH_PAGINATION_CONTINUITY"));
});

test("archetype scenarios are part of generated plans and respect the global limit", () => {
  assert.deepEqual(new Set(journeyArchetypeFamilies), new Set(["booking", "upload", "search"]));
  const plan = generateScenarios("booking", { limit: 5 });
  assert.equal(plan.scenarios.length, 5);
  assert.ok(plan.scenarios.some((scenario) => scenario.source === "journey-archetype"));
});
