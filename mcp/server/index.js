#!/usr/bin/env node
import readline from "node:readline";
import { analyzeJourneyGaps, generateScenarios, scanRepository } from "../../packages/core/src/index.js";
import { prioritizeScenarioGaps } from "../../packages/core/src/prioritize.js";
import { emitPlaywrightScenarioSpec, verifyJourneyWithPlaywright } from "../../packages/runtime/src/index.js";
import {
  admitEvidence,
  analyzeReactivationImpact,
  inspectDeceptiveWitness,
  issueAssuranceReceipt,
  selectFirstBite
} from "../../packages/assurance/src/index.js";

export const MCP_PROTOCOLS = Object.freeze({
  modern: "2026-07-28",
  legacy: "2025-06-18"
});

export const MCP_SERVER_INFO = Object.freeze({ name: "ui-iceberg", version: "0.4.0" });

const SERVER_INFO_META_KEY = "io.modelcontextprotocol/serverInfo";
const PROTOCOL_VERSION_META_KEY = "io.modelcontextprotocol/protocolVersion";

const EVIDENCE_RISK_SCHEMA = {
  anyOf: [
    { type: "string" },
    {
      type: "object",
      properties: {
        id: { type: "string" },
        severity: { type: "string" },
        boundary: { type: "string" }
      },
      additionalProperties: true
    }
  ]
};

const EVIDENCE_ITEM_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    state: { type: "string" },
    channel: { type: "string" },
    source: { type: "string" },
    scope: { type: "string" },
    scenarioId: { type: "string" },
    note: { type: "string" },
    evidenceRisks: { type: "array", items: EVIDENCE_RISK_SCHEMA },
    characteristics: { type: "object", additionalProperties: { type: "boolean" } }
  },
  additionalProperties: true
};

const DECEPTIVE_WITNESS_INPUT_SCHEMA = {
  type: "object",
  properties: {
    claim: { type: "object", additionalProperties: true },
    scope: { type: "string" },
    scenarioId: { type: "string" },
    witness: EVIDENCE_ITEM_SCHEMA,
    evidenceRisks: { type: "array", items: EVIDENCE_RISK_SCHEMA },
    characteristics: { type: "object", additionalProperties: { type: "boolean" } }
  },
  additionalProperties: false
};

