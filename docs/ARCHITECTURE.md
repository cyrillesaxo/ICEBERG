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

The default product surface stays intentionally simple. The RCT/APX substrate remains available to advanced users, machine-readable receipts, coding agents, and research evaluation.

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
| Deceptive green | Deceptive Witness / claim-license correction |
| Verify | Replay + admission |
| Regression impact | TERM + ReactivationImpactGraph |

## RCT semantic-assurance layer

UI Iceberg now has an explicit semantic-manifold projection for advanced assurance.

The local journey chart is represented with the typed G1-G12 semantic taxonomy:

```text
G1  Label         G7  Granularity
G2  Node          G8  Evidence
G3  Boundary      G9  Prerequisite
G4  Edge          G10 Conflict
G5  Operation     G11 Temporal
G6  Perspective   G12 Authority
```

The compiler maps each scenario and repository pressure onto the applicable semantic coordinates, then computes a bounded evidence-state projection against the admitted journey regime.

```text
scenario + pressure
        ↓
G1-G12 typed coordinates
        ↓
Witness / Antiwitness / Deceptive-Witness audit
        ↓
corrected evidence support
        ↓
typed drift Δ_G
        ↓
semantic entropy H_S + semantic risk R_S
        ↓
entropy/risk flux
        ↓
coupling candidates
        ↓
First Bite
```

For an applicable coordinate `G_i`, the current static implementation uses the admitted regime as the reference point:

```text
Δ_i = p_hat_i(observed evidence) - p_i(target)
p_i(target) = 1
```

A negative value therefore means the current evidence state remains away from the admitted regime. Static lexical evidence is deliberately weakly licensed, so it cannot drive `p_hat` close to certainty.

Semantic entropy and semantic risk remain separate objects:

```text
H_S = weighted binary entropy over bounded constraint-satisfaction estimates
R_S = weighted (1 - p_hat)
```

When a previous semantic-assurance receipt is supplied, the compiler reports temporal entropy/risk flux. Without a previous receipt it reports the reference-to-observed delta and labels that mode explicitly.

### Deceptive-witness correction

UI Iceberg does not convert a suspicious green test into a product failure. Instead, a deceptive-witness finding narrows the conclusion that the witness is allowed to license.

Examples include:

- fixed elapsed waits presented as readiness evidence;
- forced actions presented as natural user actionability;
- retry-dependent success presented as deterministic stability;
- network mocks presented as production authority/integration evidence;
- visual equality presented as semantic correctness;
- index-based selector resolution presented as target identity;
- multiple lexical matches counted as independent witness channels.

The correction moves unjustified certainty back toward `unknown`; it does not manufacture negative evidence.

### First Bite

The expert semantic report ranks the next probe using a bounded objective:

```text
(uncertainty killed
 + decision-critical coverage
 + pressure discrimination
 + coupling coverage)
 / relative probe cost
```

Relative cost is only a probe-ordering band (`low`, `low-medium`, `medium`). UI Iceberg does not invent engineering dollar estimates or timelines from repository text.

The implementation is exposed through:

```bash
node packages/cli/bin/ui-iceberg-semantic.js <journey> [path]
```

and the package API:

```js
import { analyzeJourneySemantics } from "ui-iceberg/semantic-assurance";
```

## v0.1 vertical slice

The initial CLI intentionally does three things:

- `scan`: discover the repository, test stack, and candidate journey families.
- `scenarios`: produce a prioritized scenario plan from the UI Iceberg scenario catalog.
- `gaps`: map existing test source to those scenarios and identify candidate gaps.

Static source matching remains deliberately marked **candidate evidence**. Strong coverage requires explicit test linkage and/or runtime execution.

The semantic-assurance layer is an advanced projection over that evidence. It does not upgrade static evidence into runtime proof.

## Agent architecture

The MCP server exposes the same core scenario engine to coding agents. The coding agent remains the builder; UI Iceberg supplies an independent scenario model and evidence policy.

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

The semantic-assurance API can additionally project those gaps onto G1-G12, measure deceptive-witness pressure, and select a bounded First Bite. MCP exposure of the full semantic receipt remains a separate integration surface rather than silently changing existing tool contracts.
