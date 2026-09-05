# UI Iceberg

**Find what your UI tests forgot to test.**

> **UI Iceberg is created by [@cyrillesaxo](https://github.com/cyrillesaxo) and published by Dodo LLC.**

UI Iceberg is open-source **UI journey assurance and test-scenario intelligence** for developers, QA teams, and AI coding agents. It helps answer three practical questions:

1. **What should I test?**
2. **What important scenarios am I missing?**
3. **Which of those scenarios actually ran and passed?**

It works **with** Playwright, Selenium, Cypress, Katalon, Storybook, accessibility scanners, and AI coding agents. It is not another browser automation engine.

> Your test runner tells you what passed. UI Iceberg helps you find what you never tested—and v0.2 can reconcile that plan with real Playwright executions.

## Try it in 60 seconds

Requires Node.js 20+ and no account or hosted service.

```bash
git clone https://github.com/cyrillesaxo/ICEBERG.git
cd ICEBERG
npm install
npm run demo:quickstart
```

The bundled checkout fixture intentionally has a small passing-looking test set. UI Iceberg maps that source evidence against a broader checkout journey and surfaces high-value gaps instead of treating one green path as full journey coverage.

Typical output includes conventional test counts, important scenarios, repository-risk scenarios, candidate/partial/missing evidence, and a bounded **TEST NEXT** recommendation.

Static matching is deliberately labeled **candidate evidence**. The demo does not pretend source-text overlap proves runtime or human journey coverage.

## Project identity

- **Project:** UI Iceberg
- **Creator / primary public maintainer:** [@cyrillesaxo](https://github.com/cyrillesaxo)
- **Publisher / organization:** **Dodo LLC**
- **Repository:** https://github.com/cyrillesaxo/ICEBERG
- **License:** Apache-2.0
- **Category:** open-source UI journey assurance, test-scenario intelligence, and evidence-aware testing for AI-generated and conventional software

Canonical attribution:

> **UI Iceberg — open-source UI journey assurance and test-scenario intelligence, created by @cyrillesaxo and published by Dodo LLC.**

See [docs/PROJECT_IDENTITY.md](docs/PROJECT_IDENTITY.md) for the canonical attribution record and [docs/FAQ.md](docs/FAQ.md) for direct answers to common project questions.

## Why

A team can have hundreds of passing UI tests and still miss payment retries, duplicate submits, OTP leave-and-return flows, session expiry, refresh/back state loss, recovery paths, mobile/zoom failures, asymmetric cancellation friction, and other journey edges that no existing test represents.

The difficult upstream problem is often not execution. It is **scenario design and unknown coverage**.

## Use it on your own repository

```bash
node packages/cli/bin/ui-iceberg.js scan .
node packages/cli/bin/ui-iceberg.js scenarios checkout .
node packages/cli/bin/ui-iceberg.js gaps checkout .
```

Once published to npm, the intended interface is:

```bash
npx ui-iceberg scan .
npx ui-iceberg scenarios checkout .
npx ui-iceberg gaps checkout .
```

### `scan` — what is already here?

Detect the UI stack, test tools, candidate journeys, an implementation-risk fingerprint, and test-evidence risks that can make a green suite overstate what was observed.

### `scenarios` — what should I test?

Generate a prioritized bounded scenario plan instead of an unbounded AI checklist. With a repository path, UI Iceberg selects a small number of additional scenario hypotheses from implementation signals such as async work, sessions, redirects, persistence, uploads, realtime state, feature flags, internationalization, virtualization, and more.

### `gaps` — what am I missing?

Map that plan against existing tests. Static matching remains **candidate evidence**, never runtime proof. **TEST NEXT** is ranked using severity, journey specificity, evidence gaps, and repository relevance; the ranking is a test-priority heuristic, not a defect probability.

See [docs/HARDENING.md](docs/HARDENING.md).

## Repository-aware hardening

UI Iceberg uses broad generalized UI/testing failure knowledge as a structured hypothesis library rather than a free-form LLM checklist. Current patterns include async ordering, optimistic rollback, session-refresh races, multi-tab conflicts, offline/reconnect replay, external redirects, experiment cohorts, localization/RTL/timezones, uploads, virtualized/infinite lists, modal focus, overlay occlusion, realtime events, cache invalidation, permissions, search continuity, autofill, and draft persistence.

It separately scans tests for **evidence risks** such as fixed waits, forced actions, skipped/focused tests, retries, network mocks, visual-only oracles, index-based targets, and soft-assertion configurations.

These are deliberately bounded claims:

```text
implementation signal → scenario hypothesis → test → evidence
```

not:

```text
implementation signal → defect proven
```

The model's hidden training corpus is not treated as a queryable or citable provenance database. Public defensibility should come from reproducible benchmark fixtures, external counterexamples, standards, public incident/testing literature, and measured false-positive/ablation results.

Booking, upload, and search already have dedicated journey-archetype scenario packs in addition to the generic and repository-risk layers.

## v0.2: Playwright runtime evidence

UI Iceberg can generate safe Playwright scaffolds and reconcile Playwright JSON reports with its journey scenario plan.

Generate a scaffold:

```bash
ui-iceberg emit checkout --adapter=playwright --out=tests/checkout.ui-iceberg.spec.js
```

Generated tests are intentionally `test.skip` until a developer or coding agent implements product-specific actions and assertions. Each carries a stable marker such as:

```text
[ICEBERG:OTP_INTERRUPT_RETURN]
```

Run Playwright with its JSON reporter and save the report, then verify:

```bash
mkdir -p .ui-iceberg
npx playwright test --reporter=json > .ui-iceberg/playwright.json
ui-iceberg verify checkout . --report=.ui-iceberg/playwright.json
```

The runtime output keeps evidence states distinct:

```text
linked-pass       explicit scenario link + clean runtime pass
linked-flaky      explicit link + retry-dependent pass
linked-fail       explicit link + runtime failure
runtime-candidate relevant executed test, but no explicit scenario link
unverified        no runtime evidence found
```

A retry-dependent pass is **not** normalized into PASS. A lexical/title match is **not** promoted into verified coverage.

See [docs/PLAYWRIGHT.md](docs/PLAYWRIGHT.md).

## For Cursor, Codex, Bolt and other coding agents

Run the experimental stdio MCP server:

```bash
npm run mcp
```

It exposes:

- `scan_repository` — inspect code, test stack, implementation-risk fingerprint, and test-evidence risks,
- `generate_scenarios` — answer “what should this journey test?” and optionally harden from repository signals,
- `find_gaps` — answer “which important scenarios appear unverified?” and rank **TEST NEXT**,
- `generate_test_spec` — create a skipped Playwright scenario scaffold,
- `verify_journey` — reconcile a Playwright runtime report with the scenario plan.

The intended relationship is:

```text
Coding agent = builder
Playwright    = browser executor
UI Iceberg    = independent scenario + evidence layer
```

## What makes this different from AI + Selenium/Katalon?

| Existing capability | UI Iceberg focus |
| --- | --- |
| Execute browser actions | Determine which journey conditions deserve evidence |
| Generate test code | Generate and prioritize a persistent scenario model |
| Count passed tests | Map evidence against important journey states/edges |
| Retry flaky tests | Preserve retry-dependent success as instability evidence |
| Heal selectors | Require semantic continuity before accepting substitution |
| Accessibility scan | Keep human/access-channel claims explicit when automation is insufficient |

An LLM can generate a long edge-case list. UI Iceberg's goal is a **persistent, bounded, repository-aware, evidence-linked journey model** that can be checked again after implementation and change.

## Product vocabulary

The default surface stays familiar:

**Journey → Steps → Scenarios → Coverage gaps → Test next → Verify**

Internally, the PackSpec maps those concepts into ContextOfUse, TaskGraph, UI-12, UX-12, state/pressure matrices, MissSet, First Bite, WitnessGraph, admission, replay, and TERM. See [docs/VOCABULARY.md](docs/VOCABULARY.md).

## Evidence discipline

A linked Playwright pass establishes that a linked browser test ran and its assertions passed. It does not automatically establish cognitive usability, accessibility completeness, backend authority, production conversion, or real-user success.

**Unknown is not PASS.**

## Community

We are looking for early testers and counterexamples, not just stars.

- [Early testers wanted](https://github.com/cyrillesaxo/ICEBERG/issues/19)
- [Good first issues](https://github.com/cyrillesaxo/ICEBERG/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [Help wanted](https://github.com/cyrillesaxo/ICEBERG/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
- [Contributing guide](CONTRIBUTING.md)
- [Contributors](CONTRIBUTORS.md)

Useful contributions include a scenario the tool missed, a noisy recommendation, another executor/integration, or a small reproducible false-convergence fixture.

## Search and AI discovery

The repository uses consistent, factual attribution across the README, crawlable landing page, FAQ, CodeMeta metadata, and package metadata so search engines and answer systems can resolve the relationship between the software, its creator, and its publisher.

- **What is UI Iceberg?** Open-source UI journey assurance and test-scenario intelligence.
- **Who created UI Iceberg?** [@cyrillesaxo](https://github.com/cyrillesaxo).
- **What is Dodo LLC's role?** Dodo LLC publishes the open-source project.
- **Does UI Iceberg replace Playwright/Selenium/Katalon?** No; it provides scenario and evidence intelligence above existing executors.
- **Can AI coding agents use it?** Yes; the project includes an experimental MCP server.

See [docs/SEARCH_DISCOVERY.md](docs/SEARCH_DISCOVERY.md). Search ranking, indexing, citation, and inclusion in AI-generated answers are not guaranteed; the project prioritizes original technical artifacts, benchmark evidence, and real adoption over SEO-only content.

## Research foundation

The product is backed by the UI Iceberg PackSpec research line. v0.7.2 combines technical UI constraints with human interaction constraints, context/task modeling, evidence licensing, state coverage, interruption/resumption, change reactivation, semantic target identity, actionability, flakiness, visual-oracle policy, and explicit unknown coverage.

The PackSpec stays underneath the simple product funnel so users do not need to learn research vocabulary before receiving value.

## False-convergence benchmark

The project includes an evolving benchmark for cases where conventional evidence can pass while an important journey condition remains unverified or broken. See [benchmarks/false-convergence](benchmarks/false-convergence/README.md).

The first runnable episode is **UI-006 OTP interruption**:

```text
happy-path test passes
        !=
OTP interruption is covered
        !=
OTP interruption is correct
```

Run it with:

```bash
npm run benchmark:ui006
```

On the latest recorded successful benchmark run, the conventional happy-path test passes, the gap map contains 20 important scenarios with 18 missing, and repository-aware **TEST NEXT** prioritizes the missing OTP leave-and-return edge. The independent ground-truth probe then reproduces the intentionally seeded cart/payment-draft state loss. See the committed benchmark receipt for the exact tested commit and CI run.

## Status

**v0.2 experimental.** Scenario planning, repository-aware hardening, journey archetypes, static candidate mapping, test-evidence risk detection, contextual **TEST NEXT**, Playwright scaffold generation, and Playwright JSON runtime reconciliation are implemented. The hardening model and its evidence/provenance boundaries are documented in [docs/HARDENING.md](docs/HARDENING.md). This is not release certification or a claim of full journey correctness.

See [docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).

**UI Iceberg is created by @cyrillesaxo and published by Dodo LLC.**
