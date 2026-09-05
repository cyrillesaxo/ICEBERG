---
name: ui-iceberg
description: Use UI Iceberg to audit, harden, repair, and verify UI user journeys in a code repository. Activate when the user asks to find hidden UI bugs or constraints, explain why green UI tests may still miss failures, improve cross-page or mobile consistency, identify missing scenarios, decide what to test next, generate evidence-linked Playwright tests, verify a UI repair, or apply ICEBERG/APX-style journey assurance. Prefer the UI Iceberg MCP or CLI when available; never convert static signals into claims of proven defects.
license: Apache-2.0
compatibility: Requires repository access. Running UI Iceberg locally requires Node.js 20+. Playwright runtime verification requires a JSON reporter output. MCP use is optional.
metadata:
  author: cyrillesaxo
  publisher: Dodo LLC
  version: "0.1.0"
  source-repository: cyrillesaxo/ICEBERG
  source-branch: bootstrap-v0.1
---

# UI Iceberg

Use this skill as an independent UI journey-assurance layer above the application's implementation and test runner.

UI Iceberg does not replace Playwright, Selenium, Cypress, Katalon, Storybook, accessibility tooling, visual inspection, or the coding agent. It determines which journey conditions deserve evidence, exposes important conditions that appear unverified, selects a bounded next probe, and preserves the difference between hypothesis and proof.

## Non-negotiable evidence law

Always preserve this chain:

```text
implementation signal
  -> relevant failure pattern
  -> scenario hypothesis
  -> probe / executable test
  -> evidence
  -> bounded conclusion
```

Never collapse it into:

```text
implementation signal -> defect proven
```

Likewise:

```text
green test -> assertions in that execution passed
```

is not equivalent to:

```text
green test -> whole user journey is correct
```

**Unknown is not PASS. Flaky is not PASS. Candidate evidence is not verified evidence.**

Read `references/EVIDENCE_MODEL.md` when interpreting scan results, runtime states, hidden constraints, or confidence.

## Activate this skill when

Use it for requests such as:

- find hidden UI bugs, hidden primitives, latent constraints, or deceptive-green test coverage;
- review or improve a UI repository before or after implementation;
- make navigation, interaction, state, or responsive behavior consistent across pages;
- analyze why an app passes tests but still fails in realistic use;
- identify important scenarios that have no test or weak evidence;
- generate or improve Playwright tests around user journeys rather than isolated components;
- determine the highest-value next UI test or repair;
- verify that a UI fix actually closes the targeted journey gap;
- evaluate interruption/resumption, async races, persistence, permissions, accessibility channels, mobile geometry, external redirects, retries, duplicate actions, localization, or multi-context behavior;
- apply the ICEBERG PackSpec concepts without forcing advanced vocabulary on the end user.

Do not activate merely to restyle a static visual when no journey, interaction, state, or evidence question is involved.

## Required inputs

Use what is available; do not ask the user to repeat context that can be derived from the repository or task.

Minimum useful input:

- a repository path/source, running application, or sufficiently detailed UI artifact; and
- a user goal or journey, either explicit or inferable.

Helpful optional inputs:

- screenshots or design references;
- bug reports or acceptance criteria;
- existing UI tests;
- Playwright JSON report;
- target viewports, locales, roles, permissions, or assistive channels;
- a specific page, flow, regression, or suspected hidden constraint.

If the journey is not named, infer candidate journeys from routes, forms, actions, test names, product language, and repository signals. State the inferred journey only when ambiguity materially affects the result.

## Tool selection

Prefer the strongest available path in this order:

1. **UI Iceberg MCP** if the agent exposes the ICEBERG tools.
2. **UI Iceberg CLI** if the repository can execute Node.js commands.
3. **Evidence-disciplined manual analysis** only when neither MCP nor CLI can run.

Never claim that UI Iceberg executed if you only emulated its reasoning model.

Read `references/OPERATIONS.md` for exact MCP tool names, CLI commands, and runtime evidence states.

## Workflow

### 1. Establish the journey and evidence target

Define the user goal, start state, important transitions, completion condition, and any explicit context such as mobile, role, locale, interruption, or accessibility channel.

Prefer user-facing language:

```text
Journey -> Steps -> Scenarios -> Coverage gaps -> Test next -> Verify
```

Use advanced/internal terms only when they improve precision:

```text
ContextOfUse + TaskGraph -> pressure/state/invariant probe -> MissSet -> First Bite -> Witness/Antiwitness -> replay/admission
```

### 2. Scan the repository before prescribing fixes

If MCP is available, call `scan_repository`.

If CLI is available, run:

```bash
ui-iceberg scan <repo-path> --json
```

or, from this repository checkout:

```bash
node packages/cli/bin/ui-iceberg.js scan <repo-path> --json
```

Capture at least:

- detected UI framework and test tools;
- candidate journeys;
- implementation risk fingerprint;
- test-evidence risks;
- repository caveats.

Treat every implementation risk as a selector for scenarios, not as a defect finding.

### 3. Build a bounded scenario plan

Generate scenarios for the target journey, hardened by repository signals.

Prefer a bounded set. Do not produce an indiscriminate 100-item edge-case dump. The current hardening layer defaults to a small repository-specific scenario budget.

Prioritize conditions that can invalidate the user's actual goal, including where applicable:

- success-path completion;
- validation recovery;
- request failure and retry;
- slow/pending feedback;
- duplicate action prevention;
- refresh/back/forward continuity;
- leave-and-return interruption;
- session expiry and reauthentication;
- mobile primary-action reachability;
- zoom/text scaling;
- keyboard-only operation;
- state restoration after errors;
- empty/zero-data states;
- domain-specific and repository-risk scenarios.

