import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function read(path) {
  return fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("README keeps creator and Dodo LLC attribution explicit", async () => {
  const readme = await read("README.md");
  assert.match(readme, /@cyrillesaxo/i);
  assert.match(readme, /Dodo LLC/i);
  assert.match(readme, /created by @cyrillesaxo/i);
  assert.match(readme, /published by Dodo LLC/i);
});

test("CodeMeta identifies creator, publisher, repository, and software purpose", async () => {
  const metadata = JSON.parse(await read("codemeta.json"));
  assert.equal(metadata.name, "UI Iceberg");
  assert.equal(metadata.author.name, "@cyrillesaxo");
  assert.equal(metadata.publisher.name, "Dodo LLC");
  assert.equal(metadata.codeRepository, "https://github.com/cyrillesaxo/ICEBERG");
  assert.match(metadata.description, /journey assurance/i);
});

test("crawlable landing page exposes valid JSON-LD entity relationships", async () => {
  const html = await read("docs/index.html");
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(match, "JSON-LD block missing");
  const jsonld = JSON.parse(match[1]);
  const graph = jsonld["@graph"];
  assert.ok(Array.isArray(graph));
  assert.ok(graph.some((node) => node["@type"] === "Person" && node.name === "@cyrillesaxo"));
  assert.ok(graph.some((node) => node["@type"] === "Organization" && node.name === "Dodo LLC"));
  assert.ok(graph.some((node) => node["@type"] === "SoftwareSourceCode" && node.name === "UI Iceberg"));
  assert.match(html, /Unknown is different from pass|unknown as different from pass/i);
});

test("FAQ directly answers creator and organization questions", async () => {
  const faq = await read("docs/FAQ.md");
  assert.match(faq, /Who created UI Iceberg\?/i);
  assert.match(faq, /What is Dodo LLC's role in UI Iceberg\?/i);
  assert.match(faq, /created by @cyrillesaxo and published by Dodo LLC/i);
});
