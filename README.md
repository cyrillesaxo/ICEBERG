# UI Iceberg

**Find what your UI tests forgot to test.**

UI Iceberg is open-source **test-scenario intelligence for critical user journeys**. It scans an existing UI codebase and test suite, generates a prioritized scenario plan, and shows important journey states and recovery paths that are still unverified.

It is designed to work **with** Playwright, Selenium, Cypress, Katalon, Storybook, accessibility scanners, and AI coding agents—not replace them.

> Your test runner tells you what passed. UI Iceberg helps you find what you never tested.

## Why

A team can have hundreds of passing UI tests and still miss:

- payment retry and duplicate-submit behavior,
- OTP / email-verification leave-and-return flows,
- session expiry and recovery,
- refresh/back/forward state loss,
- error states that force users to re-enter valid work,
- responsive/zoom states that hide the primary action,
- cancellation or consent paths with asymmetric friction,
- state and journey edges that no existing test represents.

The first problem UI Iceberg solves is simple:

> **What should I test, and what important scenarios am I missing?**

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

```text
UI ICEBERG
Repository scan
────────────────────────────────────────────
Project              my-store
Files                418
Existing tests       52
UI frameworks        react
Test tools           playwright, storybook, axe

Candidate journeys
  • checkout
  • signup
  • login
```

### `scenarios` — what should I test?

```text
UI ICEBERG
checkout scenarios
────────────────────────────────────────────
 1. [CRITICAL] Payment is declined, the user corrects the issue, and retries
 2. [CRITICAL] Payment succeeds but confirmation or entitlement is delayed
 3. [CRITICAL] Leave checkout for OTP or bank verification and return with state intact
 4. [CRITICAL] Refresh after payment success without creating a duplicate order
 5. [CRITICAL] Recover after a request fails and retry successfully
 ...
```

### `gaps` — what am I missing?

```text
UI ICEBERG
checkout journey
────────────────────────────────────────────
Existing tests        84
Important scenarios   18
Candidate covered      9
Partial                 3
Missing                 6

HIGH-VALUE GAPS

? Leave checkout for OTP or bank verification and return with state intact
  Priority: CRITICAL | Evidence: missing

? Refresh after payment success without creating a duplicate order
  Priority: CRITICAL | Evidence: missing

TEST NEXT
Leave checkout for OTP or bank verification and return with state intact
```

**Important:** v0.1 static mapping is deliberately called *candidate evidence*. Lexical overlap with a test file is useful for discovery, but it does not prove runtime or human journey coverage. Strong verification comes later through explicit linkage and replay.

## For Cursor, Codex, Bolt and other coding agents

UI Iceberg includes an experimental stdio MCP server:

```bash
npm run mcp
```

It exposes:

- `scan_repository` — inspect the codebase and current test stack,
- `generate_scenarios` — answer “what should this journey test?”,
- `find_gaps` — answer “which important scenarios appear unverified?”.

The intended agent workflow is:

```text
User requirement
      ↓
Coding agent builds the feature
      ↓
UI Iceberg generates an independent journey scenario plan
      ↓
Agent writes / updates tests
      ↓
UI Iceberg maps the remaining gaps
```

The coding agent is the builder. **UI Iceberg is the independent test-scenario and evidence layer.**

## What makes this different from AI + Selenium/Katalon?

UI Iceberg is not primarily another test executor or LLM prompt wrapper.

| Existing capability | UI Iceberg focus |
| --- | --- |
| Execute browser actions | Determine which journey conditions deserve evidence |
| Generate test code | Generate and prioritize a persistent scenario model |
| Count passed tests | Map evidence against important journey states/edges |
| Heal selectors | Preserve semantic target identity before accepting substitution |
| Retry flaky tests | Treat retry-dependent success as instability evidence |
| Visual diff | License what a visual baseline is allowed to prove |
| Accessibility scan | Keep human/access-channel claims explicit when automation is insufficient |

The long-term goal is **journey assurance**: critical flows should be complete, recoverable, understandable, and sufficiently evidenced across relevant states and changes.

## Product vocabulary

The default UI stays familiar:

**Journey → Steps → Scenarios → Coverage gaps → Test next → Verify**

Internally, the PackSpec maps those concepts into ContextOfUse, TaskGraph, UI-12, UX-12, state/pressure matrices, MissSet, First Bite, WitnessGraph, admission, replay, and TERM. See [docs/VOCABULARY.md](docs/VOCABULARY.md).

## Current v0.1 scope

UI Iceberg currently provides a deliberately narrow vertical slice:

- static repository/test-stack discovery,
- common critical-journey detection,
- prioritized scenario generation,
- static candidate evidence mapping,
- CLI JSON output,
- experimental MCP access for coding agents.

It **does not yet claim** runtime scenario coverage, cognitive usability proof, accessibility completeness, or production journey health.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the runtime/CI plan.

## Research foundation

The product is backed by the UI Iceberg PackSpec research line. v0.7.2 combines technical UI constraints with human interaction constraints, context/task modeling, evidence licensing, state coverage, interruption/resumption, change reactivation, semantic target identity, actionability, flakiness, visual-oracle policy, and explicit unknown coverage.

The PackSpec stays underneath the simple product funnel so users do not need to learn research vocabulary before receiving value.

## False-convergence benchmark

The project includes an evolving benchmark for cases where conventional evidence can pass while an important journey condition remains unverified or broken. See [benchmarks/false-convergence](benchmarks/false-convergence/README.md).

## Status

**v0.1 bootstrap / experimental.** The current scenario catalog and static evidence matcher are useful for planning and discovery, not release certification.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache License 2.0. See [LICENSE](LICENSE).

Open-source project by **Dodo LLC**.
