# Deceptive Witness checking

UI Iceberg v0.4 adds a bounded executable deceptive-witness layer between nominally green evidence and scoped admission.

## Core idea

A **witness** supports a claim under stated conditions.

An **antiwitness** contradicts or narrows that claim.

A **deceptive witness candidate** is different: the result appears supportive, often green, but the evidence channel can license a weaker claim than the team may infer.

```text
green result
  -> witness candidate
  -> deceptive-witness check
  -> clean / weakened / deceptive / non-witness / antiwitness / unknown
  -> First Bite probe
  -> scoped admission
```

This is an evidence-quality classification, not a product-defect verdict.

## Executable v0.4 subset

The PackSpec validation receipt records a larger research taxonomy, but its full normative 72-item deceptive-witness catalog is not yet vendored into this repository. UI Iceberg therefore does **not** fabricate those missing definitions.

v0.4 executes only a bounded public subset derived from the repository's existing test-evidence-risk detectors:

| Evidence risk | Distortion | Example claim weakened |
| --- | --- | --- |
| `FIXED_WAIT` | `TEMPORAL_ASSUMPTION` | deterministic readiness/stability |
| `FORCED_ACTION` | `ACTIONABILITY_BYPASS` | natural user actionability |
| `SKIPPED_TEST` | `NON_EXECUTION_PRESENTED_AS_COVERAGE` | suite/runtime completeness |
| `FOCUSED_TEST` | `SUITE_EXCLUSION` | full-suite evidence |
| `RETRY_ENABLED` / `linked-flaky` | `RETRY_LAUNDERING` | deterministic stability |
| `NETWORK_MOCK` | `AUTHORITY_SUBSTITUTION` | real authority/integration path |
| `VISUAL_ONLY_ORACLE` | `ORACLE_SCOPE_NARROWING` | semantic/task/accessibility correctness |
| `INDEX_BASED_TARGET` | `SEMANTIC_IDENTITY_DRIFT` | stable semantic target identity |
| `DISABLED_ASSERTION_FAILURE` | `ASSERTION_FAILURE_MASKING` | assertion/run integrity |

## Claim-aware behavior

A risk does not automatically invalidate every witness.

Example:

```text
network mock + linked-pass
```

can support:

```text
frontend handled the supplied mocked response
```

but cannot, by itself, establish:

```text
real provider callback semantics
production authority behavior
production journey health
```

Likewise, an index-based selector may weaken semantic-identity claims while still providing useful evidence for a narrower interaction under fixed ordering.

## Admission filtering

`admit_evidence` now audits strong supporting witnesses before they can license a claim.

- A clean witness can license the requested scope.
- A weakened witness can license the requested scope when its known distortions do not block that scope.
- A deceptive-witness candidate cannot license the blocked scope by itself.
- If every nominally strong supporting witness is deceptive for the requested scope, the verdict remains `INCONCLUSIVE`.
- A strong antiwitness still yields `REJECTED`.
- A clean independent witness can license the scope even when another nominally green witness is deceptive; the deceptive witness remains visible in the receipt.

## First Bite integration

`select_first_bite` accepts optional deceptive-witness inputs.

When the top scenario gap and a deceptive witness refer to the same scenario, UI Iceberg prefers the distortion probe before admission.

Example:

```text
OTP_INTERRUPT_RETURN is top gap
+
apparent linked-pass uses NETWORK_MOCK

=> recommended next:
PROBE_REAL_AUTHORITY_BOUNDARY
```

The selection is a deterministic testing heuristic, not a calibrated defect probability.

## MCP

Use:

```text
check_deceptive_witness
```

with a claim, witness, and evidence-risk signals. The result includes:

- classification;
- distortion(s);
- requested claim scope;
- whether the distortion blocks that scope;
- the narrower licensed claim;
- a recommended discriminating probe;
- an explicit evidence boundary.

The scan output already reports the current test-evidence-risk signals, so agents can pass those observations into deceptive-witness checking rather than inventing evidence characteristics.

## Signature loop

The intended UI Iceberg loop is:

```text
implementation/test signal
  -> scenario hypothesis
  -> apparent witness
  -> deceptive-witness check
  -> semantic entropy
  -> First Bite
  -> discriminating probe
  -> witness / antiwitness
  -> admission
  -> receipt
  -> TERM reactivation after change
```

A deceptive witness explains **why evidence looked safer than it was**. The discriminating probe determines whether the product itself actually fails under the targeted condition.
