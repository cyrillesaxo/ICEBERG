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

1. Runs the conventional happy-path test.
2. Runs `ui-iceberg gaps checkout` against the fixture.
3. Runs an independent ground-truth probe that exercises the external-verification return edge.

## Reproduced result

GitHub Actions run `33969309398` on head `337e83d1d0332e5e9392d127c6c13291c45bbbc5` reproduced the episode successfully:

```text
Conventional happy-path test
1 passed / 0 failed

UI Iceberg gap map
Existing tests        1
Important scenarios   18
Candidate covered     1
Partial               1
Missing               16

OTP leave-and-return  MISSING

Ground truth
cart state lost       YES
payment draft lost    YES
```

The machine-readable receipt is committed as [`receipt.json`](receipt.json).

## Why this matters

The benchmark separates three different claims:

```text
happy-path test passes
        !=
OTP interruption is covered
        !=
OTP interruption is correct
```

A green conventional suite establishes the first claim only. UI Iceberg keeps the second claim explicit until appropriate evidence exists. The independent probe demonstrates that, in this controlled fixture, the missing edge is in fact broken.

## Evidence boundary

This episode supports the bounded conclusion:

> A passing happy-path UI test can coexist with an unverified high-value journey edge that is actually broken in a controlled fixture.

It does **not** establish that UI Iceberg proves the root cause from static source alone, that real users would abandon checkout, that all checkout systems have this failure, or that UI Iceberg is universally superior to other testing tools.

## Attribution

UI Iceberg is created by @cyrillesaxo and published by Dodo LLC.
