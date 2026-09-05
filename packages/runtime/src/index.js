import { analyzeJourneyGaps, generateScenarios } from "../../core/src/index.js";
import {
  generatePlaywrightScaffold,
  loadPlaywrightJsonReport,
  mapPlaywrightRuntimeEvidence
} from "../../adapters/playwright/src/index.js";

const PRIORITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });
const RUNTIME_RISK_WEIGHT = Object.freeze({
  "linked-fail": 7,
  "linked-flaky": 6,
  "linked-skipped": 5,
  unverified: 4,
  "runtime-candidate": 3,
  "linked-unknown": 2,
  "linked-pass": 0
});

function runtimeRisk(item) {
  return RUNTIME_RISK_WEIGHT[item?.runtimeEvidence?.state] || 1;
}

function chooseJourneyStatus(combined) {
  if (combined.some((item) => item.runtimeEvidence.state === "linked-fail")) return "BLOCKED";
  const required = combined.filter((item) => item.priority === "critical" || item.priority === "high");
  if (required.length && required.every((item) => item.runtimeEvidence.state === "linked-pass")) return "RUNTIME_CHECKED_BOUNDED";
  return "NEEDS_VERIFICATION";
}

export async function verifyJourneyWithPlaywright(rootDir, journeyName, reportPath, options = {}) {
  if (!reportPath) throw new Error("A Playwright JSON report is required. Pass --report=<path>.");
  const staticReport = await analyzeJourneyGaps(rootDir, journeyName, {
    limit: options.limit,
    patternLimit: options.patternLimit
  });
  const runtimeReport = await loadPlaywrightJsonReport(reportPath, rootDir);
  const runtimeMap = mapPlaywrightRuntimeEvidence(staticReport.scenarios, runtimeReport);
  const byId = new Map(runtimeMap.mapped.map((item) => [item.scenarioId, item]));
  const combined = staticReport.scenarios.map((scenario) => ({
    ...scenario,
    runtimeEvidence: byId.get(scenario.id) || {
      scenarioId: scenario.id,
      state: "unverified",
      evidenceLevel: "none",
      linkedRuns: [],
      candidateRuns: []
    }
  }));

  const verificationGaps = combined
    .filter((item) => item.runtimeEvidence.state !== "linked-pass")
    .sort((a, b) => {
      const risk = runtimeRisk(b) - runtimeRisk(a);
      if (risk) return risk;
      return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
    });

  return {
    schema: "ui-iceberg-journey-runtime-verification-v0.2",
    journey: staticReport.journey,
    repository: staticReport.repository,
    adapter: "playwright",
    status: chooseJourneyStatus(combined),
    existingTests: staticReport.existingTests,
    runtimeTestsObserved: runtimeReport.tests.length,
    riskSignals: staticReport.riskSignals,
    testEvidenceRisks: staticReport.testEvidenceRisks,
    hardenedScenarioCount: staticReport.hardenedScenarioCount,
    staticSummary: staticReport.summary,
    runtimeSummary: runtimeMap.summary,
    scenarios: combined,
    verificationGaps,
    testNext: verificationGaps[0] || null,
    report: {
      path: runtimeReport.reportPath,
      source: runtimeReport.source,
      stats: runtimeReport.stats
    },
    evidencePolicy: {
      static: staticReport.evidencePolicy.statement,
      hardening: staticReport.evidencePolicy.hardening,
      testEvidence: staticReport.evidencePolicy.testEvidence,
      runtime: runtimeReport.caveat,
      explicitLink: runtimeMap.policy.strongLink,
      flaky: runtimeMap.policy.flaky,
      admission: "RUNTIME_CHECKED_BOUNDED means the required high/critical scenarios were explicitly linked to passing Playwright executions. It is not a claim of complete human, accessibility, backend-authority, or production-field convergence."
    }
  };
}

export function emitPlaywrightScenarioSpec(journeyName, options = {}) {
  const plan = generateScenarios(journeyName, { limit: options.limit });
  return {
    schema: "ui-iceberg-playwright-scaffold-v0.2",
    journey: plan.journey,
    adapter: "playwright",
    fileName: `${plan.journey}.ui-iceberg.spec.js`,
    scenarios: plan.scenarios.map((scenario) => ({ id: scenario.id, title: scenario.title, priority: scenario.priority })),
    content: generatePlaywrightScaffold(plan.journey, plan.scenarios, { limit: options.limit }),
    policy: "Generated scenarios are test.skip by default. A coding agent or developer must implement product-specific actions and assertions before enabling them."
  };
}
