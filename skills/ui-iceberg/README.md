# UI Iceberg Agent Skill

Portable Agent Skills bundle for applying UI Iceberg's journey-assurance and evidence discipline from skills-compatible AI agents.

## Contents

```text
ui-iceberg/
├── SKILL.md
├── references/
│   ├── OPERATIONS.md
│   ├── EVIDENCE_MODEL.md
│   └── CONSTRAINT_SURFACES.md
├── assets/
│   └── ICEBERG_RECEIPT_TEMPLATE.md
├── examples/
│   └── LEXYREAD.md
└── evals/
    └── trigger-cases.json
```

`SKILL.md` is the activation and workflow layer. Detailed material is progressively disclosed from the references only when required.

## Typical prompts

- `@ui-iceberg scan this repository and tell me what to test next.`
- `@ui-iceberg our tests are green but mobile navigation is inconsistent across pages. Find the hidden constraint and verify the fix.`
- `@ui-iceberg generate evidence-linked Playwright scenarios for checkout interruption and recovery.`
- `@ui-iceberg verify whether this UI repair actually closes the journey gap.`
- `@ui-iceberg create an assurance receipt for this release.`

## Execution modes

The skill supports three modes:

1. UI Iceberg MCP (`scan_repository`, `generate_scenarios`, `find_gaps`, `generate_test_spec`, `verify_journey`).
2. UI Iceberg CLI (`scan`, `scenarios`, `gaps`, `emit`, `verify`).
3. Manual evidence-disciplined analysis when the runtime is unavailable, with an explicit statement that ICEBERG was not executed.

## Core safety/quality boundary

```text
repository signal -> scenario hypothesis -> probe -> evidence
```

A signal is not a proven defect. Static candidate evidence is not runtime proof. Retry-dependent success stays flaky. Unknown is not PASS.

## Source

The skill is derived from the `bootstrap-v0.1` product branch and its UI Iceberg PackSpec v0.7.2 bootstrap materials.

UI Iceberg is created by `@cyrillesaxo` and published by Dodo LLC under Apache-2.0.
