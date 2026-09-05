# Roadmap

## v0.1 — Scenario intelligence

- Repository scan
- Journey-family detection
- Prioritized scenario generation
- Static candidate coverage mapping
- MCP tools for coding agents
- JSON output for automation

## v0.2 — Playwright runtime evidence

Implemented in the bootstrap branch:

- Playwright JSON reporter adapter
- explicit test-to-scenario linkage
- retry-dependent `linked-flaky` state instead of false PASS
- runtime candidate evidence kept separate from explicit linkage
- skipped-by-default Playwright scenario scaffold generation
- `verify` CLI command
- `generate_test_spec` and `verify_journey` MCP tools
- bounded runtime journey status with explicit evidence caveats

Next hardening within the runtime line:

- semantic target identity extraction from Playwright locators
- interaction-readiness/actionability receipts
- runtime StateManifest / StateMissSet
- per-project/browser pressure coverage

## v0.3 — Journey stress

- interruption/resumption
- slow/failing network
- refresh/back/forward
- session expiry
- mobile/zoom/text-scale projections
- state-loss and task-stiction detection

## v0.4 — Change impact and CI

- ReactivationImpactGraph
- TERM evidence expiry
- affected-journey selection
- pull-request journey report

## Later

- visual-oracle region policy
- accessibility and Storybook adapters
- Selenium/Cypress/Katalon emission/adapters
- field-friction witnesses
- human-evidence licensing
- benchmark suite for human false convergence
