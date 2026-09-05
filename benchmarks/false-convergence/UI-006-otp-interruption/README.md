# UI-006 — OTP interruption / unknown journey coverage

This runnable fixture demonstrates a narrow claim:

> A conventional happy-path checkout test can pass while an OTP leave-and-return edge remains unverified and the fixture actually contains a state-loss defect on that edge.

It does **not** claim that UI Iceberg automatically proves the root cause. UI Iceberg's role in this v0.2 episode is to surface the missing high-value scenario rather than normalize the existing green test into full journey coverage.

## Run

From the repository root:

```bash
npm run benchmark:ui006
```

The command performs three independent steps:

1. Runs the conventional happy-path test. It should pass.
2. Runs `ui-iceberg gaps checkout` against the fixture. The OTP interruption scenario should remain unverified / appear among the high-value gaps.
3. Runs an independent ground-truth probe that deliberately exercises the external-verification return edge and confirms the benchmark defect: cart and payment draft state are lost.

## Why this matters

The benchmark separates three different claims:

```text
happy-path test passes
        !=
OTP interruption is covered
        !=
OTP interruption is correct
```

A green conventional suite establishes the first claim only. UI Iceberg should keep the second claim explicit as unknown/candidate evidence until an appropriate test exists. The ground-truth probe independently demonstrates that, in this fixture, the unknown edge is in fact broken.

## Expected evidence boundary

UI Iceberg is expected to say, in effect:

- core checkout evidence exists,
- important scenario coverage is incomplete,
- OTP leave-and-return deserves testing,
- static lexical mapping is not runtime proof.

It must **not** claim from static analysis alone that real users would abandon the checkout, that the exact root cause is session loss, or that the defect occurs in production systems generally.

## Attribution

UI Iceberg is created by @cyrillesaxo and published by Dodo LLC.
