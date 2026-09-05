# Repository-aware hardening

UI Iceberg does not rely only on a fixed checkout/signup checklist. The repository scan now builds an **implementation risk fingerprint** and uses it to select a small number of additional scenarios from a generalized UI failure-pattern library.

Examples of detectable implementation pressures include:

- async/network work and out-of-order responses,
- optimistic UI and rollback,
- authentication/session refresh,
- browser persistence and multi-tab state,
- offline/reconnect queues,
- external redirects such as OAuth, OTP, or payment verification,
- feature flags / experiment cohorts,
- internationalization, RTL, and timezone boundaries,
- file uploads,
- virtualized and infinite lists,
- modal/overlay focus and occlusion,
- realtime event streams,
- client caches,
- browser/device permissions,
- search/filter state,
- complex forms and unsaved drafts.

For each detected pressure, UI Iceberg may add a bounded scenario such as "ignore a late response that belongs to an older user intent" or "rollback an optimistic update when the authoritative commit fails."

## Critical evidence boundary

A repository signal does **not** prove a defect exists.

```text
implementation signal
      ↓
relevant historical failure pattern
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

The library therefore records a failure mode, evidence need, mapped UI Iceberg constraints, and an explicit proof boundary for every selected pattern.

## Bounded selection

The default repository-specific hardening budget is six scenarios. This prevents "AI edge-case explosion" from turning scenario intelligence into a 200-item checklist. High-priority patterns and patterns supported by more repository signals are considered first.

The generic journey scenarios remain available. Repository-specific scenarios are marked `[repo-risk]` in CLI output.

## Current status

This is an experimental v0.2 hardening layer. The pattern catalog should be strengthened over time through:

1. reproducible benchmark fixtures,
2. external-repository counterexamples,
3. public incident/postmortem and testing literature where licensing permits derived taxonomy work,
4. false-positive measurements,
5. ablation: whether a pattern materially improves finding useful missing scenarios.

Patterns that do not discriminate useful gaps should be removed or narrowed rather than accumulated indefinitely.
