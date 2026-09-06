# UI Iceberg MCP

UI Iceberg's MCP server is the executable interface for journey planning, evidence review, probe selection, runtime reconciliation, and change-triggered rechecks.

The default user-facing operation is intentionally simple:

```text
review_claim
  -> what looks good
  -> why the result may be misleading
  -> best next check
  -> what the check can tell you
  -> what is still unknown
```

The deeper research machinery remains available to agents, but it is not required user vocabulary.

## Architectural role

```text
PackSpec / research model
        ↓
Agent Skill
        ↓
MCP executable operations
        ↓
ICEBERG assurance compiler
        ↓
plain-language translation layer
        ↓
user-facing claim review
```

Executors such as Playwright produce runtime evidence. ICEBERG does not certify UI correctness by itself.

## Protocol support

v0.5 supports:

- modern MCP `2026-07-28` through `server/discover` and per-request `_meta`,
- legacy `2025-06-18` `initialize` for compatibility.

Modern `tools/list` responses include cache hints and server identity metadata.

The Tasks extension is not advertised because current ICEBERG operations are synchronous.

## Tools

| Tool | Primary role |
| --- | --- |
| `scan_repository` | Inspect UI/test stack, implementation pressures, and test-evidence risks |
| `generate_scenarios` | Produce a bounded journey scenario set |
| `find_gaps` | Identify important missing/partial scenario evidence |
| `review_claim` | Produce the default plain-language user result |
| `check_deceptive_witness` | Advanced: inspect one apparent witness for evidence distortion |
| `select_first_bite` | Advanced: rank the next discriminating scenario/probe |
| `generate_test_spec` | Emit a skipped Playwright scaffold |
| `verify_journey` | Reconcile Playwright runtime evidence |
| `admit_evidence` | Advanced: issue a scoped evidence verdict |
| `reactivation_impact` | Determine which prior checks must be reopened after change |
| `issue_receipt` | Create a deterministic assurance receipt |

No tool turns a static repository signal into proof of a product defect.

## `review_claim`

`review_claim` is the preferred operation when the agent needs to explain a result to a developer, QA lead, product owner, or other ordinary user.

Example input:

```json
{
  "claim": {
    "id": "checkout-otp",
    "statement": "Checkout survives OTP interruption and return."
  },
  "evidence": [
    {
      "id": "W1",
      "state": "linked-pass",
      "channel": "playwright",
      "evidenceRisks": ["NETWORK_MOCK", "VISUAL_ONLY_ORACLE"]
    }
  ]
}
```

Default output shape:

```json
{
  "userFacing": {
    "status": "needs-check",
    "headline": "The tests may be green, but the current evidence does not yet support this claim.",
    "whatLooksGood": [],
    "whyThisMayBeMisleading": [],
    "bestNextCheck": {},
    "whatThisCheckCanTellYou": "...",
    "stillUnknown": []
  }
}
```

The default result does **not** expose G-codes, deceptive-witness class names, semantic entropy, First Bite, admission, antiwitness, TERM, or similar internal vocabulary.

Set `includeInternal=true` only when an agent, researcher, receipt, or governance workflow genuinely needs the underlying structures.

## Internal semantic model

v0.5 embeds the canonical 12 semantic types used elsewhere in the research program:

- G1 Label
- G2 Node
- G3 Boundary
- G4 Edge
- G5 Operation
- G6 Perspective
- G7 Granularity
- G8 Evidence
- G9 Prerequisite
- G10 Conflict
- G11 Temporal
- G12 Authority

The 12 types are not a flat checklist shown to the user. They are internal coordinates for locating where a claim or transition can lose meaning.

## Five canonical deception mechanisms

The claim challenge layer uses the five canonical mechanisms from the Deceptive Witness research line:

1. `UNTRACEABLE_DEPTH` — shallow evidence posing as deep evidence
2. `INFLATED_SCOPE` — narrow evidence stretched broad
3. `LOADED_CHANNEL` — the medium/presentation doing evidentiary work
4. `LOADED_FRAME` — framing steering the target conclusion
5. `UNSTATED_IMPLICATION` — conclusions smuggled in through what is unsaid

These are distinct from the five evidence-system failures in the research program. Do not collapse the two lists.

A mechanism remains `unknown` when no detector fires. Absence of a detected trigger is not a clean bill of health. A mechanism becomes `checked-clear` only through an explicit check.

## Probe matrix

The claim challenge engine combines:

```text
active semantic types
×
five deception mechanisms
×
probe candidates
```

A probe can cover more than one mechanism and more than one semantic coordinate. The planner therefore prefers a bounded check that resolves several important uncertainties at once when possible.

Example conceptually:

```text
real delayed OTP return + explicit state assertions
    ↓
can challenge simulated authority
+ timing assumptions
+ visual-only evidence
+ implied state continuity
```

Probe scores are ordinal prioritization heuristics. They are not defect probabilities.

## Lower-level deceptive-evidence classifier

`check_deceptive_witness` remains available for detailed agent work. It detects a bounded public subset derived from repository test-evidence-risk patterns, including:

- fixed waits,
- forced actions,
- skipped/focused tests,
- retries,
- network mocks,
- visual-only oracles,
- index-based targets,
- soft/failure-tolerant assertion configurations.

Those detector-specific distortions feed the five canonical mechanism coordinates used by `review_claim`.

The PackSpec validation receipt references a larger research taxonomy. The repository does not claim to execute normative definitions that are not vendored.

## Evidence verdicts

The lower-level `admit_evidence` operation keeps three verdicts:

- `ADMITTED_WITH_SCOPE`
- `REJECTED`
- `INCONCLUSIVE`

A clean runtime result can license only the requested scope. Retry-dependent, candidate, unknown, or claim-blocked evidence remains inconclusive. Strong contradictory runtime evidence rejects the evaluated claim under the tested conditions.

A technical runtime result does not automatically establish cognitive usability, accessibility completeness, production journey health, root cause, or business outcome.

## Change rechecks

`reactivation_impact` maps changed files/signals to previously evaluated scenarios. Unmapped changed files remain unknown rather than being treated as safe.

```text
unmapped change = unknown impact
```

not:

```text
unmapped change = unaffected
```

## Receipts

`issue_receipt` can preserve:

- project/journey,
- scan and gap map,
- detailed evidence audit,
- plain-language claim review,
- next check,
- lower-level verdict,
- change-reactivation state,
- allowed conclusion,
- non-established claims,
- residual unknowns.

A receipt preserves evidence state; it does not create new evidence.

## Recommended agent flow

For a normal product answer:

```text
scan_repository
      ↓
find_gaps
      ↓
review_claim
      ↓
run best next check when implementation access exists
      ↓
verify_journey
      ↓
review_claim again
```

For advanced assurance/governance:

```text
scan_repository
      ↓
find_gaps
      ↓
check_deceptive_witness
      ↓
select_first_bite
      ↓
execute probe
      ↓
verify_journey
      ↓
admit_evidence
      ↓
issue_receipt
      ↓
reactivation_impact after change
```

## Future work

Potential additions remain evidence-gated:

- official TypeScript MCP SDK v2 transport migration,
- Streamable HTTP routing/header validation,
- durable Tasks only for genuinely long-running work,
- explicit WitnessGraph resource handles,
- richer dependency extraction for rechecks,
- executor adapters beyond Playwright,
- visual MCP surfaces only after the underlying evidence model is stable.