export const MCP_TOOLS = Object.freeze([
  {
    name: "scan_repository",
    description: "Inspect a UI repository and report detected test tools, candidate critical user journeys, a bounded implementation-risk fingerprint, and test-evidence risks used for scenario hardening and deceptive-witness checks.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Repository path. Defaults to current working directory." } },
      additionalProperties: false
    }
  },
  {
    name: "generate_scenarios",
    description: "Generate a prioritized UI scenario plan. If a repository path is provided, add a bounded set of repository-relevant failure scenarios from implementation signals; those signals are hypotheses, not proof of defects.",
    inputSchema: {
      type: "object",
      required: ["journey"],
      properties: {
        journey: { type: "string" },
        path: { type: "string", description: "Optional repository path for repository-aware hardening." },
        limit: { type: "integer", minimum: 1, maximum: 100 },
        patternLimit: { type: "integer", minimum: 1, maximum: 20 }
      },
      additionalProperties: false
    }
  },
  {
    name: "find_gaps",
    description: "Map a journey scenario set against existing tests, add bounded repository-risk scenarios, identify deceptive-green test evidence risks, and rank the next test using repository relevance. Results are evidence candidates, not proof of coverage or defects.",
    inputSchema: {
      type: "object",
      required: ["journey"],
      properties: {
        journey: { type: "string" },
        path: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 100 },
        patternLimit: { type: "integer", minimum: 1, maximum: 20 }
      },
      additionalProperties: false
    }
  },
  {
    name: "check_deceptive_witness",
    description: "Inspect an apparent witness for bounded evidence-channel distortions such as forced action, authority substitution, retry laundering, visual-only oracle scope, or semantic target drift. The result weakens claim licensing but is not a product-defect verdict.",
    inputSchema: {
      ...DECEPTIVE_WITNESS_INPUT_SCHEMA,
      required: ["witness"]
    }
  },
  {
    name: "select_first_bite",
    description: "Rank supplied gap scenarios and return the smallest highest-value next discriminating probe. If a deceptive witness directly supports the top scenario claim, prefer a probe that tests the distortion before admission. The recommendation is not a defect probability.",
    inputSchema: {
      type: "object",
      required: ["gaps"],
      properties: {
        gaps: { type: "array", items: { type: "object", additionalProperties: true } },
        riskSignals: { type: "array", items: { anyOf: [{ type: "string" }, { type: "object", additionalProperties: true }] } },
        deceptiveWitnesses: { type: "array", items: DECEPTIVE_WITNESS_INPUT_SCHEMA }
      },
      additionalProperties: false
    }
  },
  {
    name: "generate_test_spec",
    description: "Generate a skipped Playwright scaffold for prioritized UI Iceberg scenarios. The agent must implement product-specific actions/assertions before enabling tests.",
    inputSchema: {
      type: "object",
      required: ["journey"],
      properties: {
        journey: { type: "string" },
        adapter: { type: "string", enum: ["playwright"] },
        limit: { type: "integer", minimum: 1, maximum: 100 }
      },
      additionalProperties: false
    }
  },
  {
    name: "verify_journey",
    description: "Reconcile a Playwright JSON runtime report with the repository-aware UI Iceberg scenario plan. Explicit scenario links are stronger than lexical runtime candidates; flaky passes remain flaky.",
    inputSchema: {
      type: "object",
      required: ["journey", "report"],
      properties: {
        journey: { type: "string" },
        path: { type: "string" },
        report: { type: "string", description: "Path to a Playwright JSON reporter output." },
        adapter: { type: "string", enum: ["playwright"] },
        limit: { type: "integer", minimum: 1, maximum: 100 }
      },
      additionalProperties: false
    }
  },
  {
    name: "admit_evidence",
    description: "Issue a scoped admission verdict from supplied witnesses and antiwitnesses after bounded deceptive-witness filtering. Unknown/candidate evidence, claim-blocking deceptive witnesses, and flaky execution never become PASS; stronger human, accessibility, production, causal, and business claims remain unlicensed unless separately evidenced.",
    inputSchema: {
      type: "object",
      required: ["claim", "evidence"],
      properties: {
        claim: { type: "object", additionalProperties: true },
        scope: { type: "string" },
        evidence: { type: "array", items: { anyOf: [{ type: "string" }, EVIDENCE_ITEM_SCHEMA] } },
        antiwitnesses: { type: "array", items: { anyOf: [{ type: "string" }, EVIDENCE_ITEM_SCHEMA] } }
      },
      additionalProperties: false
    }
  },
  {
    name: "reactivation_impact",
    description: "Determine which previously evaluated scenarios should be reactivated after changed files or implementation-pressure signals. Unmapped changes remain unknown rather than being treated as safe.",
    inputSchema: {
      type: "object",
      properties: {
        changedFiles: { type: "array", items: { type: "string" } },
        changedSignals: { type: "array", items: { anyOf: [{ type: "string" }, { type: "object", additionalProperties: true }] } },
        scenarios: { type: "array", items: { type: "object", additionalProperties: true } },
        previousReceipt: { type: "object", additionalProperties: true }
      },
      additionalProperties: false
    }
  },
  {
    name: "issue_receipt",
    description: "Create a compact deterministic ICEBERG assurance receipt linking scan, gap map, deceptive-witness audit, Test Next, admission, reactivation, allowed conclusion, non-established claims, and residual unknowns.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        journey: { type: "string" },
        scan: { type: "object", additionalProperties: true },
        gapMap: { type: "object", additionalProperties: true },
        deceptiveWitnessAudit: { type: "object", additionalProperties: true },
        testNext: { type: "object", additionalProperties: true },
        admission: { type: "object", additionalProperties: true },
        reactivation: { type: "object", additionalProperties: true },
        allowedConclusion: { type: "string" },
        notEstablished: { type: "array", items: { type: "string" } },
        residualUnknowns: { type: "array", items: { type: "string" } }
      },
      additionalProperties: false
    }
  }
]);

function prioritizeGapReport(report) {
  const gaps = prioritizeScenarioGaps(report.gaps || [], report.riskSignals || []);
  return { ...report, gaps, testNext: gaps[0] || null };
}

