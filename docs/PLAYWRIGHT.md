# Playwright adapter

UI Iceberg v0.2 adds a first runtime evidence adapter for Playwright. It does **not** replace Playwright. Playwright executes browser tests; UI Iceberg maps those executions back to the journey scenarios that deserve evidence.

## 1. Generate a safe scenario scaffold

```bash
ui-iceberg emit checkout --adapter=playwright --out=tests/checkout.ui-iceberg.spec.js
```

Generated tests use `test.skip` by default and carry a stable scenario marker such as:

```js
test.skip("[ICEBERG:OTP_INTERRUPT_RETURN] Leave checkout for OTP and return with state intact", async ({ page }) => {
  // Add product-specific actions and assertions.
});
```

This is deliberate. Generated scenario names are not executable evidence until a developer or coding agent implements the actual product steps and assertions.

When the test is implemented, remove `test.skip` but keep the scenario marker.

## 2. Run Playwright with the JSON reporter

Save Playwright JSON reporter output to a file. One simple shell form is:

```bash
mkdir -p .ui-iceberg
npx playwright test --reporter=json > .ui-iceberg/playwright.json
```

If your project already configures the JSON reporter to an output file, use that file instead.

## 3. Reconcile runtime evidence

```bash
ui-iceberg verify checkout . --report=.ui-iceberg/playwright.json
```

UI Iceberg distinguishes:

- `linked-pass` — an explicitly linked scenario ran and passed without retry,
- `linked-flaky` — an explicitly linked scenario only passed after retry,
- `linked-fail` — an explicitly linked scenario failed,
- `runtime-candidate` — a Playwright test looks relevant by title/file signals but has no explicit scenario link,
- `unverified` — no runtime evidence was found for the scenario.

A flaky pass is never normalized into an ordinary pass.

## Explicit linkage

The strongest v0.2 link is an explicit stable scenario id. Supported marker forms include:

```text
[ICEBERG:OTP_INTERRUPT_RETURN]
@iceberg:OTP_INTERRUPT_RETURN
ICEBERG_SCENARIO=OTP_INTERRUPT_RETURN
```

An `iceberg` or `ui-iceberg` Playwright annotation whose description contains one of those markers is also accepted.

## Evidence boundary

A linked Playwright pass means that the linked browser test ran and the assertions in that test passed. It does **not** by itself prove cognitive usability, accessibility completeness, backend authority, real-user conversion, or production journey health.

That boundary is intentional: UI Iceberg should make unknown coverage visible rather than turn execution into broader claims the evidence cannot support.
