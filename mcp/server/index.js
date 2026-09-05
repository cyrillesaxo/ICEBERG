#!/usr/bin/env node
import readline from "node:readline";
import { analyzeJourneyGaps, generateScenarios, scanRepository } from "../../packages/core/src/index.js";
import { emitPlaywrightScenarioSpec, verifyJourneyWithPlaywright } from "../../packages/runtime/src/index.js";

export const MCP_TOOLS = Object.freeze([
  {
    name: "scan_repository",
    description: "Inspect a UI repository and report detected test tools, candidate critical user journeys, and a bounded implementation-risk fingerprint used for scenario hardening.",
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
    description: "Map a prioritized journey scenario set against existing repository tests and return candidate coverage gaps, including bounded repository-risk scenarios. Results are evidence candidates, not proof of coverage or defects.",
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
  }
]);

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
    return analyzeJourneyGaps(input.path || process.cwd(), input.journey, {
      limit: input.limit,
      patternLimit: input.patternLimit
    });
  }
  if (name === "generate_test_spec") return emitPlaywrightScenarioSpec(input.journey, { limit: input.limit });
  if (name === "verify_journey") return verifyJourneyWithPlaywright(input.path || process.cwd(), input.journey, input.report, { limit: input.limit });
  throw new Error(`Unknown tool: ${name}`);
}

function resultPayload(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
    isError: false
  };
}

export async function handleRpc(message) {
  const { id, method, params = {} } = message;
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params.protocolVersion || "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "ui-iceberg", version: "0.2.0" }
      }
    };
  }
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } };
  if (method === "tools/call") {
    try {
      const value = await callTool(params.name, params.arguments || {});
      return { jsonrpc: "2.0", id, result: resultPayload(value) };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: error.message }], isError: true }
      };
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
