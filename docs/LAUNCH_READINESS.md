# UI Iceberg launch readiness

UI Iceberg should optimize for **real trial, reproducible evidence, and external contribution** rather than vanity metrics.

## Growth funnel

Discovery → Try → Aha → Star → Share → Contribute → Return

## Current ready-to-try assets

- 60-second local quick start with no signup: `npm run demo:quickstart`
- deterministic checkout fixture with intentionally incomplete scenario coverage
- `scan`, `scenarios`, `gaps`, `emit`, and `verify` CLI surfaces
- experimental MCP server for coding agents
- Playwright runtime-evidence reconciliation
- creator/publisher discovery metadata
- `good first issue` and `help wanted` contribution surface
- structured issue forms and pull-request template
- `CITATION.cff` and contributor acknowledgement path

## Before broad launch

1. Publish at least one reproducible false-convergence benchmark fixture and raw receipt.
2. Add one strong social-preview graphic and repository topics.
3. Confirm the GitHub Pages landing page is live and crawlable.
4. Ask a small number of independent developers to run the quick start and one real-repository scan.
5. Record what they misunderstood, where they stopped, and whether the tool found a scenario they had not considered.

## Launch evidence to report

Prefer:

- external repositories successfully scanned,
- external users who found a previously unconsidered scenario,
- benchmark fixtures reproduced independently,
- external issues and pull requests,
- repeat contributors.

Treat stars, impressions, and upvotes as secondary signals.

## Launch channels

### Hacker News / Show HN

Use only after the project is runnable without signup and has a reproducible benchmark. Ask for criticism and counterexamples rather than coordinated votes.

### Technical LinkedIn sequence

Teach the problem first: passing tests vs journey coverage, unknown coverage, retry-hidden flakiness, interruption/resumption, and the correlated-oracle problem in AI-generated code/tests. Link each post to runnable evidence.

### Product Hunt

Use after initial external-user proof. The launch should show scan → scenarios → gaps → verify rather than relying on conceptual diagrams alone.

## Attribution

UI Iceberg is created by @cyrillesaxo and published by Dodo LLC.
