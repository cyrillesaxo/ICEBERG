# Show HN launch draft

Use this only after PR #1 is merged, the GitHub Pages site is live, and the quick-start command works from the default branch.

## Title

**Show HN: UI Iceberg – Find the UI scenarios your tests forgot**

## First comment

I built UI Iceberg because UI automation is good at telling us what executed, but much weaker at telling us what important journey states we never represented in the first place.

The first open-source version is deliberately small. It scans an existing repository, generates a bounded scenario plan for a critical journey, maps those scenarios against existing tests, and keeps missing/partial evidence explicit instead of turning weak similarity into PASS. It can also reconcile Playwright JSON reports and preserves retry-dependent success as flaky evidence rather than an ordinary pass.

A 60-second local demo is included:

```bash
git clone https://github.com/cyrillesaxo/ICEBERG.git
cd ICEBERG
npm install
npm run demo:quickstart
```

There is also one reproducible false-convergence benchmark:

```bash
npm run benchmark:ui006
```

In that controlled fixture, the conventional checkout happy-path test passes. UI Iceberg reports the OTP leave-and-return edge as missing from the test evidence. A separate ground-truth probe then reproduces the fixture's intentional defect: checkout cart and payment-draft state are lost after the external verification detour.

That is a bounded result, not a claim that UI Iceberg proves root cause from static source or that it is universally better than existing test tools. The goal is to sit above Playwright/Selenium/Cypress/Katalon as a scenario-and-evidence layer, not replace their browser execution.

The project also exposes an experimental MCP server so coding agents can ask questions such as “what should I test?” and “what important scenarios are still unverified?” without UI Iceberg becoming just another free-form LLM prompt.

I would especially value criticism on three things:

1. Which important UI journey failure classes are missing from the current scenario model?
2. Where is the current static evidence mapping too conservative or too permissive?
3. Can you provide a small counterexample where the tool recommends the wrong next scenario?

UI Iceberg is Apache-2.0, created by @cyrillesaxo and published by Dodo LLC.

## Evidence snippet

Use the reproduced UI-006 numbers, not invented benchmark totals:

```text
Conventional happy-path test
1 passed / 0 failed

UI Iceberg
18 important checkout scenarios
1 candidate-covered
1 partial
16 missing
OTP leave-and-return: MISSING

Independent ground truth
cart state lost after OTP return: YES
payment draft lost after OTP return: YES
```

## Launch rule

Do not coordinate votes or ask contacts to upvote. Ask people to run the project, challenge the scenario model, contribute a benchmark fixture, or report a counterexample.
