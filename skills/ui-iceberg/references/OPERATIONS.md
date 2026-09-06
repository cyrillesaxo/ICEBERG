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

The package exposes the `ui-iceberg` binary from `packages/cli/bin/ui-iceberg.js`.

## CLI

### Scan

```bash
ui-iceberg scan [path] [--json]
```

Purpose: detect the UI/test stack, candidate journeys, implementation-risk fingerprint, and test-evidence risks.

### Generate scenarios

```bash
ui-iceberg scenarios <journey> [path] [--limit=N] [--pattern-limit=N] [--json]
```

Purpose: create a prioritized journey scenario plan. Supplying a repository path enables repository-aware hardening from implementation signals.

### Find gaps

```bash
ui-iceberg gaps <journey> [path] [--limit=N] [--pattern-limit=N] [--json]
```

Purpose: map the scenario plan against existing tests and rank `TEST NEXT`.

Static matching is candidate evidence, not runtime proof.

### Emit Playwright scaffold

```bash
ui-iceberg emit <journey> --adapter=playwright [--out=path] [--limit=N] [--json]
```

Generated scenarios are `test.skip` by default. Implement real product actions and assertions before enabling them.

### Verify Playwright evidence

```bash
ui-iceberg verify <journey> [path] --report=playwright.json [--json]
```

Purpose: reconcile Playwright runtime evidence with the ICEBERG scenario model.

If running directly from the repository instead of an installed binary, substitute:

```bash
node packages/cli/bin/ui-iceberg.js <command> ...
```

## Playwright report workflow

One simple way to obtain the report:

```bash
mkdir -p .ui-iceberg
npx playwright test --reporter=json > .ui-iceberg/playwright.json
```

Then:

```bash
ui-iceberg verify <journey> . --report=.ui-iceberg/playwright.json
```

If the project already configures the JSON reporter to a file, use that report instead.

## Stable scenario linkage

Prefer explicit stable linkage over lexical matching. Accepted forms include:

```text
[ICEBERG:SCENARIO_ID]
@iceberg:SCENARIO_ID
ICEBERG_SCENARIO=SCENARIO_ID
```

An `iceberg` or `ui-iceberg` Playwright annotation whose description contains one of these markers may also be used.

## Runtime evidence states

Preserve these states exactly:

| State | Meaning | Claim license |
| --- | --- | --- |
| `linked-pass` | Explicit scenario link + clean runtime pass | Nominal runtime support; deceptive-witness filtering still applies to the requested claim scope. |
| `linked-flaky` | Explicit link + retry-dependent pass | The scenario is unstable; do not normalize to PASS. |
| `linked-fail` | Explicit link + runtime failure | The linked execution failed; inspect assertion/action evidence. |
| `runtime-candidate` | Executed test appears relevant but lacks explicit scenario link | Runtime evidence exists, but scenario coverage is not established. |
| `unverified` | No runtime evidence found | Unknown; never report PASS. |

## MCP server

Start the stdio server from the UI Iceberg repository:

```bash
npm run mcp
```

The v0.4 MCP surface exposes ten tools and supports both the legacy 2025 handshake and modern MCP `2026-07-28` `server/discover` discovery.

### Planning and evidence collection

#### `scan_repository`

```json
{
  "path": "/path/to/repository"
}
```

Detects candidate journeys, implementation pressures, test tools, and evidence risks. Static signals remain hypotheses.

#### `generate_scenarios`

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "limit": 20,
  "patternLimit": 6
}
```

Generates a bounded scenario plan. `journey` is required.

#### `find_gaps`

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "limit": 20,
  "patternLimit": 6
}
```

Maps candidate evidence and returns prioritized gaps. Do not treat static candidate mapping as verification.

#### `check_deceptive_witness`

Use this before trusting an apparent green witness when repository/test evidence exposes a risk such as forced action, network mocking, retry policy, visual-only oracle, fixed wait, or ordinal targeting.

```json
{
  "claim": {
    "id": "checkout-otp-return",
    "scope": "technical-ui-runtime",
    "statement": "Checkout survives the real OTP interruption and return boundary."
  },
  "witness": {
    "id": "W1",
    "scenarioId": "OTP_INTERRUPT_RETURN",
    "state": "linked-pass",
    "channel": "playwright",
    "evidenceRisks": ["NETWORK_MOCK"]
  }
}
```

A typical bounded result is:

```text
classification: DECEPTIVE_WITNESS_CANDIDATE
distortion: AUTHORITY_SUBSTITUTION
recommended probe: PROBE_REAL_AUTHORITY_BOUNDARY
```

This means the evidence channel blocks the requested claim scope. It does **not** mean the product defect is proven.

#### `select_first_bite`

```json
{
  "gaps": [
    {
      "id": "OTP_INTERRUPT_RETURN",
      "priority": "critical",
      "evidence": { "state": "partial", "score": 0.5 },
      "source": "journey-profile"
    }
  ],
  "riskSignals": ["external-redirect", "browser-persistence"],
  "deceptiveWitnesses": [
    {
      "claim": { "id": "otp-return", "scope": "technical-ui-runtime" },
      "scenarioId": "OTP_INTERRUPT_RETURN",
      "witness": {
        "id": "W1",
        "scenarioId": "OTP_INTERRUPT_RETURN",
        "state": "linked-pass",
        "evidenceRisks": ["NETWORK_MOCK"]
      }
    }
  ]
}
```

