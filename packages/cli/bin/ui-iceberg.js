#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { analyzeJourneyGaps, generateScenarios, scanRepository } from "../../core/src/index.js";
import { prioritizeScenarioGaps } from "../../core/src/prioritize.js";
import { emitPlaywrightScenarioSpec, verifyJourneyWithPlaywright } from "../../runtime/src/index.js";

const args = process.argv.slice(2);
const command = args[0];
const json = args.includes("--json");
const values = args.filter((arg) => !arg.startsWith("--"));

function printHelp() {
  console.log(`UI Iceberg v0.2\n\nFind what your UI tests forgot to test.\n\nUsage:\n  ui-iceberg scan [path] [--json]\n  ui-iceberg scenarios <journey> [path] [--limit=N] [--pattern-limit=N] [--json]\n  ui-iceberg gaps <journey> [path] [--limit=N] [--pattern-limit=N] [--json]\n  ui-iceberg emit <journey> --adapter=playwright [--out=path] [--limit=N] [--json]\n  ui-iceberg verify <journey> [path] --report=playwright.json [--json]\n\nExamples:\n  ui-iceberg scan .\n  ui-iceberg scenarios checkout .\n  ui-iceberg gaps checkout .\n  ui-iceberg emit checkout --adapter=playwright --out=tests/checkout.ui-iceberg.spec.js\n  ui-iceberg verify checkout . --report=.ui-iceberg/playwright.json\n`);
}

function optionValue(name) {
  const raw = args.find((arg) => arg.startsWith(`--${name}=`));
  return raw ? raw.slice(raw.indexOf("=") + 1) : undefined;
}

