# UI Iceberg MCP

UI Iceberg's MCP server is the executable public interface of the assurance compiler. It exposes bounded planning, deceptive-witness inspection, evidence reconciliation, admission, and change-reactivation operations to coding agents without promoting implementation signals or candidate evidence into proof.

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
Witness candidate
    ↓
Deceptive-witness check
    ↓
Witness / Antiwitness / Unknown
    ↓
Admission + Receipt
    ↓
TERM-style reactivation after change
```

The MCP server does not certify UI correctness by itself.

## Protocol support

v0.4 supports two protocol eras over stdio:

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
| `check_deceptive_witness` | Determine whether an apparent witness has a claim-blocking evidence-channel distortion | A product defect exists |
| `select_first_bite` | Select the next high-value discriminating probe, including a distortion probe when it contaminates the top scenario | Defect probability |
| `generate_test_spec` | Emit a skipped Playwright scaffold | An implemented or passing test |
| `verify_journey` | Reconcile explicit/runtime Playwright evidence | Human usability or production health |
| `admit_evidence` | Filter strong witnesses for deceptive evidence before issuing a scoped claim verdict | Stronger claim scopes not separately licensed |
| `reactivation_impact` | Invalidate prior assurance when dependencies/signals change | A regression exists |
| `issue_receipt` | Create a stable assurance handle and preserve boundaries | New evidence beyond its inputs |

## Evidence law

```text
signal
  → failure-pattern hypothesis
  → scenario
  → apparent witness
  → deceptive-witness check
  → First Bite / discriminating probe
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

## Deceptive witnesses

`check_deceptive_witness` is claim-aware. A green result can remain useful while licensing a narrower claim than the one a team may infer.

Example:

```text
linked-pass + NETWORK_MOCK
```

can support:

```text
frontend handled the supplied mocked response
```

without establishing:

```text
real authority callback semantics
production authority behavior
production journey health
```

The executable v0.4 rule set is intentionally bounded to the repository's current public test-evidence-risk detectors. It does not claim to implement the full 72-item research taxonomy referenced by the PackSpec validation receipt.

Current distortion families include:

- `TEMPORAL_ASSUMPTION`
- `ACTIONABILITY_BYPASS`
- `NON_EXECUTION_PRESENTED_AS_COVERAGE`
- `SUITE_EXCLUSION`
- `RETRY_LAUNDERING`
- `AUTHORITY_SUBSTITUTION`
- `ORACLE_SCOPE_NARROWING`
- `SEMANTIC_IDENTITY_DRIFT`
- `ASSERTION_FAILURE_MASKING`

See [DECEPTIVE_WITNESS.md](DECEPTIVE_WITNESS.md).

## Admission

`admit_evidence` currently recognizes three verdicts:

- `ADMITTED_WITH_SCOPE`
- `REJECTED`
- `INCONCLUSIVE`

Strong runtime witness states include `linked-pass`, `runtime-pass`, `reproduced-witness`, and `verified`.

Strong contradiction states include `linked-fail`, `runtime-fail`, and `reproduced-antiwitness`.

`linked-flaky`, `runtime-candidate`, `candidate-covered`, `partial`, `unknown`, and `unverified` preserve uncertainty and do not become PASS.

Before strong support can license the requested scope, v0.4 runs the bounded deceptive-witness check:

- `CLEAN_WITNESS` can license the scope;
- `WEAKENED_WITNESS` can license the scope when its known distortion does not block that scope;
- `DECEPTIVE_WITNESS_CANDIDATE` cannot license the blocked scope by itself;
- a clean independent witness can still license the scope while deceptive witnesses remain explicit;
- an antiwitness still rejects the scoped claim.

The default claim-license planes are:

- `technical-ui-runtime`
- `accessibility-complete`
- `cognitive-usability`
- `production-journey-health`
- `business-outcome`

Admission in one plane does not automatically propagate to another.

## First Bite

`select_first_bite` ranks supplied scenario gaps using existing ICEBERG priority and repository-pressure logic. It also accepts optional deceptive-witness inputs.

If a claim-blocking deceptive witness refers to the same scenario as the top gap, the recommendation changes from a generic scenario probe to the distortion-specific probe. Example:

```text
OTP_INTERRUPT_RETURN is the top gap
+
linked-pass relies on NETWORK_MOCK

=> PROBE_REAL_AUTHORITY_BOUNDARY
```

This is a deterministic recommendation heuristic, not a posterior defect probability.

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
- deceptive-witness audit,
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
check_deceptive_witness on apparent green support
      ↓
select_first_bite
      ↓
generate_test_spec / implement targeted probe
      ↓
execute the real probe
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

- vendor the normative full deceptive-witness taxonomy before claiming coverage beyond the bounded public subset,
- official TypeScript MCP SDK v2 transport migration,
- Streamable HTTP with 2026-07-28 routing/header validation,
- durable Tasks extension for genuinely long-running scans/replays,
- explicit WitnessGraph resource handles,
- richer dependency extraction for reactivation,
- other executor adapters beyond Playwright,
- MCP App visualization only when the underlying evidence model is stable.