When a claim-blocking deceptive witness contaminates the top scenario, `recommendedNext` becomes the distortion-specific probe rather than blindly accepting the apparent support. The recommendation is a testing heuristic, not defect probability.

#### `generate_test_spec`

```json
{
  "journey": "checkout",
  "adapter": "playwright",
  "limit": 20
}
```

Returns a skipped Playwright scenario scaffold.

#### `verify_journey`

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "report": "/path/to/playwright.json",
  "adapter": "playwright",
  "limit": 20
}
```

Reconciles Playwright runtime evidence with the scenario model. `linked-flaky` stays flaky.

### Assurance and change control

#### `admit_evidence`

```json
{
  "claim": {
    "id": "cart-preserved-after-otp",
    "statement": "Cart state survives the OTP interruption and return."
  },
  "scope": "technical-ui-runtime",
  "evidence": [
    {
      "id": "E1",
      "state": "linked-pass",
      "channel": "playwright",
      "evidenceRisks": ["NETWORK_MOCK"]
    }
  ],
  "antiwitnesses": []
}
```

Possible verdicts are `ADMITTED_WITH_SCOPE`, `REJECTED`, and `INCONCLUSIVE`.

v0.4 filters strong nominal support through the bounded deceptive-witness classifier before licensing the requested scope. If every strong witness is deceptive for that scope, admission remains `INCONCLUSIVE`. A clean independent witness can still license the scope while the deceptive witness remains explicit in the receipt.

A technical runtime admission does not license cognitive usability, accessibility completeness, production journey health, causal root cause, or business outcome. Candidate evidence and flaky execution remain inconclusive.

#### `reactivation_impact`

```json
{
  "changedFiles": ["src/payment/callback.js"],
  "changedSignals": ["external-redirect"],
  "scenarios": [
    {
      "id": "OTP_INTERRUPT_RETURN",
      "evidence": { "state": "linked-pass" },
      "dependencies": {
        "files": ["src/payment/callback.js"],
        "signals": ["external-redirect"]
      }
    }
  ]
}
```

Returns scenarios whose prior assurance state should be reactivated. Unmapped changed files remain `unknown`; they are not silently classified as unaffected.

#### `issue_receipt`

```json
{
  "project": "checkout-app",
  "journey": "checkout",
  "deceptiveWitnessAudit": {
    "counts": { "DECEPTIVE_WITNESS_CANDIDATE": 1 }
  },
  "testNext": { "id": "OTP_INTERRUPT_RETURN" },
  "admission": { "verdict": "INCONCLUSIVE" },
  "allowedConclusion": "The mocked frontend path passed, but the real authority return boundary remains unverified.",
  "notEstablished": ["production authority behavior", "cognitive usability"],
  "residualUnknowns": ["real OTP callback continuity"]
}
```

Returns a deterministic `receipt://...` handle and preserves the supplied evidence boundary, including deceptive-witness state.

## Recommended MCP sequence

```text
scan_repository
      ↓
find_gaps
      ↓
inspect apparent green evidence with check_deceptive_witness
      ↓
select_first_bite
      ↓
generate_test_spec / implement targeted distortion probe
      ↓
execute probe in the real product/executor
      ↓
verify_journey
      ↓
admit_evidence
      ↓
issue_receipt
      ↓
code changes later
      ↓
reactivation_impact
```

The MCP is an executable assurance interface, not the source of truth by itself. Evidence comes from the repository, runtime executor, controlled probe, or licensed human/task channel.

## Deceptive-witness taxonomy boundary

The PackSpec validation receipt references a larger 72-item research taxonomy. The full normative YAML is not vendored in this repository, so the v0.4 executable classifier intentionally uses only the bounded public subset derived from current test-evidence-risk detectors. Do not claim 72-rule execution until those normative definitions are actually vendored and validated.

## MCP 2026-07-28 behavior

Modern requests carry `io.modelcontextprotocol/protocolVersion=2026-07-28` in request `_meta`. The server implements `server/discover`, stamps server identity in response `_meta`, and returns cache hints on `tools/list`.

The server retains the older `initialize` path for compatibility with 2025-era clients. It does not advertise the Tasks extension yet because current ICEBERG operations are synchronous. Do not claim task support until a real asynchronous/durable execution path exists.

## Built-in journey normalization

The current catalog recognizes common aliases for:

- `checkout`
- `signup`
- `login`
- `password_reset`
- `subscription_cancel`

Other journey names remain valid and receive the generic scenario layer plus repository-aware hardening when signals exist.

## Useful repository scripts

From the UI Iceberg repository:

```bash
npm test
npm run check
npm run demo:quickstart
npm run benchmark:ui006
```

The UI-006 benchmark is a false-convergence fixture: a happy-path test can pass while the OTP leave-and-return scenario remains missing and the seeded state-loss defect is reproduced by an independent probe.
