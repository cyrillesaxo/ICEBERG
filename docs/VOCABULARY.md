# Vocabulary

The project deliberately uses two vocabularies.

## Default product language

- **Journey** — a user goal that crosses one or more UI states.
- **Step** — a meaningful point in the journey.
- **Scenario** — one condition under which the journey should be exercised.
- **Blocker** — prevents the journey from reaching its goal.
- **Friction** — unnecessary effort, waiting, decision load, navigation, or rework.
- **Coverage gap** — an important scenario with insufficient evidence.
- **Lost progress** — recoverable user work or context disappears.
- **Dead end** — no valid path to continue the journey.
- **Test next** — the highest-value next scenario to implement or execute.
- **Verify** — replay the relevant evidence after a change or repair.

## Advanced/internal language

The PackSpec and semantic-assurance layer use TaskGraph, invariant, pressure, witness, antiwitness, deceptive witness, MissSet, First Bite, admission, semantic manifold, typed drift, semantic entropy, semantic risk, entropy/risk flux, coupling, TERM, and reactivation. These terms remain available for advanced users and machine-readable receipts, but they are not the onboarding vocabulary.

### G1-G12 typed semantic coordinates

- **G1 Label** — names, wording, lexical identity.
- **G2 Node** — semantic entity or target identity.
- **G3 Boundary** — limits, thresholds, validation, reachable edges.
- **G4 Edge** — transitions, navigation, state relations.
- **G5 Operation** — user/system actions and effects.
- **G6 Perspective** — role, actor, device, access channel, viewpoint.
- **G7 Granularity** — grouping, list/detail, pagination, information scale.
- **G8 Evidence** — confirmation, feedback, assertion, proof state.
- **G9 Prerequisite** — preconditions, permissions, validation, required state.
- **G10 Conflict** — races, duplicates, competing actions, contradictory states.
- **G11 Temporal** — timing, ordering, retry, expiry, interruption, freshness.
- **G12 Authority** — authoritative source, role delegation, backend ownership, approval.

### Typed drift

`Δ_G` is the displacement between the admitted journey regime and the evidence-bounded observed state on the active G coordinates. Direction remains a property of this drift vector; semantic entropy is not embedded into the direction sign.

### Entropy/risk flux

Semantic entropy `H_S` and semantic risk `R_S` remain separate fields on the local journey chart. Their change along a transformation or between receipts provides the entropy/risk trace of the semantic drift.

### Deceptive witness

A deceptive witness is locally valid evidence whose conclusion is over-promoted beyond what its evidence channel licenses. UI Iceberg records the local pass, affected semantic coordinates, hidden defeater, entropy effect, and boundary. Suspicion does not equal a product defect.
