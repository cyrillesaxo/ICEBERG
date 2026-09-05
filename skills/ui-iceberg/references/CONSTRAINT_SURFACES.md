# UI Iceberg constraint and primitive surfaces

Use this reference when translating repository/UI observations into hidden constraints, scenario hypotheses, PackSpec concepts, or discriminating probes.

## Important scope note

The bootstrap repository anchors the product to UI Iceberg PackSpec v0.7.2, but the full normative YAML/schema bundle is not vendored in this branch yet. Do **not** invent normative G1-G12, UI-12, UX-12, matrix, deceptive-witness, metric, or quality-gate definitions that are absent from the repository.

Use the concrete constraint IDs and generalized mature-testing primitives that are present in the code/catalog, and treat deeper PackSpec labels as references to the canonical research artifact rather than reconstructing them from memory.

## Product-to-compiler translation

| Product language | Internal compiler language |
| --- | --- |
| User Journey | ContextOfUse + TaskGraph |
| Journey step | task node / transition |
| Scenario | pressure + state + invariant probe |
| Coverage gap | MissSet / Coverage Frontier gap |
| Test next | First Bite |
| Evidence | Witness |
| Conflicting evidence | Antiwitness |
| Verify | replay + admission |
| Regression impact | TERM + ReactivationImpactGraph |

The skill should default to product language with users and use compiler terms only where they sharpen the analysis.

## Concrete C01-C12 constraint surfaces used by the current failure-pattern library

These IDs appear in repository mappings and are safe to use as internal tags.

### C01 — Identity

Question: Is the rendered/interacted entity still the same semantic entity through recycling, navigation, filtering, or mutation?

Typical probes:

- virtualized row recycling;
- list selection after reorder;
- entity-specific action after search/filter changes;
- stale DOM target after data refresh.

### C02 — Cardinality

Question: Are the expected number of entities/actions represented without duplicates, omissions, or accidental collapse?

Typical probes:

- infinite scrolling across page boundaries;
- duplicate/order creation;
- list pagination;
- recycled rows.

### C03 — Order

Question: Is logical/task order preserved across visual, DOM, focus, sorting, pagination, and RTL projections?

Typical probes:

- keyboard traversal;
- RTL layout;
- list append/reorder;
- search result continuity.

### C04 — Ownership

Question: Does temporary UI or a cross-boundary transition return control/context to the correct task owner?

Typical probes:

- modal close and focus return;
- external redirect return;
- nested overlay ownership;
- resumed task identity.

### C05 — Geometry

Question: Is required UI physically reachable and correctly laid out in the tested projection?

Typical probes:

- small mobile viewport;
- virtual keyboard open;
- sticky/fixed overlays;
- long localized labels;
- zoom/text scaling.

### C06 — Visibility / projection

Question: Is required state/action not only present in the DOM but actually perceivable in the relevant projection?

Typical probes:

- clipping/overflow;
- occlusion;
- hidden mobile action;
- dynamic layout;
- text scaling.

### C07 — Interaction state

Question: Is the control in the correct interactive state, and can the user act without test-only coercion?

Typical probes:

- enabled/disabled transitions;
- duplicate-submit guard;
- optimistic pending state;
- autofill validation;
- focus/actionability.

### C08 — Semantic mapping

Question: Does the UI representation/selector still map to the intended user/task meaning?

Typical probes:

- semantic locator continuity;
- localized labels;
- feature variants;
- stale cache projections;
- autofill-visible versus internal state.

### C09 — Temporal / async

Question: Does behavior remain correct under reordering, delay, interruption, retry, expiry, and boundary timing?

Typical probes:

- late responses;
- session refresh race;
- websocket/SSE event order;
- timezone boundaries;
- interrupted upload;
- offline replay.

### C10 — Authority / permission

Question: Is the UI action/state backed by the correct authority and permission boundary?

Typical probes:

- authentication/session state;
- browser/device permission denial;
- authorization change;
- authoritative commit failure.

### C11 — Persistence / consistency

Question: Does state survive or reconcile correctly across refresh, navigation, tabs, redirects, caches, reconnects, and authority commits?

Typical probes:

- refresh/back/forward;
- leave-and-return;
- multi-tab edits;
- draft persistence;
- cache invalidation;
- optimistic rollback.

### C12 — Access channel

Question: Can the task be completed through the relevant interaction/access channel rather than merely rendered?

Typical probes:

