import test from "node:test";
import assert from "node:assert/strict";
import { handleRpc, MCP_TOOLS } from "../mcp/server/index.js";

test("MCP exposes planning, gap, Playwright scaffold, and runtime verification tools", () => {
  const names = MCP_TOOLS.map((tool) => tool.name);
  assert.deepEqual(names, ["scan_repository", "generate_scenarios", "find_gaps", "generate_test_spec", "verify_journey"]);
});

test("MCP initialize and tools/list are JSON-RPC compatible", async () => {
  const init = await handleRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
  assert.equal(init.result.serverInfo.name, "ui-iceberg");
  assert.equal(init.result.serverInfo.version, "0.2.0");
  const list = await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.equal(list.result.tools.length, 5);
});

test("MCP generate_scenarios returns structured scenario data", async () => {
  const response = await handleRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "generate_scenarios", arguments: { journey: "subscription cancellation", limit: 5 } }
  });
  assert.equal(response.result.isError, false);
  assert.equal(response.result.structuredContent.scenarios.length, 5);
  assert.ok(response.result.structuredContent.scenarios.some((item) => item.category === "agency"));
});

test("MCP generate_test_spec returns Playwright tests skipped by default", async () => {
  const response = await handleRpc({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "generate_test_spec", arguments: { journey: "checkout", limit: 2, adapter: "playwright" } }
  });
  assert.equal(response.result.isError, false);
  assert.match(response.result.structuredContent.content, /test\.skip/);
  assert.equal(response.result.structuredContent.scenarios.length, 2);
});
