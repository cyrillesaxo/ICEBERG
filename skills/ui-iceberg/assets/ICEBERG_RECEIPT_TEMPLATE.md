# UI Iceberg assurance receipt template

Use this template when the user asks for an auditable UI review, PackSpec-style artifact, governance receipt, implementation handoff, or machine-readable evidence summary.

Prefer JSON when the receipt will be consumed by automation. Omit fields that are genuinely unavailable rather than inventing values.

```json
{
  "schema": "ui-iceberg-skill-receipt-v0.2",
  "skill": "ui-iceberg",
  "skill_version": "0.2.0",
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
  "deceptive_witness_audit": {
    "taxonomy_status": "bounded-public-subset",
    "clean_witnesses": 0,
    "weakened_witnesses": 0,
    "deceptive_witness_candidates": 0,
    "non_witness_obligations": 0,
    "antiwitnesses": 0,
    "unknown_witnesses": 0,
    "first_deception_probe": null,
    "boundary": "Evidence-channel distortion is not proof of a product defect."
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
          "id": "<witness id>",
          "channel": "<static|playwright|visual|accessibility|human|backend|trace|other>",
          "state": "<exact state>",
          "source": "<test/file/report/probe>",
          "observation": "<what was actually observed>",
          "evidence_risks": [],
          "deceptive_witness_classification": "<CLEAN_WITNESS|WEAKENED_WITNESS|DECEPTIVE_WITNESS_CANDIDATE|NON_WITNESS_OBLIGATION|ANTIWITNESS|UNKNOWN_WITNESS>",
          "distortions": [],
          "licensed_claim": "<what this channel actually establishes>"
        }
      ],
      "antiwitnesses": [],
      "claim_license": "<narrow conclusion licensed after deceptive-witness filtering>",
      "not_established": []
    }
  ],
  "test_next": {
    "kind": "<SCENARIO_GAP_PROBE|DECEPTIVE_WITNESS_PROBE>",
    "scenario_id": "<highest-value next scenario>",
    "probe_id": "<distortion-specific probe if applicable>",
    "reason": "<severity + evidence gap + repository/journey relevance + evidence distortion if applicable>",
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
  "admission": {
    "verdict": "<ADMITTED_WITH_SCOPE|REJECTED|INCONCLUSIVE>",
    "scope": "<claim scope>",
    "licensing_witnesses": [],
    "deceptive_witnesses_excluded_from_licensing": [],
    "strong_antiwitnesses": []
  },
  "reactivation": {
    "term_reviewed": false,
    "changed_dependencies": [],
    "scenarios_reactivated": [],
    "unknown_change_impact": []
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
- A green runtime result is a nominal witness candidate; relevant evidence-channel risks must be checked before material admission.
- A `DECEPTIVE_WITNESS_CANDIDATE` may justify a discriminating probe but is not itself proof of a product defect.
- `claim_license` should be narrower than or equal to the evidence after deceptive-witness filtering.
- Include antiwitnesses when they materially contradict or narrow a finding.
- Keep deceptive witnesses visible even when an independent clean witness licenses the requested scope.
- `allowed_conclusion` should summarize exactly what the admissible evidence establishes.
- `not_established` should block the most tempting overclaims, not repeat generic disclaimers.
- `residual_unknowns` should remain non-empty whenever important scenario coverage or evidence distortion is still unresolved.
- Do not claim execution of the full 72-item research deceptive-witness taxonomy until the normative definitions are actually vendored and validated.
