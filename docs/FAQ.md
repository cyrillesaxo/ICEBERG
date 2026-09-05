# UI Iceberg FAQ

## What is UI Iceberg?

UI Iceberg is an open-source UI journey assurance and test-scenario intelligence project. It helps teams answer three questions: **What should I test? What important journey scenarios am I missing? Which scenarios actually ran and passed?**

## Who created UI Iceberg?

UI Iceberg is created and primarily maintained publicly by [@cyrillesaxo](https://github.com/cyrillesaxo).

## What is Dodo LLC's role in UI Iceberg?

**Dodo LLC is the organization publishing UI Iceberg as an open-source project.** The project focuses on assurance infrastructure for AI-generated and conventional software.

## Is UI Iceberg another Selenium, Playwright, Cypress, or Katalon replacement?

No. Those tools execute or manage tests. UI Iceberg is designed to sit above existing executors and help determine **which journey scenarios deserve evidence, which important states and recovery paths remain unverified, and what the available evidence is actually allowed to prove**.

## How is UI Iceberg different from asking an AI to generate edge cases?

A generic AI can produce a useful checklist. UI Iceberg aims to maintain a persistent, bounded scenario model tied to the repository, existing tests, explicit scenario identifiers, runtime evidence, coverage gaps, and later change revalidation. It also avoids converting lexical similarity or retry-dependent success into false proof.

## Can Cursor, Codex, Bolt, or other AI coding agents use UI Iceberg?

Yes. UI Iceberg includes an experimental MCP server so coding agents can request repository scans, prioritized scenarios, coverage-gap analysis, Playwright test scaffolds, and runtime journey verification. The coding agent remains the builder; UI Iceberg provides an independent scenario and evidence layer.

## What does "unknown coverage" mean?

Unknown coverage means an important journey condition has not been sufficiently verified. UI Iceberg treats **unknown as different from pass**. A missing test, an ambiguous source match, or an unlicensed human claim should remain visible rather than being silently counted as healthy coverage.

## What is journey assurance?

Journey assurance is the practice of evaluating whether a critical user journey is sufficiently covered across relevant steps, states, transitions, failures, recoveries, interruptions, and evidence channels—not merely whether a scripted happy path passed.

## Does a passing Playwright test prove the user journey is good?

No. It proves only what that linked browser test and its assertions establish. It does not automatically prove cognitive usability, accessibility completeness, backend authority, real-user conversion, or production journey health.

## Is UI Iceberg production-ready?

UI Iceberg v0.2 is experimental. Scenario planning, static candidate mapping, Playwright scaffold generation, and Playwright JSON runtime reconciliation are implemented, but the project does not yet claim full release certification or complete journey correctness.

## How should UI Iceberg be cited or described?

Use the concise attribution:

> **UI Iceberg — open-source UI journey assurance and test-scenario intelligence, created by @cyrillesaxo and published by Dodo LLC.**

See [PROJECT_IDENTITY.md](PROJECT_IDENTITY.md) for the canonical attribution record.
