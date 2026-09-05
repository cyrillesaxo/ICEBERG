# Repository-aware hardening

UI Iceberg does not rely only on a fixed checkout/signup checklist. The repository scan now builds two independent risk surfaces and uses them to harden scenario planning:

1. an **implementation risk fingerprint** selects relevant scenario hypotheses;
2. a **test evidence-risk scan** identifies ways a green suite may overstate what was actually observed.

Examples of detectable implementation pressures include async/network work and out-of-order responses, optimistic UI/rollback, authentication/session refresh, browser persistence and multi-tab state, offline/reconnect queues, external redirects such as OAuth/OTP/payment verification, feature flags, internationalization/RTL/timezones, uploads, virtualized/infinite lists, modal focus/occlusion, realtime events, caches, permissions, search/filter state, complex forms, and unsaved drafts.

For each detected pressure, UI Iceberg may add a bounded scenario such as `ignore a late response that belongs to an older user intent` or `rollback an optimistic update when the authoritative commit fails`.

The test evidence-risk scanner separately looks for patterns such as fixed waits, forced actions, skipped/focused tests, retries, network mocks, visual-only oracles, index-based targets, and soft-assertion configurations. These are not product defects; they are reasons to narrow what a green test is allowed to establish.

## Critical evidence boundary

A repository signal does **not** prove a defect exists.

```text
implementation signal
      ↓
relevant generalized failure pattern
      ↓
scenario hypothesis
      ↓
probe / executable test
      ↓
evidence
```

It must never become:

```text
implementation signal → defect proven
```

Likewise:

```text
test evidence risk → green result needs narrower interpretation
```

must never become:

```text
test evidence risk → product defect proven
```

The failure-pattern library therefore records a failure mode, evidence need, mapped UI Iceberg constraints, and an explicit proof boundary for every selected pattern.

## Bounded selection

The default repository-specific hardening budget is six scenarios. This prevents `AI edge-case explosion` from turning scenario intelligence into a 200-item checklist. High-priority patterns and patterns supported by more repository signals are considered first.

Generic journey scenarios remain available. Repository-specific scenarios are marked `[repo-risk]` in CLI output. Booking, upload, and search also have dedicated journey-archetype packs for domain-specific failure topology.

## Repository-aware Test Next

The CLI and MCP `find_gaps` surface now rank the next test from scenario severity, whether evidence is missing/partial, journey specificity, repository implementation pressures, and remaining evidence uncertainty.

The score is a **test-priority heuristic**, not a defect probability. It exists to choose a high-value First Bite, not to manufacture confidence.

In the controlled UI-006 benchmark, this mechanism prioritizes the missing OTP leave-and-return scenario because the fixture exposes an external-redirect pressure. The independent benchmark probe then confirms that the intentionally broken fixture loses cart/payment-draft state on that edge. This is benchmark evidence for that fixture only.

## Model-knowledge boundary

The generalized pattern library can use broad software/UI failure knowledge represented in the model and maintained by project contributors, but the model's hidden training corpus is not a queryable provenance database. UI Iceberg therefore does not label entries as `observed in training data` or cite unverifiable training examples.

For public defensibility, every important pattern should progressively acquire **public provenance** from reproducible fixtures, external-repository counterexamples, public incident reports, standards, tool documentation, and research where licensing permits derived taxonomy work.

That creates a hardening loop:

```text
generalized pattern
      ↓
public/reproducible witness
      ↓
false-positive + discrimination measurement
      ↓
keep / narrow / split / retire
      ↓
versioned scenario library
```

The model can help seed hypotheses; the open evidence corpus should decide which ones survive.

## Current hardening path

The library should be strengthened through reproducible benchmarks, external-user counterexamples, false-positive measurement, and ablation. Patterns that do not discriminate useful gaps should be removed or narrowed rather than accumulated indefinitely.
