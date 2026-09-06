# UI Iceberg operations reference

Use this file when the skill needs to execute UI Iceberg rather than only explain its model.

## Runtime requirements

- Node.js 20+
- repository access
- Playwright JSON reporter output for runtime reconciliation

From a UI Iceberg checkout:

```bash
npm install
```

## CLI

```bash
ui-iceberg scan [path] [--json]
ui-iceberg scenarios <journey> [path] [--limit=N] [--pattern-limit=N] [--json]
ui-iceberg gaps <journey> [path] [--limit=N] [--pattern-limit=N] [--json]
ui-iceberg emit <journey> --adapter=playwright [--out=path] [--limit=N] [--json]
ui-iceberg verify <journey> [path] --report=playwright.json [--json]
```

Static source matching is candidate evidence, not runtime proof. Generated Playwright scenarios are `test.skip` until real product actions and assertions are implemented.

## Stable scenario linkage

Prefer explicit linkage:

```text
[ICEBERG:SCENARIO_ID]
@iceberg:SCENARIO_ID
ICEBERG_SCENARIO=SCENARIO_ID
```

## Runtime evidence states

| State | Meaning |
| --- | --- |
| `linked-pass` | Explicit scenario link + clean runtime pass; broader conclusions still require claim review |
| `linked-flaky` | Retry-dependent success; never normalize to clean PASS |
| `linked-fail` | Linked runtime execution failed |
| `runtime-candidate` | Relevant execution exists but scenario linkage is not explicit |
| `unverified` | No runtime evidence found |

## MCP server

Start:

```bash
npm run mcp
```

v0.5 exposes eleven tools and supports modern MCP `2026-07-28` plus the legacy `2025-06-18` initialize path.

### Preferred user-facing operation: `review_claim`

Use this when the goal is to explain the current state to an ordinary user.

```json
{
  "claim": {
    "id": "checkout-otp",
    "statement": "Checkout survives OTP interruption and return."
  },
  "scope": "technical-ui-runtime",
  "evidence": [
    {
      "id": "W1",
      "state": "linked-pass",
      "channel": "playwright",
      "scenarioId": "OTP_INTERRUPT_RETURN",
      "evidenceRisks": ["NETWORK_MOCK", "VISUAL_ONLY_ORACLE"]
    }
  ]
}
```

Default output is plain language:

```text
what looks good
why the result may be misleading
best next check
what that check can tell you
what is still unknown
```

Do not request `includeInternal=true` unless the agent/research workflow genuinely needs the semantic/deception matrix.

### Internal claim review

When `includeInternal=true`, `review_claim` exposes:

- the canonical 12 semantic types active for the claim,
- all five canonical deception mechanisms,
- per-mechanism state (`triggered`, `checked-clear`, or `unknown`),
- candidate probes,
- the probe × mechanism × semantic-type matrix,
- lower-level evidence verdict and scenario ranking.

No detector firing does **not** clear a mechanism. It stays `unknown` until explicitly checked.

The five canonical mechanisms are:

```text
UNTRACEABLE_DEPTH
INFLATED_SCOPE
LOADED_CHANNEL
LOADED_FRAME
UNSTATED_IMPLICATION
```

### `scan_repository`

```json
{ "path": "/path/to/repository" }
```

Detects candidate journeys, implementation pressures, test tools, and evidence risks. Static signals remain hypotheses.

### `generate_scenarios`

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "limit": 20,
  "patternLimit": 6
}
```

### `find_gaps`

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "limit": 20,
  "patternLimit": 6
}
```

### `check_deceptive_witness`

Advanced operation for one apparent witness:

```json
{
  "claim": {
    "id": "checkout-otp-return",
    "scope": "technical-ui-runtime"
  },
  "witness": {
    "id": "W1",
    "state": "linked-pass",
    "channel": "playwright",
    "evidenceRisks": ["NETWORK_MOCK"]
  }
}
```

A distortion finding diagnoses evidence quality. It is not proof that the corresponding product defect exists.

### `select_first_bite`

Advanced operation for ranking a discriminating scenario/probe. Its score is a testing heuristic, not a defect probability.

### `generate_test_spec`

```json
{
  "journey": "checkout",
  "adapter": "playwright",
  "limit": 20
}
```

Returns a skipped Playwright scaffold.

### `verify_journey`

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "report": "/path/to/playwright.json",
  "adapter": "playwright",
  "limit": 20
}
```

### `admit_evidence`

Advanced scoped verdict operation. Possible verdicts:

```text
ADMITTED_WITH_SCOPE
REJECTED
INCONCLUSIVE
```

Use it for governance/receipt logic, not as the default user vocabulary.

### `reactivation_impact`

```json
{
  "changedFiles": ["src/payment/callback.js"],
  "changedSignals": ["external-redirect"],
  "scenarios": [
    {
      "id": "OTP_INTERRUPT_RETURN",
      "dependencies": {
        "files": ["src/payment/callback.js"],
        "signals": ["external-redirect"]
      }
    }
  ]
}
```

Unmapped changed files remain unknown rather than silently unaffected.

### `issue_receipt`

Receipts may include the user-facing claim review plus lower-level evidence state. A receipt preserves inputs and boundaries; it does not create new evidence.

## Recommended flow

For normal product work:

```text
scan_repository
      ↓
find_gaps
      ↓
review_claim
      ↓
run best next check
      ↓
verify_journey
      ↓
review_claim again
```

For advanced assurance:

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

## Playwright report workflow

```bash
mkdir -p .ui-iceberg
npx playwright test --reporter=json > .ui-iceberg/playwright.json
ui-iceberg verify <journey> . --report=.ui-iceberg/playwright.json
```

## Useful repository scripts

```bash
npm test
npm run check
npm run demo:quickstart
npm run benchmark:ui006
```

The UI-006 benchmark remains a false-convergence fixture: the happy path passes while an important OTP return condition is missing, and an independent probe reproduces the intentionally seeded state-loss defect.
