# Semantic Manifold — Advanced calculation view

UI Iceberg keeps ordinary claim review in user-facing language. Advanced/internal review may expose the RCT semantic-manifold receipt, including reproducible calculations.

## Advanced surface

Recommended presentation order:

1. **Summary** — semantic entropy `H_S`, semantic risk `R_S`, reference displacement, temporal flux state.
2. **G1-G12 coordinates** — `p_hat`, reference displacement, entropy, risk, deceptive-witness correction, temporal direction.
3. **Calculations** — expandable derivation for each displayed value.
4. **Coupling candidates** — co-activated coordinate pairs with explicit evidence boundary.
5. **First Bite** — ranked discriminating probes with visible score calculation.

The calculation layer is emitted by the assurance core. UI clients should render the receipt rather than independently recomputing it.

## Satisfaction estimate

For each coordinate:

```text
p_hat = (alpha0 + Σ_j w_j*x_j) / (alpha0 + beta0 + Σ_j w_j)
alpha0 = 1
beta0  = 1
```

The receipt includes every evidence term, its weight, nominal/corrected value, weighted product, numerator, denominator, substitution, and result.

Explicit coordinate-typed evidence receives full coordinate weight. Claim-level inference receives half weight. Deceptive-witness correction retracts unsupported positive evidence toward the unresolved prior; it does not manufacture negative evidence.

## Reference displacement

```text
Delta_i = p_hat_i - p_target_i
p_target_i = 1
```

A snapshot reports displacement from the admitted regime. It does **not** establish motion.

## Temporal direction

Temporal movement is shown only when a prior manifold receipt exists:

```text
Delta_t p_i = p_i(t1) - p_i(t0)
```

Without a prior receipt the Advanced view must display:

```text
unavailable-no-prior-receipt
```

rather than inventing a trajectory.

## Semantic entropy

Per coordinate:

```text
h(p) = -p*log2(p) - (1-p)*log2(1-p)
```

Aggregate:

```text
H_S = Σ_i w_i*h(p_hat_i)
```

The receipt exposes the weighted terms and final sum.

## Semantic risk

Per coordinate:

```text
r_i = 1 - p_hat_i
```

Aggregate:

```text
R_S = Σ_i w_i*(1-p_hat_i)
```

Risk and entropy remain separate so low-entropy/high-risk deceptive stabilization remains observable.

## Deceptive-witness correction

Advanced shows nominal and corrected calculations side by side:

```text
DeltaH_DW = H_S(corrected) - H_S(nominal)
DeltaR_DW = R_S(corrected) - R_S(nominal)
```

This makes the epistemic effect of a deceptive witness directly auditable.

## Temporal entropy/risk flux

When a prior receipt exists:

```text
DeltaH_S = H_S(t1) - H_S(t0)
DeltaR_S = R_S(t1) - R_S(t0)
```

Classification remains bounded to the observed receipt transition:

- `genuine-convergence`
- `chaotic-divergence`
- `deceptive-stabilization`
- `improving-but-uncertain`
- `stable`
- `mixed-or-unresolved`

## First Bite calculation

For each candidate probe, Advanced exposes:

```text
V_probe = (2*E_cov + R_cov + 0.5*M + 0.25*C) / cost
```

where:

- `E_cov` is weighted semantic-entropy coverage;
- `R_cov` is weighted decision-risk coverage;
- `M` is the number of deception mechanisms discriminated;
- `C` is cross-coordinate coverage;
- `cost` is the existing ordinal probe-cost value.

This is a probe-ordering heuristic, not calibrated information gain, defect probability, monetary ROI, or engineering effort.

## Coupling boundary

The Advanced surface may show co-activated coordinate pairs such as `G8 × G12`, but must not invent a regime metric tensor value such as `M[G8,G12] = 250` unless a separate authoritative calibration supplies it.

## Receipt schema

Calculations are available at:

```text
reviewClaim(..., { includeInternal: true })
  .internal.semanticManifold.calculations
```

with schema:

```text
ui-iceberg-calculation-receipt-v0.6
```

The calculation receipt is intended to make every displayed numeric result reproducible while preserving the distinction between mathematical transparency and evidentiary authority.
