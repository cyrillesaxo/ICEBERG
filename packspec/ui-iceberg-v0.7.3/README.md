# UI Iceberg PackSpec v0.7.3 — Semantic Manifold Assurance Delta

v0.7.3 preserves the v0.7.2 UI/human constraint surfaces and adds an executable RCT semantic-assurance projection. It does **not** replace the existing scenario, pressure, witness, First Bite, admission, TERM, or replay primitives.

## New executable obligations

1. Map relevant UI journey scenarios onto the existing G1-G12 typed semantic taxonomy.
2. Preserve direction as typed semantic drift `Delta_G`; do not embed entropy inside the direction sign.
3. Compute semantic entropy `H_S` and semantic risk `R_S` as separate fields on the local journey chart.
4. Report entropy/risk trace between receipts when temporal evidence exists; otherwise label the result `reference-to-observed`.
5. Measure deceptive witnesses as claim-license defects, not automatic product defects.
6. Do not grant independence credit to multiple observations until distinct evidence channels are established.
7. Expose cross-coordinate coupling candidates without inventing a metric-tensor weight when no evidence licenses one.
8. Refine First Bite using uncertainty killed, decision-critical coverage, pressure discrimination, coupling coverage, and relative probe cost.
9. Keep engineering cost bands ordinal unless authoritative estimation evidence is supplied.
10. Preserve `UNKNOWN != PASS`, `ABSENT != UNKNOWN`, and `FLAKY != PASS`.

## G1-G12 UI chart

| Coordinate | UI meaning |
| --- | --- |
| G1 Label | wording / lexical identity |
| G2 Node | semantic target / entity identity |
| G3 Boundary | limits / validation / reachable edges |
| G4 Edge | navigation / state transitions |
| G5 Operation | actions / effects |
| G6 Perspective | role / actor / device / access channel |
| G7 Granularity | grouping / list-detail / scale |
| G8 Evidence | confirmation / feedback / proof state |
| G9 Prerequisite | preconditions / permissions / required state |
| G10 Conflict | races / duplicates / contradictory states |
| G11 Temporal | retry / ordering / expiry / interruption / freshness |
| G12 Authority | backend ownership / delegation / approval |

## Manifold projection

For each applicable coordinate:

```text
Delta_i = p_hat_i(observed evidence) - p_i(target)
p_i(target) = 1 for an admitted required invariant
```

The static scanner uses bounded support estimates because lexical overlap is not runtime proof. Deceptive-witness pressure retracts unjustified support toward the unresolved prior rather than fabricating a failure.

## Entropy and risk

```text
H_S = weighted binary entropy over bounded p_hat values
R_S = weighted (1 - p_hat)
```

The two fields must remain separate so that low-entropy/high-risk **deceptive stabilization** remains representable.

## First Bite

```text
maximize
  (uncertainty killed
   + decision-critical coverage
   + pressure discrimination
   + coupling coverage)
  / relative probe cost
```

A probe recommendation must retain its evidence boundary and must not be presented as defect probability, dollar cost, or universal safety proof.

## Implementation

- `packages/core/src/semantic-assurance.js`
- `packages/cli/bin/ui-iceberg-semantic.js`
- `test/semantic-assurance.test.js`
- `skills/ui-iceberg/references/EVIDENCE_MODEL.md`

Run the advanced report with:

```bash
node packages/cli/bin/ui-iceberg-semantic.js checkout examples/quickstart-checkout
```
