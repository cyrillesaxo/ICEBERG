# False-convergence benchmark

A false-convergence episode is one where ordinary evidence can look healthy while a protected journey condition remains unverified or broken.

Initial benchmark classes:

| ID | Episode | Conventional evidence that may pass | Hidden failure |
| --- | --- | --- | --- |
| UI-001 | Stale responsive navigation regime | source regression test | later CSS owner hides labels |
| UI-002 | Retry masks instability | E2E passes on retry | temporal race remains |
| UI-003 | Missing failure state | happy path passes | no recovery after request failure |
| UI-004 | Semantic self-heal drift | locator heals | test clicks a different business action |
| UI-005 | Visual baseline false confidence | screenshot unchanged | baseline encodes wrong journey semantics |
| UI-006 | OTP task stiction | checkout happy path passes | leave/return loses checkout state |
| UI-007 | Agency asymmetry | accept and refuse are technically functional | refusal path is materially harder |
| UI-008 | Responsive hidden action | desktop test passes | mobile/zoom hides primary action |
| UI-009 | Accessibility proxy overreach | automated scan has no detected violation | critical task still needs human/access-channel evidence |
| UI-010 | Undiscoverable next action | DOM/actionability pass | user cannot identify the next step |

The benchmark is intended to test **what a tool is allowed to claim**, not just whether it can execute browser actions.
