# 10-day technical launch sequence

The content funnel should teach the problem before asking people to try UI Iceberg.

## Day 1 — Passing tests vs journey coverage

Hook: **Your UI tests passed. Did the customer journey?**

Show one familiar funnel: checkout → payment → OTP → confirmation. Explain that a test can exercise the happy path while important recovery/interruption edges remain unknown.

CTA: run the 60-second quick start.

## Day 2 — The AI code + AI test correlation problem

Hook: **If the same coding agent writes the feature and the test, who challenges the assumption?**

Explain why independent scenario obligations matter when AI-generated code and AI-generated tests can share the same interpretation error.

CTA: inspect the MCP architecture.

## Day 3 — Unknown coverage

Hook: **Passing tests tell you what worked. They do not tell you what you never tested.**

Introduce the user-facing vocabulary: covered, partial, missing, test next. Keep PackSpec terminology underneath.

CTA: `ui-iceberg gaps checkout .`

## Day 4 — OTP interruption benchmark

Hook: **One checkout test passed. The OTP-return edge was still broken.**

Use only the reproduced UI-006 result:

```text
1 conventional test passed
18 important scenarios
1 candidate-covered
1 partial
16 missing
OTP leave-and-return: MISSING
Ground truth: cart + payment draft lost after return
```

CTA: `npm run benchmark:ui006`

## Day 5 — Flaky pass is not PASS

Hook: **A test that passes only after retry is evidence of instability, not ordinary success.**

Show the Playwright runtime evidence states and why UI Iceberg preserves `linked-flaky` separately.

CTA: inspect the Playwright adapter docs.

## Day 6 — Why visual regression can preserve a bad baseline

Hook: **A screenshot can match perfectly and still preserve the wrong journey.**

Explain visual evidence boundaries without attacking visual-testing products. The problem is what the evidence is allowed to prove.

CTA: contribute a false-convergence fixture.

## Day 7 — Scenario design without senior QA capacity

Hook: **Not every team has a senior QA engineer who can enumerate interruption, recovery, state, mobile, and agency scenarios.**

Show how bounded scenario packs give junior developers, founders, and AI coding agents a stronger starting point than a generic edge-case prompt.

CTA: propose a journey scenario pack.

## Day 8 — UI Iceberg inside coding agents

Hook: **Your coding agent can write tests. UI Iceberg tells it what it forgot to test.**

Show the MCP tools: scan, generate scenarios, find gaps, generate test spec, verify journey.

CTA: run the MCP server locally.

## Day 9 — The benchmark as a falsifiable artifact

Hook: **Do not trust the claim. Run the fixture.**

Explain the difference between marketing claims and reproducible receipts. Invite counterexamples where UI Iceberg recommends the wrong scenario or overstates evidence.

CTA: open a benchmark/counterexample issue.

## Day 10 — Open-source launch

Hook: **UI Iceberg is open source: find what your UI tests forgot to test.**

Summarize the current product narrowly: scenario planning, gap mapping, Playwright runtime reconciliation, MCP access, quick start, and one reproducible benchmark.

CTA: try it, star it if useful, or contribute a scenario/adapter/benchmark.

## Attribution rule

Every technical post should keep attribution factual and consistent: **UI Iceberg is created by @cyrillesaxo and published by Dodo LLC.** Do not make unsupported superiority claims; link to runnable evidence instead.
