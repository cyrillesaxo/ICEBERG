# Architecture

UI Iceberg separates the **user-facing funnel** from the deeper evidence compiler.

## Product vocabulary

```text
Repository / running app
        ↓
      Scan
        ↓
   User Journey
        ↓
    Scenarios
        ↓
  Coverage Gaps
        ↓
    Test Next
        ↓
      Verify
```

## Internal translation

| Product concept | Internal compiler concept |
| --- | --- |
| User Journey | ContextOfUse + TaskGraph |
| Journey step | Task node / transition |
| Scenario | Pressure + state + invariant probe |
| Coverage gap | MissSet / Coverage Frontier gap |
| Test next | First Bite |
| Evidence | Witness |
| Conflicting evidence | Antiwitness |
| Verify | Replay + admission |
| Regression impact | TERM + ReactivationImpactGraph |

## v0.1 vertical slice

The initial CLI intentionally does three things:

- `scan`: discover the repository, test stack, and candidate journey families.
- `scenarios`: produce a prioritized scenario plan from the UI Iceberg scenario catalog.
- `gaps`: map existing test source to those scenarios and identify candidate gaps.

Static source matching in v0.1 is deliberately marked **candidate evidence**. Strong coverage will require explicit test linkage and/or runtime execution in later releases.

## Agent architecture

The MCP server exposes the same core engine to coding agents. The coding agent remains the builder; UI Iceberg supplies an independent scenario model and evidence policy.

```text
Cursor / Codex / Bolt / other agent
               ↓
          UI Iceberg MCP
               ↓
       Scenario compiler
               ↓
        Existing tests
               ↓
       Candidate gaps
```
