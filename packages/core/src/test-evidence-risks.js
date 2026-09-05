import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATTERNS = [/playwright\.config\./i, /cypress\.config\./i, /wdio\.conf\./i, /jest\.config\./i, /vitest\.config\./i];

const EVIDENCE_RISK_PATTERNS = Object.freeze([
  {
    id: "FIXED_WAIT",
    severity: "high",
    regex: /\b(waitForTimeout|Thread\.sleep|sleep\s*\(|cy\.wait\s*\(\s*\d+)/gi,
    meaning: "Fixed sleeps can turn timing assumptions into intermittent green/red results instead of waiting on the actual readiness condition.",
    boundary: "A fixed wait is a test-quality risk, not proof the product is flaky."
  },
  {
    id: "FORCED_ACTION",
    severity: "high",
    regex: /force\s*:\s*true|\.click\s*\(\s*\{[^}]*force\s*:\s*true/gi,
    meaning: "Forced actions can bypass actionability conditions a real user must satisfy.",
    boundary: "A forced action weakens interaction evidence; it does not by itself prove the UI is unusable."
  },
  {
    id: "SKIPPED_TEST",
    severity: "medium",
    regex: /\b(test|it|describe)\.skip\b|\bxit\s*\(|\bxdescribe\s*\(/gi,
    meaning: "Skipped tests create known but non-executed coverage obligations.",
    boundary: "A skipped test is explicit missing runtime evidence, not a product failure."
  },
  {
    id: "FOCUSED_TEST",
    severity: "critical",
    regex: /\b(test|it|describe)\.only\b|\bfit\s*\(|\bfdescribe\s*\(/gi,
    meaning: "Focused tests can accidentally exclude the rest of a suite and create a misleading green run.",
    boundary: "Presence of a focused marker is a release-evidence risk; confirm runner behavior before concluding other tests were excluded."
  },
  {
    id: "RETRY_ENABLED",
    severity: "medium",
    regex: /\bretries\s*[:=]\s*[1-9]\d*|\bretry\s*[:=]\s*[1-9]\d*/gi,
    meaning: "Retries can hide first-attempt instability if retry-dependent success is normalized into PASS.",
    boundary: "Retries are legitimate resilience tooling; UI Iceberg preserves flaky/retry-dependent outcomes rather than treating configuration alone as failure."
  },
  {
    id: "NETWORK_MOCK",
    severity: "medium",
    regex: /\b(page\.route|route\.fulfill|cy\.intercept|mockServiceWorker|setupServer\s*\(|msw\b)/gi,
    meaning: "Network mocking can establish deterministic frontend behavior while leaving real integration, latency, and authority paths unobserved.",
    boundary: "Mocked tests remain useful; the risk is over-claiming what they establish."
  },
  {
    id: "VISUAL_ONLY_ORACLE",
    severity: "medium",
    regex: /\b(toHaveScreenshot|toMatchSnapshot|matchImageSnapshot|percySnapshot|eyes\.check)/gi,
    meaning: "Visual equality can preserve a semantically wrong baseline if no task/semantic assertion accompanies it.",
    boundary: "A visual assertion is not weak evidence by itself; it is insufficient for claims outside its visual oracle scope."
  },
  {
    id: "INDEX_BASED_TARGET",
    severity: "medium",
    regex: /\.nth\s*\(\s*\d+\s*\)|:nth-(child|of-type)\s*\(|xpath=.*\[\d+\]/gi,
    meaning: "Index-based targeting can continue to resolve after list/order changes while pointing at a different semantic entity.",
    boundary: "Index selectors are sometimes intentional; verify semantic target continuity before classifying drift."
  },
  {
    id: "DISABLED_ASSERTION_FAILURE",
    severity: "high",
    regex: /\bsoft\s*:\s*true|expect\.configure\s*\([^)]*soft\s*:\s*true/gi,
    meaning: "Soft assertions can allow execution to continue after failed checks and require careful final-result handling.",
    boundary: "Soft assertions are not inherently unsafe; verify that failed soft assertions still fail the test/run."
  }
]);

async function safeRead(file) {
  try {
    const stat = await fs.stat(file);
    if (stat.size > 1_500_000) return "";
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

function count(regex, text) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  return (text.match(new RegExp(regex.source, flags)) || []).length;
}

export async function scanTestEvidenceRisks(root, testFiles = [], allFiles = []) {
  const configs = allFiles.filter((file) => CONFIG_PATTERNS.some((regex) => regex.test(file)));
  const files = [...new Set([...testFiles, ...configs])].slice(0, 500);
  const chunks = [];
  for (const file of files) {
    const content = await safeRead(path.join(root, file));
    if (content) chunks.push({ file, content });
  }

  const risks = [];
  for (const pattern of EVIDENCE_RISK_PATTERNS) {
    const matches = [];
    let hits = 0;
    for (const entry of chunks) {
      const fileHits = count(pattern.regex, entry.content);
      if (!fileHits) continue;
      hits += fileHits;
      matches.push({ file: entry.file, hits: fileHits });
    }
    if (!hits) continue;
    risks.push({
      id: pattern.id,
      severity: pattern.severity,
      hits,
      files: matches.slice(0, 8),
      meaning: pattern.meaning,
      boundary: pattern.boundary,
      evidenceClass: "test-evidence-risk"
    });
  }

  const weight = { critical: 4, high: 3, medium: 2, low: 1 };
  risks.sort((a, b) => (weight[b.severity] || 0) - (weight[a.severity] || 0) || b.hits - a.hits);

  return {
    filesSampled: chunks.length,
    risks,
    policy: "Test evidence risks identify ways a green suite can overstate what was observed. They are not proof of product defects."
  };
}

export function listTestEvidenceRiskPatterns() {
  return EVIDENCE_RISK_PATTERNS.map(({ regex, ...pattern }) => ({ ...pattern, detector: regex.source }));
}
