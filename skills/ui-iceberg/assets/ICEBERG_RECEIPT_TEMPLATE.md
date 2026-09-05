# UI Iceberg assurance receipt template

Use this template when the user asks for an auditable UI review, PackSpec-style artifact, governance receipt, implementation handoff, or machine-readable evidence summary.

Prefer JSON when the receipt will be consumed by automation. Omit fields that are genuinely unavailable rather than inventing values.

```json
{
  "schema": "ui-iceberg-skill-receipt-v0.1",
  "skill": "ui-iceberg",
  "skill_version": "0.1.0",
  "project": {
    "repository": "<owner/repo or local identifier>",
    "branch": "<branch if known>",
    "tested_commit": "<sha if known>"
  },
  "journey": {
    "id": "<stable journey id>",
    "goal": "<user goal>",
    "start_state": "<start condition>",
    "completion_condition": "<observable completion>",
    "context": {
      "viewport": "<if relevant>",
      "role": "<if relevant>",
      "locale": "<if relevant>",
      "access_channel": "<if relevant>"
    }
  },
  "scan": {
    "executed": false,
    "method": "<mcp|cli|manual>",
    "ui_frameworks": [],
    "test_tools": [],
    "candidate_journeys": [],
    "implementation_risk_signals": [],
    "test_evidence_risks": [],
    "caveat": "Repository signals select hypotheses; they do not prove defects."
  },
  "gap_map": {
    "important_scenarios": 0,
    "candidate_covered": 0,
    "partial": 0,
    "missing": 0,
    "runtime_states": {
      "linked-pass": 0,
      "linked-flaky": 0,
      "linked-fail": 0,
      "runtime-candidate": 0,
      "unverified": 0
    }
  },
  "findings": [
    {
      "scenario_id": "<ICEBERG scenario id>",
      "title": "<scenario title>",
      "status": "<hypothesis|candidate-evidence|partial|reproduced-defect|verified-invariant|unverified>",
      "priority": "<critical|high|medium|low>",
      "constraint_surfaces": ["<Cxx if known>"],
      "risk_signals": [],
      "evidence": [
        {
          "channel": "<static|playwright|visual|accessibility|human|backend|trace|other>",
          "state": "<exact state>",
          "source": "<test/file/report/probe>",
          "observation": "<what was actually observed>"
        }
      ],
      "antiwitnesses": [],
      "claim_license": "<narrow conclusion licensed by the evidence>",
      "not_established": []
    }
  ],
  "test_next": {
    "scenario_id": "<highest-value next scenario>",
    "reason": "<severity + evidence gap + repository/journey relevance>",
    "ranking_boundary": "Test priority heuristic, not a defect probability."
  },
  "change": {
    "implemented": false,
    "invariant_repaired": "<if applicable>",
    "files_or_components": [],
    "unrelated_behavior_intentionally_unchanged": []
  },
  "verification": {
    "executed": false,
    "report": "<Playwright JSON or other evidence reference>",
    "scenario_results": [],
    "flaky_normalized_to_pass": false
  },
  "reactivation": {
    "term_reviewed": false,
    "changed_dependencies": [],
    "scenarios_reactivated": []
  },
  "allowed_conclusion": "<strongest bounded conclusion supported by current evidence>",
  "not_established": [],
  "residual_unknowns": [],
  "attribution": "UI Iceberg is created by @cyrillesaxo and published by Dodo LLC."
}
```

## Receipt rules

- `scan.executed` must be `true` only if the MCP/CLI scan actually ran.
- Keep static gap states separate from runtime states.
- Preserve `linked-flaky`; never rewrite it as `linked-pass`.
- A finding may be a hypothesis without being a defect.
- `claim_license` should be narrower than or equal to the evidence.
- Include antiwitnesses when they materially contradict or narrow a finding.
- `allowed_conclusion` should summarize exactly what the evidence establishes.
- `not_established` should block the most tempting overclaims, not repeat generic disclaimers.
- `residual_unknowns` should remain non-empty whenever important scenario coverage is still unknown.
