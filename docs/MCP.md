# UI Iceberg MCP

UI Iceberg's MCP server is the executable public interface of the assurance compiler. It exposes bounded planning, evidence reconciliation, admission, and change-reactivation operations to coding agents without promoting implementation signals or candidate evidence into proof.

## Architectural role

```text
PackSpec       defines the semantic regime
    ↓
Agent Skill    defines reasoning/orchestration policy
    ↓
MCP            exposes deterministic executable operations
    ↓
ICEBERG        compiles scenarios, gaps, evidence state, and change impact
    ↓
Playwright / other executors / human probes
               produce evidence
    ↓
Witness / Antiwitness
    ↓
Admission + Receipt
    ↓
TERM-style reactivation after change
```

The MCP server does not certify UI correctness by itself.

## Protocol support

v0.3 supports two protocol eras over stdio:

- modern MCP `2026-07-28` through `server/discover` and per-request `_meta`,
- the legacy `2025-06-18` `initialize` handshake for compatibility.

Modern `tools/list` responses include cache hints. Modern responses carry server identity in `_meta`.

The Tasks extension is intentionally not advertised yet. Current ICEBERG operations are synchronous, and capability declarations must follow implementation evidence rather than roadmap intent.

## Tools

| Tool | Role | Does not establish |
| --- | --- | --- |
| `scan_repository` | Detect candidate journeys, implementation pressures, test stack, evidence risks | A defect exists |
| `generate_scenarios` | Produce a bounded scenario hypothesis set | The scenarios occur in production |
| `find_gaps` | Map candidate test evidence and rank missing/partial scenarios | Runtime coverage |
| `select_first_bite` | Select the next high-value discriminating probe | Defect probability |
| `generate_test_spec` | Emit a skipped Playwright scaffold | An implemented or passing test |
| `verify_journey` | Reconcile explicit/runtime Playwright evidence | Human usability or production health |
| `admit_evidence` | Issue a scoped claim verdict from witness/antiwitness evidence | Stronger claim scopes not separately licensed |
| `reactivation_impact` | Invalidate prior assurance when dependencies/signals change | A regression exists |
| `issue_receipt` | Create a stable assurance handle and preserve boundaries | New evidence beyond its inputs |

## Evidence law

```text
signal
  → failure-pattern hypothesis
  → scenario
  → discriminating probe
  → evidence
  → witness / antiwitness
  → scoped admission
```

Never collapse it into:

```text
signal → defect
```

or:

```text
passing test → journey verified → human outcome verified
```

## Admission

`admit_evidence` currently recognizes three verdicts:

- `ADMITTED_WITH_SCOPE`
- `REJECTED`
- `INCONCLUSIVE`

Strong runtime witness states include `linked-pass`, `runtime-pass`, `reproduced-witness`, and `verified`.

Strong contradiction states include `linked-fail`, `runtime-fail`, and `reproduced-antiwitness`.

`linked-flaky`, `runtime-candidate`, `candidate-covered`, `partial`, `unknown`, and `unverified` preserve uncertainty and do not become PASS.

The default claim-license planes are:

- `technical-ui-runtime`
- `accessibility-complete`
- `cognitive-usability`
- `production-journey-health`
- `business-outcome`

Admission in one plane does not automatically propagate to another.

## First Bite

`select_first_bite` ranks supplied scenario gaps using existing ICEBERG priority and repository-pressure logic. It returns one `testNext` plus a few alternatives.

The ranking is a recommendation heuristic. It is not a posterior defect probability and must not be described as one.

## Reactivation / TERM

`reactivation_impact` accepts changed files, changed implementation-pressure signals, and a prior scenario set.

A scenario is reactivated when an explicit dependency or known scenario pressure intersects the change. Changed files that cannot be mapped to explicit scenario dependencies remain in `unknown.files`.

This makes the safe default:

```text
unmapped change = unknown impact
```

not:

```text
unmapped change = unaffected
```

## Receipts

`issue_receipt` creates a deterministic `receipt://...` identifier from semantic input. A receipt can link:

- project and journey,
- scan,
- gap map,
- Test Next,
- admission,
- reactivation state,
- allowed conclusion,
- explicitly non-established claims,
- residual unknowns.

The receipt is a compact evidence-state handle, not a certificate of universal correctness.

## Recommended agent flow

```text
scan_repository
      ↓
find_gaps
      ↓
select_first_bite
      ↓
generate_test_spec
      ↓
implement + execute the real probe
      ↓
verify_journey
      ↓
admit_evidence
      ↓
issue_receipt
      ↓
meaningful code change
      ↓
reactivation_impact
```

## Future work

Potential future additions should remain evidence-gated:

- official TypeScript MCP SDK v2 transport migration,
- Streamable HTTP with 2026-07-28 routing/header validation,
- durable Tasks extension for genuinely long-running scans/replays,
- explicit WitnessGraph resource handles,
- richer dependency extraction for reactivation,
- other executor adapters beyond Playwright,
- MCP App visualization only when the underlying evidence model is stable.
