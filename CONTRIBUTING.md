# Contributing to UI Iceberg

UI Iceberg is building an open, evidence-disciplined layer for UI journey assurance.

## Contribution principles

1. **Use familiar user vocabulary at the product boundary.** Prefer journey, step, blocker, friction, coverage gap, test next, and verify. Formal PackSpec terminology belongs in advanced/internal layers.
2. **Do not promote proxies to proof.** Static source matching, screenshots, accessibility scans, or LLM judgments can create evidence candidates; they do not automatically certify human outcomes.
3. **Unknown is not pass.** If evidence is missing, keep the gap explicit.
4. **Prefer the smallest discriminating test set.** More scenarios are not automatically better.
5. **Generalize competitive primitives.** Copy public concepts and interoperability patterns, not proprietary implementation details.

## Local development

```bash
npm install
npm run check
npm test
node packages/cli/bin/ui-iceberg.js scenarios checkout
```

## Pull requests

Please include the user problem, the new/changed scenario or evidence primitive, tests, and what the change still does **not** establish.
