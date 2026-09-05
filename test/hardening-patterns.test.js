import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeJourneyGaps, scanRepository } from "../packages/core/src/index.js";
import { listFailurePatterns, selectFailurePatterns } from "../packages/scenarios/src/failure-patterns.js";

async function hardenedFixtureRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ui-iceberg-hardening-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "tests"), { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "async-checkout", dependencies: { react: "^19.0.0", "@tanstack/react-query": "^5.0.0" }, devDependencies: { "@playwright/test": "^1.50.0" } })
  );
  await fs.writeFile(
    path.join(root, "src", "Checkout.jsx"),
    `
      export function Checkout() {
        const token = localStorage.getItem('accessToken');
        async function pay() {
          const response = await fetch('/api/payment', { headers: { authorization: token } });
          return response.json();
        }
        return <button onClick={pay}>Pay now</button>;
      }
    `
  );
  await fs.writeFile(
    path.join(root, "src", "payment-callback.js"),
    `export function resume(){ window.location.href = '/checkout/callback'; }`
  );
  await fs.writeFile(
    path.join(root, "tests", "checkout.spec.js"),
    `test('checkout success', async () => { /* happy path only */ });`
  );
  return root;
}

test("failure-pattern library is bounded and carries explicit proof boundaries", () => {
  const all = listFailurePatterns();
  assert.ok(all.length >= 15);
  const selected = selectFailurePatterns(["async-network", "auth-session", "external-redirect"], { limit: 4 });
  assert.ok(selected.length <= 4);
  assert.ok(selected.some((item) => item.id === "ASYNC_LATE_RESPONSE_OVERWRITE"));
  assert.ok(selected.some((item) => item.id === "SESSION_REFRESH_RACE"));
  assert.ok(selected.every((item) => /not evidence/i.test(item.proofBoundary)));
});

test("repository scan fingerprints implementation risks without claiming defects", async () => {
  const root = await hardenedFixtureRepo();
  const scan = await scanRepository(root);
  const ids = new Set(scan.riskSignals.map((signal) => signal.id));
  assert.ok(ids.has("async-network"));
  assert.ok(ids.has("auth-session"));
  assert.ok(ids.has("browser-persistence"));
  assert.ok(ids.has("external-redirect"));
  assert.match(scan.hardeningPolicy.statement, /test hypothesis/i);
});

test("gap analysis adds repository-relevant hardening scenarios", async () => {
  const root = await hardenedFixtureRepo();
  const report = await analyzeJourneyGaps(root, "checkout", { patternLimit: 6 });
  const ids = new Set(report.scenarios.map((scenario) => scenario.id));
  assert.ok(report.hardenedScenarioCount > 0);
  assert.ok(ids.has("ASYNC_LATE_RESPONSE_OVERWRITE"));
  assert.ok(ids.has("SESSION_REFRESH_RACE"));
  assert.ok(ids.has("EXTERNAL_REDIRECT_RETURN_STATE"));
  assert.match(report.evidencePolicy.hardening, /not proof/i);
});
