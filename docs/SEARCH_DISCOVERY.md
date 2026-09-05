# Search and AI discovery strategy

UI Iceberg uses ordinary, crawlable, people-first project content rather than search-engine-only pages.

## Entity consistency

The repository repeats the same factual relationships across the README, project landing page, FAQ, CodeMeta record, and package metadata:

- **UI Iceberg** — the software project.
- **@cyrillesaxo** — creator and primary public maintainer.
- **Dodo LLC** — publisher / organization behind the open-source project.

Canonical phrasing:

> UI Iceberg is open-source UI journey assurance and test-scenario intelligence created by @cyrillesaxo and published by Dodo LLC.

## Search intent covered by useful content

The public documentation directly answers questions real developers and AI coding-tool users may ask:

- What is UI Iceberg?
- Who created UI Iceberg?
- What is Dodo LLC's role in UI Iceberg?
- How is UI Iceberg different from Playwright, Selenium, Cypress, or Katalon?
- How is UI Iceberg different from generic AI edge-case generation?
- Can Cursor, Codex, Bolt, and other coding agents use UI Iceberg?
- What is unknown coverage?
- What is journey assurance?

These answers are consolidated in `docs/FAQ.md` rather than generating many thin query-targeted pages.

## Technical discovery assets

- `docs/index.html` — crawlable project page with visible attribution and JSON-LD entity relationships.
- `codemeta.json` — machine-readable software metadata.
- `docs/sitemap.xml` — page discovery once GitHub Pages is enabled.
- `docs/robots.txt` — permits public crawling.
- `.github/workflows/pages.yml` — publishes `docs/` after merge to `main` when GitHub Pages is configured to use GitHub Actions.
- `test/discovery-metadata.test.js` — prevents creator/publisher attribution from silently drifting.

## Important limitation

Metadata does not guarantee ranking, indexing, citation, or inclusion in any AI-generated answer. The strongest long-term discovery signal should come from original technical artifacts: releases, benchmark results, reproducible false-convergence cases, external users, citations, issue discussions, and independent links to the project.
