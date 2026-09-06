---
name: ui-iceberg
description: Use UI Iceberg to audit, harden, repair, and verify UI user journeys in a code repository. Activate when the user asks to find hidden UI bugs or constraints, explain why green UI tests may still miss failures, detect deceptive evidence, improve cross-page or mobile consistency, identify missing scenarios, decide what to test next, generate evidence-linked Playwright tests, verify a UI repair, or apply ICEBERG/APX-style journey assurance. Prefer the UI Iceberg MCP or CLI when available; never convert static signals or evidence-risk classifications into claims of proven product defects.
license: Apache-2.0
compatibility: Requires repository access. Running UI Iceberg locally requires Node.js 20+. Playwright runtime verification requires a JSON reporter output. MCP use is optional.
metadata:
  author: cyrillesaxo
  publisher: Dodo LLC
  version: "0.3.0"
  source-repository: cyrillesaxo/ICEBERG
  source-branch: main
---

# UI Iceberg

Use this skill as an independent journey-assurance layer above the application's implementation and test runner.

The product-facing job is simple:

1. identify what looks safe;
2. explain why that result may still be misleading;
3. choose the single best next check;
4. report what the check actually proved;
5. keep meaningful unknowns visible.

Do not teach the user the internal research vocabulary unless they ask for research, governance, receipts, or implementation details.

## Non-negotiable evidence law

Internally preserve this chain:

```text
implementation signal
  -> scenario hypothesis
  -> probe
  -> evidence
  -> bounded conclusion
```

Do not collapse it into:

```text
implementation signal -> defect proven
```

Likewise, a green test means its executed assertions passed. It does not automatically prove the whole journey or every conclusion inferred from it.

**Unknown is not PASS. Flaky is not PASS. Candidate evidence is not verified evidence. Green is not automatically proven.**

Read `references/EVIDENCE_MODEL.md` when interpreting confidence, runtime states, deceptive evidence, or claim boundaries.

## Activate this skill when

Use it for requests such as:

- find hidden UI bugs, hidden primitives, or latent constraints;
- explain why a green suite can still miss realistic journey failures;
- identify when a passing test supports a narrower conclusion than the team assumes;
- improve navigation, interaction, state, or responsive consistency across pages;
- identify important scenarios with missing or weak evidence;
- generate or improve Playwright tests around user journeys;
- choose the highest-value next check or repair;
- verify that a UI fix actually closes the targeted journey gap;
- evaluate interruption/resumption, async races, persistence, permissions, mobile geometry, accessibility channels, redirects, retries, duplicate actions, localization, or multi-context behavior.

Do not activate merely to restyle a static visual when no journey, interaction, state, or evidence question is involved.

## Tool selection

Prefer, in order:

1. **UI Iceberg MCP** when available.
2. **UI Iceberg CLI** when repository commands can run.
3. **Evidence-disciplined manual analysis** only when neither can run.

Never claim UI Iceberg executed when only its reasoning pattern was emulated.

For normal user-facing conclusions, prefer MCP `review_claim`. Use lower-level tools only when detailed orchestration is required.

Read `references/OPERATIONS.md` for exact tool names and runtime states.

## Workflow

### 1. Anchor on the user journey

Identify the user goal, start state, important transitions, completion condition, and relevant context such as viewport, role, locale, interruption, or accessibility channel.

Default user vocabulary:

```text
Journey -> Important conditions -> What is missing -> Best next check -> Result
```

Internal structures may be richer, but do not surface them unless useful.

### 2. Scan before prescribing fixes

Use `scan_repository` or:

```bash
ui-iceberg scan <repo-path> --json
```

Capture the UI/test stack, candidate journeys, implementation pressures, test-evidence risks, and caveats. Repository signals select hypotheses; they are not defect findings.

### 3. Build a bounded scenario plan

Use `generate_scenarios` and `find_gaps` or the equivalent CLI commands. Prefer a small prioritized set over an indiscriminate edge-case dump.

Prioritize conditions that can invalidate the actual user goal: failure/retry, slow response, duplicate action, refresh/back continuity, interruption/return, session expiry, mobile reachability, zoom, keyboard operation, state restoration, empty states, and repository-specific pressures.

### 4. Review apparent green evidence

For ordinary output, pass the claim and relevant evidence to `review_claim`.

Under the hood, v0.5 can evaluate the claim using the canonical 12 semantic types, five deception mechanisms, evidence-risk mappings, and a probe matrix. This machinery is internal by default.

The five canonical deception mechanisms are:

