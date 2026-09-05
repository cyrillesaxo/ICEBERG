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
| `linked-pass` | Explicit scenario link + clean runtime pass | The linked test ran and its assertions passed without retry. |
| `linked-flaky` | Explicit link + retry-dependent pass | The scenario is unstable; do not normalize to PASS. |
| `linked-fail` | Explicit link + runtime failure | The linked execution failed; inspect assertion/action evidence. |
| `runtime-candidate` | Executed test appears relevant but lacks explicit scenario link | Runtime evidence exists, but scenario coverage is not established. |
| `unverified` | No runtime evidence found | Unknown; never report PASS. |

## MCP server

Start the experimental stdio server from the UI Iceberg repository:

```bash
npm run mcp
```

It exposes five tools.

### `scan_repository`

Input:

```json
{
  "path": "/path/to/repository"
}
```

`path` defaults to the current working directory.

### `generate_scenarios`

Input:

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "limit": 20,
  "patternLimit": 6
}
```

`journey` is required. `path`, `limit`, and `patternLimit` are optional.

### `find_gaps`

Input:

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "limit": 20,
  "patternLimit": 6
}
```

`journey` is required. The result includes prioritized gaps and a `testNext` candidate.

### `generate_test_spec`

Input:

```json
{
  "journey": "checkout",
  "adapter": "playwright",
  "limit": 20
}
```

Returns a skipped Playwright scenario scaffold.

### `verify_journey`

Input:

```json
{
  "journey": "checkout",
  "path": "/path/to/repository",
  "report": "/path/to/playwright.json",
  "adapter": "playwright",
  "limit": 20
}
```

`journey` and `report` are required.

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