For deeper hidden-pressure mapping, read `references/CONSTRAINT_SURFACES.md`.

### 4. Map scenarios to existing evidence

Use `find_gaps` or `ui-iceberg gaps`.

Keep the evidence state exactly as returned. Static source matching can establish candidate or partial evidence; it does not establish runtime coverage.

Review evidence-risk signals such as fixed waits, forced actions, retries, skipped/focused tests, network mocks, visual-only oracles, index-based targets, and soft assertions. These narrow what a green result is licensed to establish; they are not automatically product defects.

### 5. Select one First Bite / TEST NEXT

Rank the next probe by:

- journey impact/severity;
- missing or partial evidence;
- journey specificity;
- repository relevance;
- evidence uncertainty;
- cost/reversibility when choosing among similarly valuable probes.

The ranking is a **test-priority heuristic**, never a defect probability.

Default to one primary `TEST NEXT` and at most a small fallback set. Avoid broad remediation programs before the highest-value uncertainty is tested.

### 6. If the user asked to fix or improve the UI, probe before broad repair

For each high-value suspected issue:

1. State the scenario and violated/at-risk constraint.
2. Reproduce or create the smallest discriminating probe.
3. Observe the actual failure or missing evidence.
4. Patch the smallest implementation surface that restores the invariant.
5. Preserve unrelated behavior and visual semantics.
6. Add evidence that would fail if the defect returns.

Do not redesign unrelated screens merely because the repository contains inconsistent code.

When the request is about cross-page or mobile consistency, compare the shared primitive across pages/viewports rather than fixing screenshots independently. Examples: navigation ownership, active-state identity, semantic target identity, action placement, responsive geometry, focus order, persistence, and route continuity.

### 7. Generate evidence-linked Playwright scaffolds when useful

Use `generate_test_spec` or:

```bash
ui-iceberg emit <journey> --adapter=playwright --out=<path>
```

Generated scaffolds are intentionally skipped. Implement product-specific actions and assertions before enabling them.

Keep the stable ICEBERG marker, for example:

```text
[ICEBERG:OTP_INTERRUPT_RETURN]
```

Supported linkage also includes forms such as:

```text
@iceberg:OTP_INTERRUPT_RETURN
ICEBERG_SCENARIO=OTP_INTERRUPT_RETURN
```

Do not remove `test.skip` until the scaffold contains real product actions and assertions.

### 8. Run and reconcile runtime evidence

For Playwright, produce JSON reporter output, then use `verify_journey` or:

```bash
ui-iceberg verify <journey> <repo-path> --report=<playwright-json>
```

Preserve these states:

- `linked-pass` — explicit scenario link and clean runtime pass;
- `linked-flaky` — explicit link but retry-dependent pass;
- `linked-fail` — explicit link and runtime failure;
- `runtime-candidate` — relevant execution without explicit scenario linkage;
- `unverified` — no runtime evidence.

A retry-dependent pass must remain `linked-flaky`.

### 9. Re-scan after meaningful change

After a repair or substantial UI change:

- replay the targeted scenario;
- re-run gap analysis for the journey;
- inspect whether the change introduces new pressure or evidence-risk signals;
- explicitly report residual unknowns.

Do not declare the whole UI certified because the targeted scenario passes.

## Repair rules

When modifying code under this skill:

- prefer shared primitives over page-specific patches when the same invariant spans multiple pages;
- fix semantic identity before compensating with coordinates or brittle selectors;
- preserve valid state across interruption, refresh, navigation, and authority boundaries where the journey requires it;
- ensure a visible control is actually actionable, not merely rendered;
- test mobile/zoom/keyboard behavior as distinct projections, not as assumptions inferred from desktop;
- use stable semantic selectors/markers where possible;
- distinguish UI projection state from authoritative backend state;
- avoid forced clicks or fixed sleeps as evidence of correctness;
- do not hide flakiness with retries.

## Output contract

For an audit, improvement, or repair task, return a compact evidence-led result with these sections when applicable:

### Journey

State the user goal and relevant context.

### Iceberg findings

Use a table or concise structured list containing:

- scenario / hidden condition;
- pressure or constraint surface;
- evidence state;
- observed or potential user impact;
- evidence needed or result of the probe.

Clearly label hypotheses versus reproduced defects.

### TEST NEXT

Give one highest-value next scenario/probe and explain why it dominates the remaining uncertainty.

### Change

If code was changed, summarize the repaired invariant and affected files/components. Do not claim unrelated improvements.

### Verification

Report exact evidence states and what was actually executed.

### Residual unknowns

List only meaningful unresolved coverage, not boilerplate caveats.

Use `assets/ICEBERG_RECEIPT_TEMPLATE.md` when the user asks for an auditable receipt, governance artifact, PackSpec-style result, or machine-readable review summary.

## Completion checklist

Before finishing, verify all of the following:

- [ ] A user journey, not just a page, anchors the analysis.
- [ ] Static repository signals are labeled as hypotheses/selectors, not proven defects.
- [ ] Evidence-risk findings narrow claims instead of manufacturing failures.
- [ ] The scenario set is bounded and prioritized.
- [ ] `TEST NEXT` is explicit.
- [ ] If a fix was requested, the relevant scenario was probed or the missing evidence is explicitly stated.
- [ ] Generated Playwright scaffolds remain skipped until implemented.
- [ ] Runtime states preserve flaky/candidate/unverified distinctions.
- [ ] A targeted pass is not promoted to full journey/product certification.
- [ ] Residual unknowns remain visible.

## Canonical project identity

UI Iceberg is open-source UI journey assurance and test-scenario intelligence created by `@cyrillesaxo` and published by Dodo LLC. The project is Apache-2.0 licensed.
