# Example: applying the UI Iceberg skill to LexyRead

This example demonstrates the method. It is not a claim about the current LexyRead implementation unless the relevant repository/version is actually scanned and probed.

## Example A — navigation false convergence

### User request

> LexyRead's navigation is inconsistent across pages and on phones. Find the hidden primitive, fix it, and verify it.

### Journey

A learner moves between core reading surfaces without having to relearn navigation or lose orientation.

### Hidden invariant

The canonical navigation contract should preserve, across every owner/page and mobile projection:

- the same semantic navigation targets;
- the same target identity and labels;
- a coherent active-state rule;
- reachable/actionable controls;
- consistent responsive ownership rather than a legacy page-specific regime.

An earlier ICEBERG episode documented a false convergence where a canonical five-label mobile navigation contract could be overwritten by a later legacy CSS owner that reintroduced an obsolete icon-only regime. Treat that as a pattern to test, not as proof that any current LexyRead build still contains the defect.

### Constraint surfaces

Likely relevant surfaces include:

- C01 identity — is each nav item the same semantic target on every page?
- C03 order — is the order stable?
- C04 ownership — which shared layout/component/CSS owner controls navigation?
- C05 geometry — does the mobile projection preserve reachability?
- C06 visibility/projection — are labels/actions actually perceivable?
- C08 semantic mapping — do visual/selector identities map to the same route/task meaning?
- C12 access channel — can keyboard/touch users traverse the same logical model?

### Probe before repair

Build a route × viewport matrix for the canonical navigation targets.

For each route and target viewport:

1. resolve the visible nav items;
2. record semantic labels/roles/targets;
3. record order and active target;
4. verify the intended owner/component/style source;
5. verify target actionability;
6. compare against the canonical contract.

Do not fix each page independently if the failure is produced by one shared primitive or an overriding legacy owner.

### TEST NEXT

Prefer the smallest route/viewport pair that discriminates canonical versus obsolete navigation ownership.

If it reproduces the legacy regime, repair the shared owner and then replay the matrix instead of adding page-specific CSS patches.

## Example B — explanation and reading-context continuity

### User request

> A learner sees an unfamiliar complex expression, opens an explanation, and should continue reading without losing passage context.

### Journey

```text
reading passage
  -> encounter unfamiliar expression
  -> discover explanation action
  -> open explanation
  -> understand/inspect explanation
  -> dismiss/return
  -> continue at the original passage context
```

### Separate technical and human claims

A browser test can establish technical facts such as:

- the explanation control exists;
- it is actionable;
- the explanation opens;
- the original passage/scroll/selection/focus state is restored.

It does not automatically establish:

- the learner noticed the control;
- the explanation reduced confusion;
- the learner cognitively resumed the task without disorientation.

Keep the human claim unverified until an appropriate human/task evidence channel exists.

### Candidate invariants

- SemanticTargetIdentity: the explanation belongs to the exact expression the learner selected.
- C04 ownership: temporary explanation UI returns control to the reading task.
- C05/C06: the explanation does not obscure the continuation action on mobile/zoom.
- C07: open/close interaction remains actionable and focus state is correct.
- C09: delayed explanation loading does not move the user to a stale expression.
- C11: reading position/context survives the temporary interaction.
- C12: keyboard/touch access channels preserve the same continuation path.

### Discriminating probes

Possible bounded probes:

1. Open explanation for expression A, quickly switch to expression B, and ensure a late response for A cannot overwrite B.
2. Open an explanation mid-paragraph, close it, and assert scroll/focus/selection context is restored.
3. Repeat on a small mobile viewport with the virtual keyboard or bottom overlay present where applicable.
4. Use keyboard-only interaction and verify focus returns to the originating expression/control.
5. Refresh or navigate away/back only if the product contract says the reading context should survive that boundary.

### Example finding format

| Scenario | Constraint | Evidence | Interpretation |
| --- | --- | --- | --- |
| Explanation opens | C07 | linked-pass | Technical activation assertions passed. |
| Return to same passage context | C04/C11 | unverified | Do not infer from the open/close test. |
| Discoverability for learner | human/UX evidence | unknown | Requires appropriately licensed human/task evidence. |

### TEST NEXT

If the current suite only proves `explanation opens`, prioritize `return to original passage context` before claiming the explanation journey is covered.
