import test from "node:test";
import assert from "node:assert/strict";
import { handleRpc, MCP_PROTOCOLS, MCP_TOOLS } from "../mcp/server/index.js";

test("MCP exposes planning, gap, verification, admission, reactivation, and receipt tools", () => {
  const names = MCP_TOOLS.map((tool) => tool.name);
  assert.deepEqual(names, [
    "scan_repository",
    "generate_scenarios",
    "find_gaps",
    "select_first_bite",
    "generate_test_spec",
    "verify_journey",
    "admit_evidence",
    "reactivation_impact",
    "issue_receipt"
  ]);
});

test("legacy initialize remains compatible", async () => {
  const init = await handleRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: MCP_PROTOCOLS.legacy } });
  assert.equal(init.result.serverInfo.name, "ui-iceberg");
  assert.equal(init.result.serverInfo.version, "0.3.0");
  const list = await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.equal(list.result.tools.length, 9);
  assert.equal(list.result.resultType, undefined);
});

test("2026-07-28 server/discover advertises stateless modern MCP", async () => {
  const discover = await handleRpc({
    jsonrpc: "2.0",
    id: "discover-1",
    method: "server/discover",
    params: {
      _meta: {
        "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOLS.modern,
        "io.modelcontextprotocol/clientInfo": { name: "test-client", version: "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  });
  assert.equal(discover.result.resultType, "complete");
  assert.ok(discover.result.supportedVersions.includes("2026-07-28"));
  assert.equal(discover.result._meta["io.modelcontextprotocol/serverInfo"].name, "ui-iceberg");
  assert.match(discover.result.instructions, /Unknown is not PASS/i);
});

test("modern tools/list is cacheable and stamped with server identity", async () => {
  const response = await handleRpc({
    jsonrpc: "2.0",
    id: 20,
    method: "tools/list",
    params: { _meta: { "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOLS.modern } }
  });
  assert.equal(response.result.resultType, "complete");
  assert.equal(response.result.cacheScope, "public");
  assert.equal(response.result.ttlMs, 300000);
  assert.equal(response.result.tools.length, 9);
});

test("unsupported modern protocol revision fails explicitly", async () => {
  const response = await handleRpc({
    jsonrpc: "2.0",
    id: 21,
    method: "tools/list",
    params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2099-01-01" } }
  });
  assert.equal(response.error.code, -32022);
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

test("MCP admission preserves flaky as inconclusive", async () => {
  const response = await handleRpc({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "admit_evidence",
      arguments: {
        claim: { id: "otp-return" },
        evidence: [{ id: "E1", state: "linked-flaky", channel: "playwright" }]
      },
      _meta: { "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOLS.modern }
    }
  });
  assert.equal(response.result.resultType, "complete");
  assert.equal(response.result.structuredContent.verdict, "INCONCLUSIVE");
});
