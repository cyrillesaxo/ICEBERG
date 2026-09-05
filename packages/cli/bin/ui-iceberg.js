#!/usr/bin/env node
import process from "node:process";
import { analyzeJourneyGaps, generateScenarios, scanRepository } from "../../core/src/index.js";

const args = process.argv.slice(2);
const command = args[0];
const json = args.includes("--json");
const values = args.filter((arg) => !arg.startsWith("--"));

function printHelp() {
  console.log(`UI Iceberg v0.1\n\nFind what your UI tests forgot to test.\n\nUsage:\n  ui-iceberg scan [path] [--json]\n  ui-iceberg scenarios <journey> [--limit=N] [--json]\n  ui-iceberg gaps <journey> [path] [--limit=N] [--json]\n\nExamples:\n  ui-iceberg scan .\n  ui-iceberg scenarios checkout\n  ui-iceberg gaps checkout .\n`);
}

function optionNumber(name) {
  const raw = args.find((arg) => arg.startsWith(`--${name}=`));
  if (!raw) return undefined;
  const value = Number(raw.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function icon(state) {
  return state === "candidate-covered" ? "✓" : state === "partial" ? "~" : state === "missing" ? "?" : "·";
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
  console.log(`\nNote: ${result.caveat}`);
}

function printScenarios(result) {
  console.log(`UI ICEBERG\n${result.journey.replaceAll("_", " ")} scenarios\n${"─".repeat(44)}`);
  for (const [index, scenario] of result.scenarios.entries()) {
    console.log(`${String(index + 1).padStart(2)}. [${scenario.priority.toUpperCase()}] ${scenario.title}`);
    console.log(`    ${scenario.why}`);
  }
  console.log(`\n${result.scenarios.length} high-value scenarios generated.`);
}

function printGaps(result) {
  console.log(`UI ICEBERG\n${result.journey.replaceAll("_", " ")} journey\n${"─".repeat(44)}`);
  console.log(`Existing tests        ${result.existingTests}`);
  console.log(`Important scenarios   ${result.scenarios.length}`);
  console.log(`Candidate covered     ${result.summary["candidate-covered"]}`);
  console.log(`Partial               ${result.summary.partial}`);
  console.log(`Missing               ${result.summary.missing}`);

  const high = result.gaps.filter((gap) => gap.priority === "critical" || gap.priority === "high").slice(0, 8);
  console.log("\nHIGH-VALUE GAPS");
  if (!high.length) console.log("  No high-priority candidate gaps found by static mapping.");
  for (const gap of high) {
    console.log(`\n${icon(gap.evidence.state)} ${gap.title}`);
    console.log(`  Priority: ${gap.priority.toUpperCase()} | Evidence: ${gap.evidence.state}`);
    console.log(`  Why: ${gap.why}`);
  }

  if (result.testNext) {
    console.log(`\nTEST NEXT\n${result.testNext.title}`);
    console.log(`Why: ${result.testNext.why}`);
  }
  console.log(`\nEvidence note: ${result.evidencePolicy.statement}`);
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
    if (!journey) throw new Error("scenarios requires a journey, e.g. `ui-iceberg scenarios checkout`");
    const result = generateScenarios(journey, { limit: optionNumber("limit") });
    if (json) console.log(JSON.stringify(result, null, 2));
    else printScenarios(result);
    process.exit(0);
  }

  if (command === "gaps") {
    const journey = values[1];
    if (!journey) throw new Error("gaps requires a journey, e.g. `ui-iceberg gaps checkout .`");
    const root = values[2] || ".";
    const result = await analyzeJourneyGaps(root, journey, { limit: optionNumber("limit") });
    if (json) console.log(JSON.stringify(result, null, 2));
    else printGaps(result);
    process.exit(0);
  }

  throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(`UI Iceberg error: ${error.message}`);
  process.exit(1);
}
