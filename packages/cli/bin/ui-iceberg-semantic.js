#!/usr/bin/env node
import process from "node:process";
import { analyzeJourneySemantics } from "../../core/src/semantic-assurance.js";

const args = process.argv.slice(2);
const journey = args[0];
const root = args[1] || ".";
const json = args.includes("--json");

function printHelp() {
  console.log(`UI Iceberg semantic assurance\n\nUsage:\n  node packages/cli/bin/ui-iceberg-semantic.js <journey> [path] [--json]\n\nExample:\n  node packages/cli/bin/ui-iceberg-semantic.js checkout examples/quickstart-checkout\n`);
}

function format(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "n/a";
}

function print(result) {
  const semantic = result.semanticAssurance;
  console.log(`UI ICEBERG\nSemantic assurance · ${result.journey.replaceAll("_", " ")}\n${"─".repeat(58)}`);
  console.log(`Repository              ${result.repository}`);
  console.log(`Admission               ${semantic.admission.status}`);
  console.log(`Semantic entropy H_S    ${format(semantic.summary.semanticEntropy)}`);
  console.log(`Semantic risk R_S       ${format(semantic.summary.semanticRisk)}`);
  console.log(`Reference ||Δ_G||       ${format(semantic.summary.driftNorm)}`);
  console.log(`Active G coordinates    ${semantic.summary.activeCoordinates}`);
  console.log(`Deceptive witnesses     ${semantic.summary.deceptiveWitnesses}`);
  console.log(`Flux mode               ${semantic.summary.entropyRiskFlux.mode}`);
  console.log(`Flux classification     ${semantic.summary.entropyRiskFlux.classification}`);

  console.log("\nTYPED SEMANTIC DISPLACEMENT");
  for (const coordinate of semantic.coordinates.filter((item) => item.applicable)) {
    console.log(`${coordinate.id.padEnd(4)} ${coordinate.name.padEnd(13)} Δref=${String(coordinate.referenceDisplacement).padEnd(7)} H=${format(coordinate.entropy)} R=${format(coordinate.risk)} ${coordinate.referenceDirection}`);
    console.log(`     trajectory: ${coordinate.trajectoryDirection}${Number.isFinite(coordinate.temporalDelta) ? ` · Δt=${format(coordinate.temporalDelta)}` : ""}`);
    if (coordinate.pressures.length) console.log(`     pressures: ${coordinate.pressures.join(", ")}`);
    if (coordinate.deceptiveWitnesses.length) console.log(`     DW: ${coordinate.deceptiveWitnesses.join(", ")}`);
  }

  if (semantic.deceptiveWitnesses.length) {
    console.log("\nDECEPTIVE-WITNESS FINDINGS");
    for (const finding of semantic.deceptiveWitnesses.slice(0, 8)) {
      console.log(`• ${finding.id} · ${finding.scenarioId} · ${finding.affectedTypes.join(", ")}`);
      console.log(`  Local witness: ${finding.localWitness}`);
      console.log(`  Hidden defeater: ${finding.hiddenDefeater}`);
      console.log(`  Entropy effect: ${finding.entropyEffect}`);
    }
  }

  if (semantic.couplingCandidates.length) {
    console.log("\nCOUPLING CANDIDATES");
    for (const coupling of semantic.couplingCandidates.slice(0, 5)) {
      console.log(`• ${coupling.id} · scenarios: ${coupling.scenarioIds.join(", ")}${coupling.pressures.length ? ` · pressures: ${coupling.pressures.join(", ")}` : ""}`);
    }
    console.log("  Couplings are co-activation hypotheses; no tensor weight is invented without evidence.");
  }

  if (semantic.firstBite.next) {
    const bite = semantic.firstBite.next;
    console.log("\nFIRST BITE / TEST NEXT");
    console.log(bite.title);
    console.log(`Types: ${bite.semanticTypes.join(", ")}`);
    if (bite.pressures.length) console.log(`Pressures: ${bite.pressures.join(", ")}`);
    console.log(`Expected uncertainty reduction: ${format(bite.expectedUncertaintyReduction)}`);
    console.log(`Relative cost: ${bite.relativeCost}`);
    console.log(`Why: ${bite.rationale}`);
    console.log(`Boundary: ${bite.boundary}`);
  }

  console.log(`\nAdmission note: ${semantic.admission.reason}`);
  console.log(`Model boundary: ${semantic.manifold.boundary}`);
}

if (!journey || journey === "help" || args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

try {
  const result = await analyzeJourneySemantics(root, journey);
  if (json) console.log(JSON.stringify(result, null, 2));
  else print(result);
} catch (error) {
  console.error(`UI Iceberg semantic assurance error: ${error.message}`);
  process.exit(1);
}
