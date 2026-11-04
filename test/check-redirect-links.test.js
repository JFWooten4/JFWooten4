"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { checkUrl, collectTargets, groupTargets } = require("../scripts/check-redirect-links");

function mockFetch(statuses) {
  const methods = [];
  const fetchImpl = async (_url, options) => {
    methods.push(options.method);
    return { status: statuses.shift(), body: null };
  };
  return { fetchImpl, methods };
}

test("reads redirects from both source maps", () => {
  const targets = collectTargets();
  assert.ok(targets.some((target) => target.source === "404.html" && target.key === "tar1"));
  assert.ok(targets.some((target) => target.source === "var/law.toml" && target.key === "_0"));
});

test("deduplicates destinations and resolves relative links", () => {
  const groups = groupTargets([
    { source: "404.html", key: "one", destination: "/tax/" },
    { source: "404.html", key: "two", destination: "https://wooten.link/tax/" },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].url, "https://wooten.link/tax/");
  assert.equal(groups[0].references.length, 2);
});

test("requires a second 404 response before marking a link dead", async () => {
  const mock = mockFetch([404, 404]);
  assert.deepEqual(await checkUrl("https://example.com/missing", mock.fetchImpl), { state: "dead", status: 404 });
  assert.deepEqual(mock.methods, ["GET", "GET"]);
});

test("recovers when a transient 404 succeeds on retry", async () => {
  const mock = mockFetch([404, 200]);
  assert.deepEqual(await checkUrl("https://example.com/recovered", mock.fetchImpl), { state: "ok", status: 200 });
});

test("does not mislabel blocked or rate-limited destinations as dead", async () => {
  for (const status of [401, 403, 429, 503]) {
    const mock = mockFetch(status === 503 ? [503, 503] : [status]);
    assert.equal((await checkUrl("https://example.com", mock.fetchImpl)).state, "inconclusive");
  }
});

test("does not confirm a 404 after a preceding server error", async () => {
  const mock = mockFetch([503, 404]);
  assert.equal((await checkUrl("https://example.com", mock.fetchImpl)).state, "inconclusive");
});

test("falls back to HEAD if a server rejects GET", async () => {
  const mock = mockFetch([405, 200]);
  assert.deepEqual(await checkUrl("https://example.com", mock.fetchImpl), { state: "ok", status: 200 });
  assert.deepEqual(mock.methods, ["GET", "HEAD"]);
});
