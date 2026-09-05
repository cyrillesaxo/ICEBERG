import fs from "node:fs/promises";
import path from "node:path";
import { generateScenarioCatalog, normalizeJourneyName, priorityScore } from "../../scenarios/src/catalog.js";
import { selectFailurePatterns } from "../../scenarios/src/failure-patterns.js";

const IGNORE_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".nuxt", ".turbo"]);
const TEXT_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".md", ".html", ".vue", ".svelte", ".feature", ".yml", ".yaml", ".css", ".scss", ".less"]);
const RISK_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".html", ".vue", ".svelte", ".css", ".scss", ".less"]);
const TEST_PATTERNS = [/\.test\.[cm]?[jt]sx?$/i, /\.spec\.[cm]?[jt]sx?$/i, /(^|\/)tests?\//i, /(^|\/)e2e\//i, /\.feature$/i];

const RISK_SIGNAL_PATTERNS = Object.freeze([
  ["async-network", /\b(fetch|axios|request|graphql|trpc|mutation|query)\b/gi],
  ["optimistic-ui", /\b(optimistic|onMutate|rollback|pendingMutation)\b/gi],
  ["auth-session", /\b(session|accessToken|refreshToken|oauth|openid|reauth|401|authentication)\b/gi],
  ["browser-persistence", /\b(localStorage|sessionStorage|indexedDB)\b/gi],
  ["multi-context", /\b(BroadcastChannel|postMessage|window\.open|storageevent|addEventListener\(["']storage)/gi],
  ["offline-capable", /\b(serviceWorker|navigator\.onLine|offline|onlineevent|backgroundSync)\b/gi],
  ["external-redirect", /\b(redirect|callback|window\.location|location\.href|3ds|otp|verification)\b/gi],
  ["feature-flags", /\b(feature.?flag|experiment|variant|cohort|launchdarkly|unleash|split\.io)\b/gi],
  ["internationalization", /\b(i18n|useTranslation|translation|locale|Intl\.)\b/gi],
  ["rtl", /\b(rtl|dir=["']rtl|direction\s*:\s*rtl)\b/gi],
  ["date-time", /\b(timezone|timeZone|Intl\.DateTimeFormat|Date\.UTC|new Date\(|expiresAt|expiry)\b/gi],
  ["file-upload", /\b(FormData|multipart|dropzone|upload|type=["']file["'])\b/gi],
  ["virtualized-list", /\b(react-window|react-virtual|virtualized|windowing)\b/gi],
  ["progressive-list", /\b(IntersectionObserver|infinite.?scroll|loadMore|nextPage|pageParam|cursor)\b/gi],
  ["modal-overlay", /\b(dialog|modal|drawer|popover|sheet)\b/gi],
  ["occluding-overlay", /\b(position\s*:\s*(fixed|sticky)|sticky|bottom.?sheet|overlay)\b/gi],
  ["realtime", /\b(WebSocket|EventSource|socket\.io|realtime|subscribe|subscription)\b/gi],
  ["client-cache", /\b(react-query|tanstack|swr|apollo|invalidateQueries|queryClient|cache)\b/gi],
  ["device-permission", /\b(navigator\.permissions|getUserMedia|geolocation|Notification\.requestPermission|clipboard)\b/gi],
  ["search-filter", /\b(search|filter|facet|sortBy|searchParams|queryParams)\b/gi],
  ["complex-form", /\b(useForm|formik|react-hook-form|autocomplete|validation|register\()\b/gi],
  ["draft-editing", /\b(autosave|autoSave|draft|beforeunload|isDirty|dirtyFields)\b/gi]
]);

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

async function walk(root, current = root, out = []) {
  let entries;
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(root, full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) && entry.name !== "package.json") continue;
    out.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return out;
}

async function safeRead(file) {
  try {
    const stat = await fs.stat(file);
    if (stat.size > 1_500_000) return "";
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

function detectFrameworks(packageJson, files) {
  const deps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {})
  };
  const names = Object.keys(deps);
  const hasFile = (regex) => files.some((file) => regex.test(file));
  const hasDep = (...candidates) => candidates.some((candidate) => names.includes(candidate));

  return {
    ui: uniq([
      hasDep("react", "react-dom") ? "react" : null,
      hasDep("vue") ? "vue" : null,
      hasDep("svelte") ? "svelte" : null,
      hasDep("@angular/core") ? "angular" : null,
      hasDep("next") ? "next" : null
    ]),
    test: uniq([
      hasDep("@playwright/test", "playwright") || hasFile(/playwright\.config\./i) ? "playwright" : null,
      hasDep("cypress") || hasFile(/cypress\.config\./i) ? "cypress" : null,
      hasDep("selenium-webdriver") || files.some((file) => /selenium/i.test(file)) ? "selenium" : null,
      hasDep("@testing-library/react", "@testing-library/dom") ? "testing-library" : null,
      hasDep("vitest") ? "vitest" : null,
      hasDep("jest") ? "jest" : null,
      hasDep("storybook", "@storybook/react", "@storybook/vue3") || hasFile(/\.stories\.[jt]sx?$/i) ? "storybook" : null,
      hasDep("@axe-core/playwright", "axe-core", "cypress-axe") ? "axe" : null
    ])
  };
}

function countMatches(corpus, regex) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matches = corpus.match(new RegExp(regex.source, flags));
  return matches ? matches.length : 0;
}

function detectRiskSignals(corpus) {
  return RISK_SIGNAL_PATTERNS
    .map(([id, regex]) => ({ id, hits: countMatches(corpus, regex) }))
    .filter((signal) => signal.hits > 0)
    .sort((a, b) => b.hits - a.hits);
}

function discoverJourneyCandidates(corpus) {
  const patterns = [
    ["checkout", /checkout|payment|cart|purchase|order confirmation/i],
    ["signup", /sign.?up|register|registration|create account|onboarding/i],
    ["login", /log.?in|sign.?in|authentication|mfa/i],
    ["password reset", /forgot password|password reset|reset password/i],
    ["subscription cancellation", /cancel subscription|subscription cancellation|unsubscribe|retention offer/i],
    ["booking", /booking|reservation|schedule appointment/i],
    ["upload", /upload|file picker|dropzone/i],
    ["search", /search results|filter results|search query/i]
  ];
  return patterns
    .map(([name, regex]) => ({ name, hits: (corpus.match(new RegExp(regex.source, "gi")) || []).length }))
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits);
}

export async function scanRepository(rootDir = process.cwd()) {
  const root = path.resolve(rootDir);
  const files = await walk(root);
  let packageJson = null;
  try {
    packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  } catch {
    packageJson = null;
  }

  const testFiles = files.filter((file) => TEST_PATTERNS.some((regex) => regex.test(file)));
  const routeLikeFiles = files.filter((file) => /route|router|page|screen|view|app\.[jt]sx?|main\.[jt]sx?/i.test(file));
  const journeyCorpusFiles = uniq([...testFiles, ...routeLikeFiles]).slice(0, 250);
  const riskCorpusFiles = files
    .filter((file) => RISK_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .filter((file) => !TEST_PATTERNS.some((regex) => regex.test(file)))
    .slice(0, 600);
  const journeyChunks = await Promise.all(journeyCorpusFiles.map((file) => safeRead(path.join(root, file))));
  const riskChunks = await Promise.all(riskCorpusFiles.map((file) => safeRead(path.join(root, file))));
  const journeyCorpus = journeyChunks.join("\n");
  const riskCorpus = riskChunks.join("\n");
  const frameworks = detectFrameworks(packageJson, files);

  return {
    schema: "ui-iceberg-scan-v0.2",
    root,
    packageName: packageJson?.name || path.basename(root),
    frameworks,
    counts: {
      files: files.length,
      tests: testFiles.length,
      routeLikeFiles: routeLikeFiles.length,
      implementationFilesSampled: riskCorpusFiles.length
    },
    testFiles,
    candidateJourneys: discoverJourneyCandidates(journeyCorpus),
    riskSignals: detectRiskSignals(riskCorpus),
    hardeningPolicy: {
      source: "generalized-industry-patterns",
      statement: "Risk signals are derived from implementation files only and select additional scenarios from a bounded failure-pattern library. A matched pattern is a test hypothesis, not proof that the defect exists."
    },
    caveat: "Static discovery is a candidate map. It does not establish runtime or human journey coverage."
  };
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

async function buildTestCorpus(root, testFiles) {
  const entries = [];
  for (const file of testFiles.slice(0, 400)) {
    const content = await safeRead(path.join(root, file));
    if (!content) continue;
    entries.push({ file, content: content.toLowerCase(), tokens: new Set(tokenize(content)) });
  }
  return entries;
}

function mapScenarioEvidence(scenario, testCorpus) {
  const signals = uniq([scenario.title, ...(scenario.signals || [])])
    .flatMap(tokenize)
    .filter((token) => token.length > 3);
  if (!signals.length) return { state: "unknown", score: 0, files: [] };

  const matches = [];
  for (const entry of testCorpus) {
    const hits = signals.filter((signal) => entry.tokens.has(signal) || entry.content.includes(signal));
    if (hits.length) matches.push({ file: entry.file, hits: uniq(hits) });
  }

  const uniqueHits = uniq(matches.flatMap((match) => match.hits));
  const score = Math.min(1, uniqueHits.length / Math.max(3, Math.ceil(signals.length * 0.35)));
  const state = uniqueHits.length >= 3 || score >= 0.75 ? "candidate-covered" : score >= 0.35 ? "partial" : "missing";
  return { state, score: Number(score.toFixed(2)), files: matches.slice(0, 5) };
}

function combineScenarios(base, extra, journey, limit) {
  const seen = new Set();
  const combined = [...base, ...extra]
    .map((scenario, index) => ({ ...scenario, journey, rank: scenario.rank || index + 1 }))
    .filter((scenario) => {
      if (seen.has(scenario.id)) return false;
      seen.add(scenario.id);
      return true;
    })
    .sort((a, b) => {
      const priority = priorityScore(b.priority) - priorityScore(a.priority);
      return priority || a.rank - b.rank;
    });
  return Number.isFinite(limit) ? combined.slice(0, limit) : combined;
}

export async function analyzeJourneyGaps(rootDir, journeyName, options = {}) {
  const scan = await scanRepository(rootDir);
  const normalized = normalizeJourneyName(journeyName);
  const base = generateScenarioCatalog(normalized, { ...options, limit: null });
  const hardened = selectFailurePatterns(scan.riskSignals, { limit: Number.isFinite(options.patternLimit) ? options.patternLimit : 6 });
  const scenarios = combineScenarios(base, hardened, normalized, options.limit);
  const corpus = await buildTestCorpus(scan.root, scan.testFiles);
  const mapped = scenarios.map((scenario) => ({
    ...scenario,
    evidence: mapScenarioEvidence(scenario, corpus)
  }));

  const summary = mapped.reduce(
    (acc, item) => {
      acc[item.evidence.state] = (acc[item.evidence.state] || 0) + 1;
      return acc;
    },
    { "candidate-covered": 0, partial: 0, missing: 0, unknown: 0 }
  );

  const gaps = mapped
    .filter((item) => item.evidence.state !== "candidate-covered")
    .sort((a, b) => {
      const priority = priorityScore(b.priority) - priorityScore(a.priority);
      return priority || a.evidence.score - b.evidence.score;
    });

  return {
    schema: "ui-iceberg-journey-gaps-v0.2",
    journey: normalized,
    repository: scan.packageName,
    existingTests: scan.counts.tests,
    riskSignals: scan.riskSignals,
    hardenedScenarioCount: mapped.filter((scenario) => scenario.source === "failure-pattern-library").length,
    scenarios: mapped,
    summary,
    gaps,
    testNext: gaps[0] || null,
    evidencePolicy: {
      status: "candidate mapping",
      statement: "Static lexical overlap can identify likely test evidence, but cannot certify scenario coverage. Runtime replay or explicit test linkage is required for strong verification.",
      hardening: scan.hardeningPolicy.statement
    }
  };
}

export function generateScenarios(journeyName, options = {}) {
  const normalized = normalizeJourneyName(journeyName);
  const base = generateScenarioCatalog(normalized, { ...options, limit: null });
  const hardened = selectFailurePatterns(options.riskSignals || [], { limit: Number.isFinite(options.patternLimit) ? options.patternLimit : 6 });
  const scenarios = combineScenarios(base, hardened, normalized, options.limit);
  return {
    schema: "ui-iceberg-scenarios-v0.2",
    journey: normalized,
    scenarios,
    hardening: {
      selected: scenarios.filter((scenario) => scenario.source === "failure-pattern-library").length,
      source: "generalized-industry-patterns",
      boundary: "Selected historical failure patterns are hypotheses to test, not evidence that the repository contains those defects."
    },
    principle: "Generate the smallest high-value scenario set first; do not confuse scenario count with journey assurance."
  };
}