- Untraceable Depth
- Inflated Scope
- Loaded Channel
- Loaded Frame
- Unstated Implication

Absence of a detected problem does not clear a mechanism. It remains unknown until actually checked or explicitly cleared by evidence.

The current code also has lower-level evidence-risk classifiers for patterns such as forced actions, fixed waits, retries, network mocks, visual-only oracles, index-based targets, focused/skipped tests, and soft-assertion configurations. These are evidence-quality signals, not product-defect verdicts.

### 5. Choose the best next check

Prefer one check that resolves several important uncertainties at once when possible.

The internal probe planner may combine multiple live mechanisms and semantic coordinates into one experiment. For example, a real delayed return plus explicit state assertions can simultaneously test a simulated authority boundary, timing assumptions, and visual-only evidence.

The selection is a testing heuristic, not a defect probability.

### 6. Probe before broad repair

When the user asks to fix the UI:

1. state the practical condition at risk;
2. create or select the smallest discriminating check;
3. observe the actual result;
4. patch the smallest shared implementation surface that restores the invariant;
5. preserve unrelated behavior;
6. add regression evidence that would fail if the issue returns.

For cross-page/mobile consistency, repair the shared primitive rather than patching screenshots independently.

### 7. Generate and run executable evidence

Use `generate_test_spec` when useful. Generated Playwright scaffolds remain `test.skip` until real product actions and assertions are implemented.

Preserve stable markers such as:

```text
[ICEBERG:OTP_INTERRUPT_RETURN]
```

Reconcile runtime results with `verify_journey`.

Preserve runtime distinctions:

- `linked-pass`
- `linked-flaky`
- `linked-fail`
- `runtime-candidate`
- `unverified`

Never normalize retry-dependent success into a clean pass.

### 8. Recheck after meaningful change

After a repair or substantial UI change, replay the targeted condition, inspect new pressures, and use `reactivation_impact` when prior evidence depends on changed files/signals. Unknown change impact remains unknown.

## Repair rules

When modifying code:

- prefer shared primitives over page-specific patches;
- fix semantic identity before compensating with brittle coordinates/selectors;
- preserve valid state across interruption, refresh, navigation, and authority boundaries when the journey requires it;
- ensure visible controls are actually actionable;
- test mobile/zoom/keyboard as distinct projections;
- use stable semantic selectors where possible;
- distinguish UI projection state from authoritative backend state;
- avoid forced clicks and fixed sleeps as proof of correctness;
- do not hide flakiness with retries;
- do not treat mocks or screenshots as stronger evidence than they are.

## Default output contract

Do not expose G-codes, deceptive-witness class names, semantic entropy, First Bite, admission, antiwitness, TERM, or similar research vocabulary in the ordinary user result.

Prefer this shape:

### What looks good

State the strongest relevant positive evidence in plain language.

### Why this may still be misleading

Give only the practical reasons supported by current evidence, for example:

- “The payment return was simulated.”
- “The test forced an action a real user must perform naturally.”
- “The screenshot passed, but preserved state was never asserted.”

### Best next check

Give one concrete check, ideally one that resolves multiple important uncertainties at once.

### Result

If executed, report exactly what happened: passed under tested conditions, failure reproduced, flaky, or still unverified.

### Still unknown

List only meaningful remaining unknowns.

For advanced research/governance requests, `includeInternal=true` may expose the semantic types, five mechanism states, probe matrix, scoped evidence verdicts, receipts, and reactivation details.

Use `assets/ICEBERG_RECEIPT_TEMPLATE.md` when the user asks for an auditable artifact.

## Completion checklist

Before finishing:

- [ ] The analysis is anchored on a user journey, not just a page.
- [ ] Repository signals remain hypotheses, not proven defects.
- [ ] Green evidence is not allowed to support a broader conclusion than it actually checks.
- [ ] Unchecked deception mechanisms remain unknown rather than silently clear.
- [ ] The next check is bounded and discriminating.
- [ ] If a fix was requested, the relevant condition was probed or missing evidence is explicit.
- [ ] Generated test scaffolds stay skipped until implemented.
- [ ] Runtime states preserve flaky/candidate/unverified distinctions.
- [ ] A targeted pass is not promoted to full product certification.
- [ ] Default user output avoids internal research vocabulary.
- [ ] Residual unknowns remain visible.

## Canonical project identity

UI Iceberg is open-source UI journey assurance and test-scenario intelligence created by `@cyrillesaxo` and published by Dodo LLC. The project is Apache-2.0 licensed.
