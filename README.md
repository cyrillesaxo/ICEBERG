# UI Iceberg

**Your tests passed. Did the user journey?**

> **UI Iceberg is created by [@cyrillesaxo](https://github.com/cyrillesaxo) and published by Dodo LLC.**

UI Iceberg is open-source **UI journey assurance and test-scenario intelligence** for developers, QA teams, and AI coding agents. It works with Playwright, Selenium, Cypress, Katalon, Storybook, accessibility tooling, and AI coding agents; it is not another browser automation engine.

It helps answer four practical questions:

1. **What important journey condition did we forget to test?**
2. **Why might a green test be giving us too much confidence?**
3. **What is the single best check to run next?**
4. **What did that check actually prove?**

The default product surface deliberately avoids research vocabulary. A typical result should read like this:

```text
428 / 428 tests passed

But this checkout claim still needs a stronger check.

Why the green result may be misleading:
- the payment return was simulated
- the test checks appearance, not preserved state

Best next check:
Run the return through the real boundary and assert that the cart,
payment choice, and position still exist afterward.

Still unknown:
Some ways this result could mislead have not yet been checked directly.
```

## Try it in 60 seconds

Requires Node.js 20+ and no account or hosted service.

```bash
git clone https://github.com/cyrillesaxo/ICEBERG.git
cd ICEBERG
npm install
npm run demo:quickstart
```

The bundled checkout fixture intentionally contains a passing-looking happy path while an important interruption edge remains unverified. UI Iceberg surfaces the gap instead of treating one green path as full journey coverage.

## Use it on a repository

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

Detect the UI stack, test tools, candidate journeys, implementation pressures, and test patterns that can make a green suite look stronger than it is.

### `scenarios` — what should I test?

Generate a bounded journey plan instead of an unbounded AI edge-case list. Repository-aware hardening adds a small set of scenarios relevant to async work, sessions, redirects, persistence, uploads, realtime state, feature flags, localization, virtualization, and similar pressures.

### `gaps` — what am I missing?

Map important journey conditions against the existing test set. Static source similarity remains candidate evidence; it is not treated as proof that the scenario ran.

See [docs/HARDENING.md](docs/HARDENING.md).

## v0.5: plain-language claim review

v0.5 adds a user-facing claim review that combines the existing evidence checks, probe selection, and semantic analysis without exposing internal framework terms by default.

The output is organized around:

- **what looks good**,
- **why the result may be misleading**,
- **the best next check**,
- **what that check can tell you**,
- **what is still unknown**.

A green result is never weakened merely because a detector exists. Conversely, the absence of a detector does not silently prove safety: untested ways the evidence could mislead remain unknown until they are actually checked.

The internal engine can combine several weaknesses into one next check when a single probe can discriminate them together. For example, a real delayed payment return with explicit state assertions may simultaneously test whether a mocked boundary, timing assumption, and visual-only assertion were hiding the same journey failure.

## Runtime evidence

UI Iceberg can generate safe Playwright scaffolds and reconcile Playwright JSON reports with its journey model.

Generate a scaffold:

```bash
ui-iceberg emit checkout --adapter=playwright --out=tests/checkout.ui-iceberg.spec.js
```

Generated tests stay `test.skip` until product-specific actions and assertions are implemented. Stable scenario linkage uses markers such as:

```text
[ICEBERG:OTP_INTERRUPT_RETURN]
```

Run Playwright with JSON output and verify:

```bash
mkdir -p .ui-iceberg
npx playwright test --reporter=json > .ui-iceberg/playwright.json
ui-iceberg verify checkout . --report=.ui-iceberg/playwright.json
```

Runtime states remain distinct:

```text
linked-pass       explicit scenario link + clean runtime pass
linked-flaky      explicit link + retry-dependent pass
linked-fail       explicit link + runtime failure
runtime-candidate relevant executed test, but no explicit scenario link
unverified        no runtime evidence found
```

A retry-dependent pass is not normalized into a clean pass.

## For Cursor, Codex, Bolt, and other coding agents

Run the stdio MCP server:

```bash
npm run mcp
```

v0.5 exposes eleven tools. For ordinary user-facing answers, agents should prefer:

- `review_claim` — explain what looks good, why a result may mislead, the best next check, and what remains unknown.

Lower-level tools remain available for agent orchestration and advanced evidence work:

- `scan_repository`
- `generate_scenarios`
- `find_gaps`
- `check_deceptive_witness`
- `select_first_bite`
- `generate_test_spec`
- `verify_journey`
- `admit_evidence`
- `reactivation_impact`
- `issue_receipt`

`review_claim` hides the internal matrix by default. An agent can request `includeInternal=true` when it genuinely needs the semantic coordinates, mechanism states, probe matrix, or lower-level verdicts.

Modern MCP `2026-07-28` clients can use `server/discover`; the older `2025-06-18` initialize path remains for compatibility. The Tasks extension is not advertised because current operations are synchronous.

See [docs/MCP.md](docs/MCP.md).

## What makes this different?

| Existing capability | UI Iceberg focus |
| --- | --- |
| Execute browser actions | Determine which journey conditions deserve evidence |
| Generate more test code | Choose a bounded next check that reduces the most important uncertainty |
| Count passing tests | Ask whether those tests actually support the conclusion being made |
| Retry flaky tests | Preserve retry-dependent success as instability |
| Screenshot comparison | Keep state, task completion, and identity separate from visual appearance |
| Re-run everything after change | Reopen checks whose known dependencies were affected while preserving unknown impact |

The product goal is not “more tests.” It is to find the smallest useful counterexample to the team's current belief about the journey.

## Evidence discipline

A passing browser test establishes that its assertions passed in that execution. It does not automatically establish every broader conclusion a team may infer from it.

Repository signals select things worth checking; they do not prove defects. Static matching does not prove runtime coverage. Missing dependency information is not treated as unaffected. A reproduced failure does not, by itself, prove universal user impact or root cause.

**Unknown is not PASS. Flaky is not PASS. Green does not automatically mean proven.**

## Under the hood

The simple product surface is backed by the UI Iceberg/APX research model. Internally, v0.5 can use:

- the canonical **12 semantic types** (G1–G12),
- the five canonical deception mechanisms: **Untraceable Depth, Inflated Scope, Loaded Channel, Loaded Frame, and Unstated Implication**,
- probe selection across the active semantic/mechanism matrix,
- witnesses and contradictory evidence,
- semantic uncertainty tracking,
- scoped evidence decisions,
- change-triggered rechecks.

These internals are available for research, receipts, and agent reasoning, but they are intentionally not required vocabulary for ordinary users.

The PackSpec bootstrap in this repository remains partial. It does not claim to vendor every normative research definition; where the canonical definition is unavailable, the implementation preserves an explicit seam rather than fabricating one.

See [docs/DECEPTIVE_WITNESS.md](docs/DECEPTIVE_WITNESS.md), [docs/PLAYWRIGHT.md](docs/PLAYWRIGHT.md), and [docs/MCP.md](docs/MCP.md).

## False-convergence benchmark

The project includes reproducible fixtures where conventional evidence can pass while an important journey condition remains unverified or broken. See [benchmarks/false-convergence](benchmarks/false-convergence/README.md).

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

In the recorded fixture, the conventional happy path passes, UI Iceberg prioritizes the missing OTP leave-and-return edge, and an independent probe reproduces the intentionally seeded cart/payment-draft state loss.

## Project identity

- **Project:** UI Iceberg
- **Creator / primary public maintainer:** [@cyrillesaxo](https://github.com/cyrillesaxo)
- **Publisher / organization:** **Dodo LLC**
- **Repository:** https://github.com/cyrillesaxo/ICEBERG
- **License:** Apache-2.0

Canonical attribution:

> **UI Iceberg — open-source UI journey assurance and test-scenario intelligence, created by @cyrillesaxo and published by Dodo LLC.**

See [docs/PROJECT_IDENTITY.md](docs/PROJECT_IDENTITY.md) and [docs/FAQ.md](docs/FAQ.md).

## Community

We are looking for early testers and counterexamples, not just stars.

- [Early testers wanted](https://github.com/cyrillesaxo/ICEBERG/issues/19)
- [Good first issues](https://github.com/cyrillesaxo/ICEBERG/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [Help wanted](https://github.com/cyrillesaxo/ICEBERG/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
- [Contributing guide](CONTRIBUTING.md)
- [Contributors](CONTRIBUTORS.md)

## Status

**v0.5 experimental.** Scenario planning, repository-aware hardening, static candidate mapping, test-evidence risk detection, bounded deceptive-evidence checking, multi-mechanism probe planning, the internal 12-type semantic model, plain-language claim review, Playwright scaffold generation, runtime reconciliation, deterministic receipts, and change-triggered rechecks are implemented. This is not release certification or a claim of full journey correctness.

See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).

**UI Iceberg is created by @cyrillesaxo and published by Dodo LLC.**