- keyboard-only;
- focus restoration;
- denied device capability with alternative path;
- assistive interaction checks.

## Mature-testing primitives generalized in PackSpec v0.7.2

The repository includes a vendor-neutral catalog. Use the generalized primitive, not the vendor implementation, as the reasoning unit.

### CP01 — InteractionReadinessVector

Inspired by mature actionability/auto-waiting practice.

Use to distinguish `element exists` from `element is uniquely resolvable, visible/stable, event-receiving, enabled/editable as required`.

Does **not** establish task meaning, user intent, or cognitive ease.

### CP02 — SemanticTargetIdentity

Use to ensure selectors/controls still refer to the same user/task entity across changes.

Does **not** establish semantic equivalence solely because a selector resolves.

### CP03 — StateManifest + StateMissSet

Use to enumerate supported/required UI states and keep undeclared required states visible as coverage debt.

Does **not** prove completeness of undeclared states.

### CP04 — SurfaceInteractionCoverage

Use for observed/tested interactive surface coverage.

Do not promote surface coverage to task, semantic, cognitive, or human convergence.

### CP05 — ProbabilisticStabilityState

Use to preserve retry/attempt history and distinguish flaky success from stable success.

Does not establish root cause of flakiness.

### CP06 — ReactivationImpactGraph

Use to select which prior evidence must be replayed after code/config/dependency change.

When dependency impact is uncertain or global, expand conservatively rather than pruning optimistically.

### CP07 — VisualOracleRegionPolicy

Use to scope visual comparison regions, dynamic/ignored regions, semantic owner, authority, expiry, and residual risk.

Visual similarity alone does not establish semantic correctness.

### CP08 — BehavioralFrictionWitness

Use observed field signals such as dead/rage clicks or cursor thrashing as hypothesis-promoting evidence.

Do not infer user intent or causal root cause from the signal alone.

### CP09 — LocatorSubstitutionProposal

Use when a test runner or agent proposes replacing a locator/target.

Require independent semantic-identity support before accepting the substitution as equivalent.

### CP10 — TestMutationReceipt + BaselineAuthorityReceipt

Use to make test/baseline/locator mutation auditable and attributable.

A mutation record does not itself authorize a semantic change.

### CP11 — CausalReplayTrace

Use timeline/snapshot/network/runtime traces to reconstruct a scenario.

Trace detail supports diagnosis but does not establish causality by itself.

## Scenario-pressure library currently implemented

Repository-aware hardening includes bounded hypotheses for pressures such as:

- async late-response overwrite;
- optimistic rollback inconsistency;
- session-refresh races;
- multi-tab conflict;
- offline/reconnect replay;
- external redirect return-state loss;
- feature-flag cohort leakage;
- localization overflow;
- RTL interaction-order mismatch;
- timezone boundary errors;
- upload cancel/resume;
- virtualized item-identity errors;
- infinite-scroll duplicate/skip;
- modal focus return;
- overlay occlusion;
- realtime out-of-order events;
- stale cache after mutation;
- permission-denied recovery;
- search/filter continuity;
- autofill validation mismatch;
- unsaved-draft navigation.

Default repository-specific hardening should remain bounded rather than expanding every possible pressure into a checklist.

## Human-journey boundary

Technical operability is not the same as human convergence.

Example pattern:

```text
explanation control exists and activates
!=
learner discovers the control, understands it, and resumes reading without losing context
```

For cognitive, usability, accessibility-completeness, agency, or real-user success claims, require evidence licensed for that human/task claim. Browser automation can contribute evidence but cannot silently substitute for the missing human channel.

## Matrix use

When the task is complex, form only the matrices needed to discriminate uncertainty. Useful dimensions include:

- journey step × state;
- journey step × pressure;
- viewport × actionability;
- role/permission × action;
- locale × geometry/semantic mapping;
- scenario × evidence channel;
- change/dependency × reactivation requirement;
- witness × antiwitness;
- semantic target × page/viewport/state.

Do not create a matrix merely because PackSpec contains matrix views. Each matrix must answer a concrete coverage or causal question.

## Probe design rule

A good probe changes one or a small number of relevant conditions and has an observable invariant.

Example:

```text
condition: leave checkout for OTP and return
invariant: cart + payment draft + intended step remain intact
observable: stable scenario marker + state assertions
```

A weak probe only exercises activity:

```text
click around and confirm no exception occurred
```

Prefer probes that can falsify the intended invariant.
