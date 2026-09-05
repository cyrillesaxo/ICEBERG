import fs from "node:fs/promises";
import path from "node:path";

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function normalizeResultStatus(value) {
  const status = String(value || "").toLowerCase();
  if (["passed", "expected"].includes(status)) return "pass";
  if (["skipped"].includes(status)) return "skipped";
  if (["failed", "timedout", "timed_out", "unexpected", "interrupted"].includes(status)) return "fail";
  if (status === "flaky") return "flaky-pass";
  return "unknown";
}

function finalOutcome(test = {}, spec = {}) {
  const results = Array.isArray(test.results) ? test.results : [];
  const finalResult = results.at(-1) || {};
  const finalStatus = normalizeResultStatus(finalResult.status || test.status || (spec.ok === true ? "passed" : "unknown"));
  const retried = results.some((result) => Number(result.retry || 0) > 0);
  const priorFailure = results.slice(0, -1).some((result) => normalizeResultStatus(result.status) === "fail");
  const declaredFlaky = normalizeResultStatus(test.status) === "flaky-pass";

  if (finalStatus === "pass" && (retried || priorFailure || declaredFlaky)) return "flaky-pass";
  return finalStatus;
}

function markerScenarioIds(value) {
  const text = String(value || "");
  const patterns = [
    /\[ICEBERG:([A-Z0-9_:-]+)\]/gi,
    /@iceberg:([A-Z0-9_:-]+)/gi,
    /\bICEBERG_SCENARIO\s*[:=]\s*([A-Z0-9_:-]+)/gi
  ];
  const ids = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) ids.push(match[1].toUpperCase());
  }
  return ids;
}

function explicitScenarioIds(spec = {}, test = {}) {
  const values = [spec.title, ...(Array.isArray(spec.tags) ? spec.tags : [])];
  const annotations = Array.isArray(test.annotations) ? test.annotations : [];
  for (const annotation of annotations) {
    const type = String(annotation?.type || "").toLowerCase();
    if (type === "ui-iceberg" || type === "iceberg") values.push(annotation?.description || "");
  }
  return uniq(values.flatMap(markerScenarioIds));
}

function flattenSuite(suite = {}, parents = [], output = []) {
  const titlePath = [...parents, suite.title].filter(Boolean);
  for (const spec of suite.specs || []) {
    const specTitlePath = [...titlePath, spec.title].filter(Boolean);
    const tests = spec.tests?.length ? spec.tests : [{}];
    for (const test of tests) {
      const results = Array.isArray(test.results) ? test.results : [];
      output.push({
        id: spec.id || test.id || null,
        title: specTitlePath.join(" > "),
        specTitle: spec.title || "",
        file: spec.file || suite.file || "",
        line: spec.line || suite.line || null,
        projectName: test.projectName || "",
        expectedStatus: test.expectedStatus || "",
        outcome: finalOutcome(test, spec),
        retries: Math.max(0, ...results.map((result) => Number(result.retry || 0))),
        durationMs: results.reduce((total, result) => total + Number(result.duration || 0), 0),
        explicitScenarioIds: explicitScenarioIds(spec, test),
        annotations: Array.isArray(test.annotations) ? test.annotations : [],
        tags: Array.isArray(spec.tags) ? spec.tags : []
      });
    }
  }
  for (const child of suite.suites || []) flattenSuite(child, titlePath, output);
  return output;
}

export function parsePlaywrightJsonReport(report) {
  const parsed = typeof report === "string" ? JSON.parse(report) : report;
  if (!parsed || typeof parsed !== "object") throw new Error("Playwright report must be a JSON object or JSON string.");
  const tests = [];
  for (const suite of parsed.suites || []) flattenSuite(suite, [], tests);
  return {
    schema: "ui-iceberg-playwright-runtime-v0.2",
    source: "playwright-json-reporter",
    stats: parsed.stats || null,
    errors: parsed.errors || [],
    tests,
    caveat: "Runtime execution proves only what the linked browser test actually asserts. It does not by itself prove cognitive usability, accessibility completeness, backend authority, or human outcomes."
  };
}

export async function loadPlaywrightJsonReport(reportPath, rootDir = process.cwd()) {
  const resolved = path.isAbsolute(reportPath) ? reportPath : path.resolve(rootDir, reportPath);
  const content = await fs.readFile(resolved, "utf8");
  const parsed = parsePlaywrightJsonReport(content);
  return { ...parsed, reportPath: resolved };
}

