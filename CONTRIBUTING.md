# Contributing to UI Iceberg

UI Iceberg is building an open, evidence-disciplined layer for UI journey assurance.

## Contribution principles

1. **Use familiar user vocabulary at the product boundary.** Prefer journey, step, blocker, friction, coverage gap, test next, and verify. Formal PackSpec terminology belongs in advanced/internal layers.
2. **Do not promote proxies to proof.** Static source matching, screenshots, accessibility scans, or LLM judgments can create evidence candidates; they do not automatically certify human outcomes.
3. **Unknown is not pass.** If evidence is missing, keep the gap explicit.
4. **Prefer the smallest discriminating test set.** More scenarios are not automatically better.
5. **Generalize competitive primitives.** Copy public concepts and interoperability patterns, not proprietary implementation details.

## Try the project first

```bash
git clone https://github.com/cyrillesaxo/ICEBERG.git
cd ICEBERG
npm install
npm run demo:quickstart
```

The quick-start fixture is intentionally incomplete so UI Iceberg can demonstrate how it surfaces unverified journey scenarios without requiring an account or hosted service.

## Local development

```bash
npm run check
npm test
node packages/cli/bin/ui-iceberg.js scenarios checkout
```

## Good ways to contribute

- Add or refine a journey scenario pack.
- Add a deterministic adapter for a testing or coding-agent tool.
- Contribute a minimal false-convergence benchmark fixture.
- Report a bug with a minimal reproduction and bounded evidence.
- Submit a counterexample where UI Iceberg's current model overreaches or misses an important state/edge.
- Improve docs, examples, or first-run ergonomics.

Use the repository issue forms when possible. Current newcomer-friendly work is labeled [`good first issue`](https://github.com/cyrillesaxo/ICEBERG/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and [`help wanted`](https://github.com/cyrillesaxo/ICEBERG/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22).

## Pull requests

Please include:

- the user problem,
- the changed journey/scenario/evidence primitive,
- tests or a reproducible fixture,
- documentation where behavior changed,
- what the change still does **not** establish.

The pull-request template includes an evidence-boundary checklist. External contributors with merged work are acknowledged in [CONTRIBUTORS.md](CONTRIBUTORS.md).
