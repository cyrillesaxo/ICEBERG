# UI Iceberg

**Find what your UI tests forgot to test.**

UI Iceberg is open-source **test-scenario intelligence for critical user journeys**. It helps answer three practical questions:

1. **What should I test?**
2. **What important scenarios am I missing?**
3. **Which of those scenarios actually ran and passed?**

It works **with** Playwright, Selenium, Cypress, Katalon, Storybook, accessibility scanners, and AI coding agents. It is not another browser automation engine.

> Your test runner tells you what passed. UI Iceberg helps you find what you never tested—and v0.2 can reconcile that plan with real Playwright executions.

## Why

A team can have hundreds of passing UI tests and still miss payment retries, duplicate submits, OTP leave-and-return flows, session expiry, refresh/back state loss, recovery paths, mobile/zoom failures, asymmetric cancellation friction, and other journey edges that no existing test represents.

The difficult upstream problem is often not execution. It is **scenario design and unknown coverage**.

## Quick start

Requires Node.js 20+.

```bash
git clone https://github.com/cyrillesaxo/ICEBERG.git
cd ICEBERG
npm install

node packages/cli/bin/ui-iceberg.js scan .
node packages/cli/bin/ui-iceberg.js scenarios checkout
node packages/cli/bin/ui-iceberg.js gaps checkout .
```

Once published to npm, the intended interface is:

```bash
npx ui-iceberg scan .
npx ui-iceberg scenarios checkout
npx ui-iceberg gaps checkout .
```

### `scan` — what is already here?

Detect the UI stack, test tools, test files, and candidate journey families.

### `scenarios` — what should I test?

Generate a prioritized bounded scenario plan instead of an unbounded AI checklist.

### `gaps` — what am I missing?

Map that plan against existing test source. Static matching remains **candidate evidence**, never runtime proof.

## v0.2: Playwright runtime evidence

UI Iceberg can now generate safe Playwright scaffolds and reconcile Playwright JSON reports with its journey scenario plan.

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

- `scan_repository` — inspect the codebase and current test stack,
- `generate_scenarios` — answer “what should this journey test?”,
- `find_gaps` — answer “which important scenarios appear unverified?”,
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

An LLM can generate a long edge-case list. UI Iceberg's goal is to maintain a **persistent, bounded, evidence-linked journey model** that can be checked again after implementation and change.

## Product vocabulary

The default surface stays familiar:

**Journey → Steps → Scenarios → Coverage gaps → Test next → Verify**

Internally, the PackSpec maps those concepts into ContextOfUse, TaskGraph, UI-12, UX-12, state/pressure matrices, MissSet, First Bite, WitnessGraph, admission, replay, and TERM. See [docs/VOCABULARY.md](docs/VOCABULARY.md).

## Evidence discipline

UI Iceberg intentionally distinguishes what different evidence can prove.

A linked Playwright pass establishes that a linked browser test ran and its assertions passed. It does not automatically establish cognitive usability, accessibility completeness, backend authority, production conversion, or real-user success.

**Unknown is not PASS.**

## Research foundation

The product is backed by the UI Iceberg PackSpec research line. v0.7.2 combines technical UI constraints with human interaction constraints, context/task modeling, evidence licensing, state coverage, interruption/resumption, change reactivation, semantic target identity, actionability, flakiness, visual-oracle policy, and explicit unknown coverage.

The PackSpec stays underneath the simple product funnel so users do not need to learn research vocabulary before receiving value.

## False-convergence benchmark

The project includes an evolving benchmark for cases where conventional evidence can pass while an important journey condition remains unverified or broken. See [benchmarks/false-convergence](benchmarks/false-convergence/README.md).

## Status

**v0.2 experimental.** Scenario planning, static candidate mapping, Playwright scaffold generation, and Playwright JSON runtime reconciliation are implemented. This is not yet release certification or a claim of full journey correctness.

See [docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).

Open-source project by **Dodo LLC**.