function optionNumber(name) {
  const raw = optionValue(name);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function icon(state) {
  return state === "candidate-covered" ? "✓" : state === "partial" ? "~" : state === "missing" ? "?" : "·";
}

function runtimeIcon(state) {
  if (state === "linked-pass") return "✓";
  if (state === "linked-fail") return "✕";
  if (state === "linked-flaky") return "~";
  if (state === "runtime-candidate") return "?";
  return "·";
}

function prioritizeReport(result) {
  const gaps = prioritizeScenarioGaps(result.gaps || [], result.riskSignals || []);
  return { ...result, gaps, testNext: gaps[0] || null };
}

function printEvidenceRisks(risks = []) {
  console.log("\nTest evidence risks");
  if (!risks.length) {
    console.log("  No known deceptive-green test patterns detected in the bounded scan.");
    return;
  }
  for (const risk of risks.slice(0, 8)) {
    console.log(`  • [${risk.severity.toUpperCase()}] ${risk.id} (${risk.hits} hit${risk.hits === 1 ? "" : "s"})`);
    console.log(`    ${risk.meaning}`);
  }
}

function printScan(result) {
  console.log(`UI ICEBERG\nRepository scan\n${"─".repeat(44)}`);
  console.log(`Project              ${result.packageName}`);
  console.log(`Files                ${result.counts.files}`);
  console.log(`Existing tests       ${result.counts.tests}`);
  console.log(`UI frameworks        ${result.frameworks.ui.join(", ") || "not detected"}`);
  console.log(`Test tools           ${result.frameworks.test.join(", ") || "not detected"}`);
  console.log("\nCandidate journeys");
  if (!result.candidateJourneys.length) console.log("  No common journey family confidently detected from static source.");
  for (const journey of result.candidateJourneys.slice(0, 8)) console.log(`  • ${journey.name} (${journey.hits} signals)`);
  console.log("\nImplementation risk fingerprint");
  if (!result.riskSignals?.length) console.log("  No hardening signals detected from the bounded implementation scan.");
  for (const signal of (result.riskSignals || []).slice(0, 10)) console.log(`  • ${signal.id} (${signal.hits} signals)`);
  printEvidenceRisks(result.testEvidenceRisks);
  console.log(`\nHardening note: ${result.hardeningPolicy?.statement || "No repository-specific hardening policy available."}`);
  if (result.hardeningPolicy?.testEvidence) console.log(`Evidence-risk note: ${result.hardeningPolicy.testEvidence}`);
  console.log(`Evidence note: ${result.caveat}`);
}

function printScenarios(result) {
  console.log(`UI ICEBERG\n${result.journey.replaceAll("_", " ")} scenarios\n${"─".repeat(44)}`);
  for (const [index, scenario] of result.scenarios.entries()) {
    const suffix = scenario.source === "failure-pattern-library" ? " [repo-risk]" : scenario.source === "journey-archetype" ? " [journey]" : "";
    console.log(`${String(index + 1).padStart(2)}. [${scenario.priority.toUpperCase()}] ${scenario.title}${suffix}`);
    console.log(`    ${scenario.why}`);
  }
  console.log(`\n${result.scenarios.length} high-value scenarios generated.`);
  if (result.hardening?.archetype) console.log(`${result.hardening.archetype} journey-specific archetype scenarios included.`);
  if (result.hardening?.selected) console.log(`${result.hardening.selected} repository-specific hardening scenarios selected from implementation signals.`);
  if (result.hardening?.boundary) console.log(`Hardening note: ${result.hardening.boundary}`);
}

function printGaps(result) {
  console.log(`UI ICEBERG\n${result.journey.replaceAll("_", " ")} journey\n${"─".repeat(44)}`);
  console.log(`Existing tests        ${result.existingTests}`);
  console.log(`Important scenarios   ${result.scenarios.length}`);
  console.log(`Journey scenarios     ${result.archetypeScenarioCount || 0}`);
  console.log(`Repo-risk scenarios   ${result.hardenedScenarioCount || 0}`);
  console.log(`Evidence risks        ${result.testEvidenceRisks?.length || 0}`);
  console.log(`Candidate covered     ${result.summary["candidate-covered"]}`);
  console.log(`Partial               ${result.summary.partial}`);
  console.log(`Missing               ${result.summary.missing}`);

  const high = result.gaps.filter((gap) => gap.priority === "critical" || gap.priority === "high").slice(0, 8);
  console.log("\nHIGH-VALUE GAPS");
  if (!high.length) console.log("  No high-priority candidate gaps found by static mapping.");
  for (const gap of high) {
    const suffix = gap.source === "failure-pattern-library" ? " [repo-risk]" : gap.source === "journey-archetype" ? " [journey]" : "";
    console.log(`\n${icon(gap.evidence.state)} ${gap.title}${suffix}`);
    console.log(`  Priority: ${gap.priority.toUpperCase()} | Evidence: ${gap.evidence.state}`);
    console.log(`  Why: ${gap.why}`);
  }

  if (result.testNext) {
    console.log(`\nTEST NEXT\n${result.testNext.title}`);
    console.log(`Why: ${result.testNext.recommendation?.explanation || result.testNext.why}`);
    if (result.testNext.recommendation) console.log(`Ranking note: ${result.testNext.recommendation.boundary}`);
  }
  if (result.testEvidenceRisks?.length) {
    console.log("\nEVIDENCE TO REVIEW");
    for (const risk of result.testEvidenceRisks.slice(0, 4)) console.log(`  • [${risk.severity.toUpperCase()}] ${risk.id}: ${risk.meaning}`);
  }
  console.log(`\nEvidence note: ${result.evidencePolicy.statement}`);
  if (result.evidencePolicy.hardening) console.log(`Hardening note: ${result.evidencePolicy.hardening}`);
  if (result.evidencePolicy.testEvidence) console.log(`Evidence-risk note: ${result.evidencePolicy.testEvidence}`);
}

function printVerify(result) {
  console.log(`UI ICEBERG\n${result.journey.replaceAll("_", " ")} runtime check\n${"─".repeat(44)}`);
  console.log(`Status                ${result.status}`);
  console.log(`Playwright tests      ${result.runtimeTestsObserved}`);
  console.log(`Linked pass           ${result.runtimeSummary["linked-pass"]}`);
  console.log(`Flaky pass            ${result.runtimeSummary["linked-flaky"]}`);
  console.log(`Linked fail           ${result.runtimeSummary["linked-fail"]}`);
  console.log(`Runtime candidates    ${result.runtimeSummary["runtime-candidate"]}`);
  console.log(`Unverified            ${result.runtimeSummary.unverified}`);

  const risks = result.verificationGaps.slice(0, 8);
  console.log("\nVERIFY / FIX NEXT");
  if (!risks.length) console.log("  No remaining scenario-level runtime gaps in the bounded plan.");
  for (const item of risks) {
    console.log(`\n${runtimeIcon(item.runtimeEvidence.state)} ${item.title}`);
    console.log(`  Priority: ${item.priority.toUpperCase()} | Runtime: ${item.runtimeEvidence.state}`);
    console.log(`  Why: ${item.why}`);
  }

  if (result.testNext) console.log(`\nTEST NEXT\n${result.testNext.title}`);
  console.log(`\nEvidence note: ${result.evidencePolicy.runtime}`);
}

try {
  if (!command || command === "help" || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (command === "scan") {
    const root = values[1] || ".";
    const result = await scanRepository(root);
    if (json) console.log(JSON.stringify(result, null, 2));
    else printScan(result);
    process.exit(0);
  }

  if (command === "scenarios") {
    const journey = values[1];
    if (!journey) throw new Error("scenarios requires a journey, e.g. `ui-iceberg scenarios checkout .`");
    const root = values[2];
    let riskSignals = [];
    if (root) {
      const scan = await scanRepository(root);
      riskSignals = scan.riskSignals;
    }
    const result = generateScenarios(journey, {
      limit: optionNumber("limit"),
      patternLimit: optionNumber("pattern-limit"),
      riskSignals
    });
    if (json) console.log(JSON.stringify(result, null, 2));
    else printScenarios(result);
    process.exit(0);
  }

  if (command === "gaps") {
    const journey = values[1];
    if (!journey) throw new Error("gaps requires a journey, e.g. `ui-iceberg gaps checkout .`");
    const root = values[2] || ".";
    const raw = await analyzeJourneyGaps(root, journey, {
      limit: optionNumber("limit"),
      patternLimit: optionNumber("pattern-limit")
    });
    const result = prioritizeReport(raw);
    if (json) console.log(JSON.stringify(result, null, 2));
    else printGaps(result);
    process.exit(0);
  }

  if (command === "emit") {
    const journey = values[1];
    if (!journey) throw new Error("emit requires a journey, e.g. `ui-iceberg emit checkout --adapter=playwright`");
    const adapter = optionValue("adapter") || "playwright";
    if (adapter !== "playwright") throw new Error(`Unsupported adapter in v0.2: ${adapter}`);
    const result = emitPlaywrightScenarioSpec(journey, { limit: optionNumber("limit") });
    const out = optionValue("out");
    if (out) {
      const resolved = path.resolve(out);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, result.content, "utf8");
      if (json) console.log(JSON.stringify({ ...result, content: undefined, outputPath: resolved }, null, 2));
      else console.log(`UI Iceberg wrote ${result.scenarios.length} skipped Playwright scenario scaffolds to ${resolved}`);
    } else if (json) console.log(JSON.stringify(result, null, 2));
    else console.log(result.content);
    process.exit(0);
  }

  if (command === "verify") {
    const journey = values[1];
    if (!journey) throw new Error("verify requires a journey, e.g. `ui-iceberg verify checkout . --report=.ui-iceberg/playwright.json`");
    const root = values[2] || ".";
    const report = optionValue("report");
    const result = await verifyJourneyWithPlaywright(root, journey, report, { limit: optionNumber("limit") });
    if (json) console.log(JSON.stringify(result, null, 2));
    else printVerify(result);
    process.exit(0);
  }

  throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(`UI Iceberg error: ${error.message}`);
  process.exit(1);
}