function candidateScore(scenario, testRun) {
  const scenarioTokens = uniq([scenario.title, ...(scenario.signals || [])].flatMap(tokenize)).filter((token) => token.length > 3);
  if (!scenarioTokens.length) return 0;
  const haystack = new Set(tokenize(`${testRun.title} ${testRun.file} ${(testRun.tags || []).join(" ")}`));
  const hits = scenarioTokens.filter((token) => haystack.has(token));
  const denominator = Math.max(2, Math.ceil(scenarioTokens.length * 0.4));
  return Math.min(1, hits.length / denominator);
}

function chooseLinkedState(runs) {
  if (!runs.length) return null;
  if (runs.some((run) => run.outcome === "fail")) return "linked-fail";
  if (runs.some((run) => run.outcome === "flaky-pass")) return "linked-flaky";
  if (runs.some((run) => run.outcome === "pass")) return "linked-pass";
  if (runs.every((run) => run.outcome === "skipped")) return "linked-skipped";
  return "linked-unknown";
}

export function mapPlaywrightRuntimeEvidence(scenarios, report) {
  const runtime = report?.tests ? report : parsePlaywrightJsonReport(report);
  const mapped = scenarios.map((scenario) => {
    const scenarioId = String(scenario.id || "").toUpperCase();
    const linkedRuns = runtime.tests.filter((testRun) => testRun.explicitScenarioIds.includes(scenarioId));
    const linkedState = chooseLinkedState(linkedRuns);
    const candidates = runtime.tests
      .map((testRun) => ({ testRun, score: candidateScore(scenario, testRun) }))
      .filter((entry) => entry.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const state = linkedState || (candidates.length ? "runtime-candidate" : "unverified");
    return {
      scenarioId: scenario.id,
      state,
      evidenceLevel: linkedState ? "explicit-runtime-link" : candidates.length ? "runtime-candidate" : "none",
      linkedRuns,
      candidateRuns: candidates.map(({ testRun, score }) => ({
        title: testRun.title,
        file: testRun.file,
        projectName: testRun.projectName,
        outcome: testRun.outcome,
        score: Number(score.toFixed(2))
      }))
    };
  });

  const summary = mapped.reduce(
    (acc, item) => {
      acc[item.state] = (acc[item.state] || 0) + 1;
      return acc;
    },
    {
      "linked-pass": 0,
      "linked-flaky": 0,
      "linked-fail": 0,
      "linked-skipped": 0,
      "linked-unknown": 0,
      "runtime-candidate": 0,
      unverified: 0
    }
  );

  return {
    schema: "ui-iceberg-playwright-evidence-map-v0.2",
    adapter: "playwright",
    mapped,
    summary,
    policy: {
      strongLink: "Use [ICEBERG:SCENARIO_ID], @iceberg:SCENARIO_ID, ICEBERG_SCENARIO=SCENARIO_ID, or an `iceberg`/`ui-iceberg` Playwright annotation.",
      runtimeCandidate: "Title/file lexical similarity is runtime evidence discovery only; it is not promoted to verified coverage.",
      flaky: "A retry-dependent pass is preserved as linked-flaky rather than normalized to PASS."
    }
  };
}

export function generatePlaywrightScaffold(journey, scenarios, options = {}) {
  const selected = Number.isFinite(options.limit) ? scenarios.slice(0, options.limit) : scenarios;
  const safeJourney = String(journey || "journey").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  const lines = [
    'import { test, expect } from "@playwright/test";',
    "",
    `test.describe("UI Iceberg: ${safeJourney}", () => {`
  ];

  for (const scenario of selected) {
    const title = scenario.title.replaceAll('"', '\\"');
    lines.push(`  test.skip("[ICEBERG:${scenario.id}] ${title}", async ({ page }) => {`);
    lines.push(`    // ${scenario.why}`);
    lines.push("    // TODO: implement the product-specific steps and assertions for this scenario.");
    lines.push("    // Remove test.skip only after the scenario is genuinely exercised.");
    lines.push("    void page;");
    lines.push("    void expect;");
    lines.push("  });");
    lines.push("");
  }
  lines.push("});", "");
  return lines.join("\n");
}
