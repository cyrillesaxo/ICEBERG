# Deceptive evidence and claim challenge

UI Iceberg v0.5 separates three things that must not be collapsed:

1. **the five canonical deception mechanisms** — structural ways true-looking evidence can do an illegal job;
2. **detector-specific evidence risks/distortions** — concrete patterns the repository scanner can currently observe;
3. **the 12 semantic types** — internal coordinates for where meaning, authority, scope, timing, or relationships can move.

The default user-facing output does not expose this vocabulary. It translates the result into practical reasons and a best next check.

## Five canonical mechanisms

The Deceptive Witness research line defines five mechanisms:

| Mechanism | Meaning | Structural check |
| --- | --- | --- |
| `UNTRACEABLE_DEPTH` | shallow evidence posing as deep | Can the conclusion be followed to the source/runtime state it claims to represent? |
| `INFLATED_SCOPE` | narrow evidence stretched broad | Is the conclusion broader than the conditions actually checked? |
| `LOADED_CHANNEL` | the medium/presentation doing evidentiary work | Does the meaning survive when presentation/status styling is stripped away? |
| `LOADED_FRAME` | framing steering the conclusion | Does the result survive neutral wording/defaults/comparison? |
| `UNSTATED_IMPLICATION` | conclusions entering through what is unsaid | Which important postconditions are being inferred without explicit evidence? |

A mechanism is **not** cleared merely because no detector fired. Its state remains `unknown` until an explicit check provides evidence.

These five mechanisms are distinct from the research program's five evidence-system failures. Do not treat the two lists as aliases.

## Detector-specific public subset

The current scanner detects a bounded public subset of concrete test-evidence risks:

| Evidence risk | Current distortion label | Canonical mechanisms it can trigger |
| --- | --- | --- |
| `FIXED_WAIT` | `TEMPORAL_ASSUMPTION` | Untraceable Depth, Inflated Scope |
| `FORCED_ACTION` | `ACTIONABILITY_BYPASS` | Inflated Scope, Unstated Implication |
| `SKIPPED_TEST` | `NON_EXECUTION_PRESENTED_AS_COVERAGE` | Inflated Scope |
| `FOCUSED_TEST` | `SUITE_EXCLUSION` | Inflated Scope |
| `RETRY_ENABLED` / `linked-flaky` | `RETRY_LAUNDERING` | Inflated Scope |
| `NETWORK_MOCK` | `AUTHORITY_SUBSTITUTION` | Untraceable Depth, Inflated Scope |
| `VISUAL_ONLY_ORACLE` | `ORACLE_SCOPE_NARROWING` | Loaded Channel, Unstated Implication |
| `INDEX_BASED_TARGET` | `SEMANTIC_IDENTITY_DRIFT` | Untraceable Depth, Unstated Implication |
| `DISABLED_ASSERTION_FAILURE` | `ASSERTION_FAILURE_MASKING` | Loaded Channel, Unstated Implication |

The detector label is a concrete implementation clue. The five mechanisms are the more general structural challenge coordinates.

The repository does not claim to execute missing normative research definitions that are not vendored.

## 12 semantic types

Internally, a claim can be projected onto the canonical G1–G12 taxonomy:

```text
G1 Label
G2 Node
G3 Boundary
G4 Edge
G5 Operation
G6 Perspective
G7 Granularity
G8 Evidence
G9 Prerequisite
G10 Conflict
G11 Temporal
G12 Authority
```

The taxonomy is selective, not a flat user checklist. The active types depend on the claim, scenario, evidence risks, and explicit semantic metadata.

## Probe mixing

The claim challenge engine builds a matrix conceptually equivalent to:

```text
probe candidate
×
five deception mechanisms
×
active semantic types
```

A single probe can challenge several mechanisms and semantic coordinates. That is preferred when it gives a better information gain/cost tradeoff than running isolated checks.

Example:

```text
real delayed payment return
+ explicit cart/payment/state assertions
```

can simultaneously challenge:

- a simulated authority boundary,
- narrow scope being generalized to the real path,
- timing assumptions,
- visual appearance being used as a proxy for preserved state,
- implied journey continuity that was never asserted.

The probe rank is an ordinal testing heuristic, not a defect probability.

## Why probes are necessary

A detector or conflict set can identify plausible explanations, but it does not prove which one caused the observed problem. A discriminating probe is the operation that rules explanations in or out.

Therefore:

```text
evidence risk
  -> candidate explanation(s)
  -> probe
  -> observed result
  -> bounded conclusion
```

not:

```text
evidence risk -> product defect proven
```

## User-facing translation

For ordinary users, translate the machinery into:

```text
What looks good
Why this may still be misleading
Best next check
What the check can tell you
What is still unknown
```

Example translations:

```text
NETWORK_MOCK
-> "The payment return was simulated."

VISUAL_ONLY_ORACLE
-> "The screen looked right, but preserved state was never checked."

FORCED_ACTION
-> "The test bypassed an action a real user must perform naturally."
```

The internal labels remain available through `review_claim(includeInternal=true)` for research, governance, debugging, and receipts.

## Evidence verdicts

Lower-level `admit_evidence` behavior remains scoped:

- clean support may license only the requested scope;
- evidence blocked by a known distortion cannot license that scope by itself;
- a clean independent result may still license the scope while distorted evidence stays visible;
- strong contradictory runtime evidence rejects the evaluated claim under the tested conditions;
- flaky, candidate, or unknown evidence remains inconclusive.

The default product output translates those states rather than teaching their internal names.
