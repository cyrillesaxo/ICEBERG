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

Even `linked-pass` is only a **nominal witness candidate** until the evidence channel is checked against the requested claim scope.

### 5. Reproduced defect or invariant witness

A discriminating probe demonstrates the targeted failure or demonstrates the repaired invariant under the tested conditions.

This is stronger than source matching but still bounded by context, data, viewport, role, locale, timing, and evidence channel.

## Witness, deceptive witness, and antiwitness

A **witness** supports a specific claim under stated conditions.

A **deceptive witness candidate** appears to support a claim, often through a green result, but its evidence channel licenses a weaker statement than the claim being inferred.

An **antiwitness** contradicts or narrows the claim under stated conditions.

Do not collapse these states.

Examples:

- Witness: a real linked Playwright leave-and-return probe asserts that the persisted draft survives the tested OTP return boundary.
- Deceptive witness candidate: a linked green test uses a mocked OTP callback while the claim concerns real authority continuity.
- Antiwitness: the real return probe reproduces cart-state loss.
- Antiwitness/narrowing evidence: retry-dependent execution contradicts a claim of deterministic stability.

## Bounded deceptive-witness classifications

v0.4 uses:

- `CLEAN_WITNESS`
- `WEAKENED_WITNESS`
- `DECEPTIVE_WITNESS_CANDIDATE`
- `NON_WITNESS_OBLIGATION`
- `ANTIWITNESS`
- `UNKNOWN_WITNESS`

The executable classifier covers only the bounded public subset derived from current test-evidence-risk detectors. The PackSpec validation receipt references a larger 72-item research taxonomy, but the full normative definitions are not yet vendored. Never claim full 72-rule execution from the current repository.

Current executable distortion families include:

| Evidence risk | Distortion | Typical claim weakened |
| --- | --- | --- |
| fixed wait | `TEMPORAL_ASSUMPTION` | readiness / deterministic stability |
| forced action | `ACTIONABILITY_BYPASS` | natural user actionability |
| skipped test | `NON_EXECUTION_PRESENTED_AS_COVERAGE` | runtime/suite completeness |
| focused test | `SUITE_EXCLUSION` | full-suite evidence |
| retry / flaky | `RETRY_LAUNDERING` | deterministic stability |
| network mock | `AUTHORITY_SUBSTITUTION` | real authority / production path |
| visual-only oracle | `ORACLE_SCOPE_NARROWING` | semantic/task/accessibility correctness |
| index-based target | `SEMANTIC_IDENTITY_DRIFT` | stable target identity |
| soft/failure-tolerant assertion pattern | `ASSERTION_FAILURE_MASKING` | assertion/run integrity |

These patterns are not product defects. They are reasons to narrow or withhold claim licensing until a discriminating probe resolves the ambiguity.

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

## The signature loop

When apparent support is distorted, use:

```text
apparent witness
  -> deceptive-witness check
  -> semantic entropy
  -> First Bite
  -> discriminating probe
  -> witness / antiwitness
  -> scoped admission
```

If the deceptive witness refers to the same scenario as the current top gap, prefer the distortion-specific First Bite probe before admitting the apparent support.

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
- a nominal witness has a claim-blocking evidence distortion;
- several candidate selectors could refer to different entities;
- a regression's affected journeys are uncertain.

Reduce entropy by adding discriminating probes, explicit scenario identity, authoritative state checks, and cross-context replay. Do not reduce entropy by simply choosing the most convenient explanation.

## TERM and reactivation

A previously verified UI scenario can become stale after change.

Treat evidence as temporally scoped. When a change touches a component, shared primitive, route, state store, persistence mechanism, authentication layer, responsive layout, or other dependency relevant to a prior witness, reactivate the affected scenario for replay.

Do not assume historical PASS remains current after a meaningful dependency change.

## Admission

Admission is the decision about whether available evidence is sufficient for a specific claim.

An admission decision must name its scope and must filter nominally strong witnesses through the deceptive-witness check when relevant evidence risks are known.

Rules:

- a clean witness can license its requested scope;
- a weakened witness can license the requested scope when its known distortions do not block that scope;
- a deceptive-witness candidate cannot license the blocked scope by itself;
- if every nominal strong witness is deceptive for the requested scope, keep the verdict `INCONCLUSIVE`;
- a clean independent witness can still license the scope while deceptive witnesses remain explicit;
- a strong antiwitness yields `REJECTED` for the evaluated claim/scope.

Good:

> Admitted for the tested desktop checkout leave-and-return scenario: explicit linked Playwright execution passed without retry, the evidence channel did not block the requested scope, and the persisted draft assertion held.

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
| Linked clean pass | linked assertions passed; then inspect channel vs claim | all UX/accessibility/backend outcomes are correct |
| Linked pass + claim-blocking deceptive distortion | narrower channel claim may hold | requested broader claim is admitted |
| Linked flaky pass | scenario showed retry-dependent success | stable PASS |
| Linked fail | execution failed | root cause is proven without diagnosis |
| Reproduced targeted probe | failure/invariant observed under tested conditions | universal product state established |

## Evidence-boundary questions

Before accepting any strong conclusion, ask internally:

1. What exact user journey claim is being made?
2. Which scenario ID or invariant does the evidence address?
3. Is the evidence static, runtime, human-observed, accessibility-specific, visual, backend-authoritative, or mixed?
4. What conditions were actually exercised?
5. Does the evidence channel contain a deceptive-witness distortion for this claim scope?
6. Is there conflicting evidence or an antiwitness?
7. Is the witness still fresh after recent changes?
8. What remains unknown?

The purpose is not to make every result inconclusive. It is to make each conclusion exactly as strong as its evidence.
