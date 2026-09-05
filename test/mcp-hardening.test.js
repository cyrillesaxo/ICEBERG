import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleRpc } from "../mcp/server/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const otpFixture = path.resolve(here, "../benchmarks/false-convergence/UI-006-otp-interruption");

test("MCP generate_scenarios can use repository signals for bounded hardening", async () => {
  const response = await handleRpc({
    jsonrpc: "2.0",
    id: 50,
    method: "tools/call",
    params: {
      name: "generate_scenarios",
      arguments: { journey: "checkout", path: otpFixture, limit: 30, patternLimit: 4 }
    }
  });

  assert.equal(response.result.isError, false);
  const value = response.result.structuredContent;
  assert.ok(value.hardening.selected >= 1);
  assert.ok(value.scenarios.some((scenario) => scenario.source === "failure-pattern-library"));
  assert.ok(value.scenarios.every((scenario) => scenario.id));
  assert.match(value.hardening.boundary, /not evidence/i);
});
