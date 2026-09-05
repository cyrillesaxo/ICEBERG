# UI Iceberg evidence model

Read this reference whenever the task involves confidence, proof, runtime verification, PackSpec concepts, deceptive-green evidence, or a claim that a UI is fixed/correct.

## The core distinction

UI Iceberg is an evidence compiler, not a confidence generator.

A repository scan discovers signals. Signals select hypotheses. Hypotheses require probes. Probes generate evidence. Evidence licenses only the conclusion it directly supports.

```text
signal -> hypothesis -> probe -> evidence -> claim
```

Each arrow can fail. Do not skip an arrow.

## Evidence ladder

Use the narrowest applicable level.

### 0. Unknown

No relevant evidence is available.

Allowed language: `unverified`, `unknown`, `not established`.

Forbidden language: `passes`, `covered`, `safe`, `correct`.

### 1. Implementation signal

Repository code contains a pressure such as async requests, persistence, redirects, feature flags, overlays, uploads, permissions, or realtime state.

Allowed claim: the scenario is relevant enough to test.

Forbidden claim: the corresponding defect exists.

### 2. Static candidate evidence

Existing test source appears to mention or exercise part of the scenario.

Allowed claim: candidate evidence exists.

Forbidden claim: runtime coverage is established.

### 3. Partial evidence

The scenario is represented incompletely, weakly, or through an evidence channel that does not establish the full invariant.

Allowed claim: some evidence exists, but the scenario remains open.

### 4. Explicit runtime evidence

A stable scenario ID is linked to an executed test.

- `linked-pass`: the linked test ran and its assertions passed without retry.
- `linked-flaky`: the linked test only passed after retry.
- `linked-fail`: the linked execution failed.

Even `linked-pass` licenses only what the test actually asserts.

### 5. Reproduced defect or invariant witness

A discriminating probe demonstrates the targeted failure or demonstrates the repaired invariant under the tested conditions.

This is stronger than source matching but still bounded by context, data, viewport, role, locale, timing, and evidence channel.

## Witnesses and antiwitnesses

A **witness** is evidence that supports a specific claim under stated conditions.

An **antiwitness** is evidence that contradicts or narrows that claim.

Examples:

- Witness: a linked Playwright test demonstrates that a checkout draft survives a modeled OTP leave-and-return sequence.
- Antiwitness: the same scenario fails on mobile Safari or after a session refresh.
- Antiwitness: a test passes only after retry, narrowing a claim of deterministic stability.

Do not delete or average away antiwitnesses merely to produce a clean PASS.

## Deceptive-green evidence

A green test can overstate what was observed when its evidence channel is weak or distorted.

Repository evidence-risk signals currently include patterns such as:

- fixed waits;
- forced actions;
- skipped or focused tests;
- retries;
- network mocks;
- visual-only oracles;
- index-based targets;
- soft-assertion configurations.

These patterns are not defects in the product. They are reasons to reduce the claim license of the test result.

Examples:

```text
forced click + green result
!=
control was naturally actionable for the user
```

```text
network mock + green result
!=
production authority/recovery path was exercised
```

```text
screenshot match + green result
!=
keyboard focus, semantic target identity, or task completion was correct
```

## Runtime candidate versus explicit linkage

Lexical similarity between a test title and a scenario is useful for discovery but is weaker than an explicit stable scenario marker.

Prefer:

```text
[ICEBERG:SCENARIO_ID]
```

over inferred title matching when claiming scenario coverage.

## Semantic entropy

Use semantic entropy as a qualitative indicator of unresolved interpretation, not as a decorative score.

Entropy rises when multiple materially different explanations remain plausible, for example:

- the same visual control maps to different semantic targets across pages;
- a route transition can restore more than one incompatible state;
- a test passes under one mocked authority path but the real authority behavior is unknown;
- several candidate selectors could refer to different entities;
- a regression's affected journeys are uncertain.

Reduce entropy by adding discriminating probes, explicit scenario identity, authoritative state checks, and cross-context replay. Do not reduce entropy by simply choosing the most convenient explanation.

## TERM and reactivation

A previously verified UI scenario can become stale after change.

Treat evidence as temporally scoped. When a change touches a component, shared primitive, route, state store, persistence mechanism, authentication layer, responsive layout, or other dependency relevant to a prior witness, reactivate the affected scenario for replay.

Do not assume historical PASS remains current after a meaningful dependency change.

## Admission

Admission is the decision about whether available evidence is sufficient for a specific claim.

An admission decision must name its scope.

Good:

> Admitted for the tested desktop checkout leave-and-return scenario: explicit linked Playwright execution passed without retry and the persisted draft assertion held.

Bad:

> Checkout is fully correct.

When evidence is insufficient, prefer `INCONCLUSIVE`/`UNVERIFIED` over manufactured confidence.

## Claim-licensing table

| Evidence | Can say | Must not say |
| --- | --- | --- |
| Repository pressure | scenario is relevant | defect exists |
| Static lexical match | candidate evidence | runtime covered |
| Partial test | some behavior represented | full invariant established |
| Runtime candidate | relevant test executed | scenario explicitly covered |
| Linked clean pass | linked assertions passed | all UX/accessibility/backend outcomes are correct |
| Linked flaky pass | scenario showed retry-dependent success | stable PASS |
| Linked fail | execution failed | root cause is proven without diagnosis |
| Reproduced targeted probe | failure/invariant observed under tested conditions | universal product state established |

## Evidence-boundary questions

Before accepting any strong conclusion, ask internally:

1. What exact user journey claim is being made?
2. Which scenario ID or invariant does the evidence address?
3. Is the evidence static, runtime, human-observed, accessibility-specific, visual, backend-authoritative, or mixed?
4. What conditions were actually exercised?
5. Is there conflicting evidence?
6. Is the witness still fresh after recent changes?
7. What remains unknown?

The purpose is not to make every result inconclusive. It is to make each conclusion exactly as strong as its evidence.