export async function callTool(name, input = {}) {
  if (name === "scan_repository") return scanRepository(input.path || process.cwd());
  if (name === "generate_scenarios") {
    let riskSignals = [];
    if (input.path) {
      const scan = await scanRepository(input.path);
      riskSignals = scan.riskSignals;
    }
    return generateScenarios(input.journey, {
      limit: input.limit,
      patternLimit: input.patternLimit,
      riskSignals
    });
  }
  if (name === "find_gaps") {
    const report = await analyzeJourneyGaps(input.path || process.cwd(), input.journey, {
      limit: input.limit,
      patternLimit: input.patternLimit
    });
    return prioritizeGapReport(report);
  }
  if (name === "check_deceptive_witness") return inspectDeceptiveWitness(input);
  if (name === "select_first_bite") return selectFirstBite(input.gaps || [], input.riskSignals || [], { deceptiveWitnesses: input.deceptiveWitnesses || [] });
  if (name === "generate_test_spec") return emitPlaywrightScenarioSpec(input.journey, { limit: input.limit });
  if (name === "verify_journey") return verifyJourneyWithPlaywright(input.path || process.cwd(), input.journey, input.report, { limit: input.limit });
  if (name === "admit_evidence") return admitEvidence(input);
  if (name === "reactivation_impact") return analyzeReactivationImpact(input);
  if (name === "issue_receipt") return issueAssuranceReceipt(input);
  throw new Error(`Unknown tool: ${name}`);
}

function serverMeta() {
  return { [SERVER_INFO_META_KEY]: MCP_SERVER_INFO };
}

function modernResult(value) {
  return { resultType: "complete", ...value, _meta: { ...(value?._meta || {}), ...serverMeta() } };
}

function resultPayload(value, modern = false) {
  const result = {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
    isError: false
  };
  return modern ? modernResult(result) : result;
}

function errorPayload(message, modern = false) {
  const result = { content: [{ type: "text", text: message }], isError: true };
  return modern ? modernResult(result) : result;
}

function requestedProtocol(message) {
  return message?.params?._meta?.[PROTOCOL_VERSION_META_KEY] || null;
}

function isModernRequest(message) {
  return message?.method === "server/discover" || requestedProtocol(message) === MCP_PROTOCOLS.modern;
}

function unsupportedProtocol(id, version) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32022,
      message: `Unsupported MCP protocol version: ${version}`,
      data: { supportedVersions: [MCP_PROTOCOLS.modern, MCP_PROTOCOLS.legacy] }
    }
  };
}

export async function handleRpc(message) {
  const { id, method, params = {} } = message;
  const version = requestedProtocol(message);
  if (version && !Object.values(MCP_PROTOCOLS).includes(version)) return unsupportedProtocol(id, version);

  if (method === "server/discover") {
    return {
      jsonrpc: "2.0",
      id,
      result: modernResult({
        supportedVersions: [MCP_PROTOCOLS.modern, MCP_PROTOCOLS.legacy],
        capabilities: { tools: {} },
        instructions: "Use scan/gap tools to form bounded hypotheses, check_deceptive_witness before trusting apparent support, select_first_bite to choose the next discriminating probe, admit_evidence only after evidence exists, and reactivation_impact after meaningful changes. Unknown is not PASS; flaky is not PASS; nominally green is not automatically admissible.",
        ttlMs: 300000,
        cacheScope: "public"
      })
    };
  }

  // Backward-compatible 2025-era handshake. Modern 2026-07-28 clients use server/discover instead.
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params.protocolVersion || MCP_PROTOCOLS.legacy,
        capabilities: { tools: {} },
        serverInfo: MCP_SERVER_INFO
      }
    };
  }

  const modern = isModernRequest(message);
  if (method === "tools/list") {
    const result = { tools: MCP_TOOLS };
    if (modern) {
      result.ttlMs = 300000;
      result.cacheScope = "public";
    }
    return { jsonrpc: "2.0", id, result: modern ? modernResult(result) : result };
  }

  if (method === "tools/call") {
    try {
      const value = await callTool(params.name, params.arguments || {});
      return { jsonrpc: "2.0", id, result: resultPayload(value, modern) };
    } catch (error) {
      return { jsonrpc: "2.0", id, result: errorPayload(error.message, modern) };
    }
  }

  if (method?.startsWith("notifications/")) return null;
  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
}

async function startStdio() {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })}\n`);
      continue;
    }
    const response = await handleRpc(message);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) startStdio();
