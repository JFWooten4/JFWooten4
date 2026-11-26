"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { reconcile, readState, issueBody, synchronize, githubApi } = require("./redirect-link-issues");

const run = "https://github.com/JFWooten4/JFWooten4/actions/runs/123";
const ref = key => ({ key, source: "redirects/main.toml" });
const entry = (key, state, status, url = "https://example.com/" + key) => ({
  state, status, url, references: [ref(key)],
});

function mockApi(issues = [], labelExists = true) {
  const calls = [];
  const api = async (method, route, data) => {
    calls.push({ method, route, data });
    if (method === "GET" && route.startsWith("/issues?")) return issues;
    if (method === "GET" && route === "/labels/broken-links") return labelExists ? { name: "broken-links" } : null;
    if (method === "POST" || method === "PATCH") return {};
    throw new Error("Unexpected request " + method + " " + route);
  };
  return { api, calls };
}

function managed(row, number = 42, state = "open") {
  return { number, state, title: "🔗 Repair broken shortlink /" + row.key, body: issueBody([row], run),
    assignees: [{ login: "JFWooten4" }], labels: [{ name: "broken-links" }] };
}

const row = key => reconcile([entry(key, "dead", 404)], [])[0];
const creates = calls => calls.filter(call => call.method === "POST" && call.route === "/issues");
const updates = calls => calls.filter(call => call.method === "PATCH");

test("creates exactly one assigned issue per broken shortlink, including aliases", async () => {
  const { api, calls } = mockApi([], false);
  const shared = entry("missing", "dead", 404);
  shared.references.push(ref("alias"));
  const result = await synchronize([shared, entry("gone", "dead", 410), entry("blocked", "inconclusive", 403)], api, run);
  assert.equal(result.created, 3);
  assert.deepEqual(creates(calls).map(call => call.data.title), [
    "🔗 Repair broken shortlink /alias", "🔗 Repair broken shortlink /gone", "🔗 Repair broken shortlink /missing",
  ]);
  for (const create of creates(calls)) {
    assert.deepEqual(create.data.assignees, ["JFWooten4"]);
    assert.deepEqual(create.data.labels, ["broken-links"]);
    assert.match(create.data.body, /@JFWooten4/);
    assert.match(create.data.body, /actions\/runs\/123/);
    assert.equal(readState(create.data.body).length, 1);
  }
  assert.equal(calls.filter(call => call.route === "/labels" && call.method === "POST").length, 1);
});

test("does not open an issue for access-blocked or rate-limited destinations", async () => {
  const { api, calls } = mockApi();
  assert.equal((await synchronize([entry("blocked", "inconclusive", 403), entry("rate", "inconclusive", 429)], api, run)).created, 0);
  assert.ok(calls.every(call => call.method === "GET"));
});

test("repeated failures do not edit or duplicate the existing issue", async () => {
  const { api, calls } = mockApi([managed(row("missing"))]);
  assert.equal((await synchronize([entry("missing", "dead", 404)], api, run + "4")).unchanged, 1);
  assert.ok(calls.every(call => call.method === "GET"));
});

test("updates a changed failure and opens a separate issue for a new link", async () => {
  const existing = managed(row("missing"));
  existing.assignees.push({ login: "helper" });
  existing.labels.push({ name: "other" });
  const { api, calls } = mockApi([existing]);
  const counts = await synchronize([entry("missing", "dead", 410), entry("new", "dead", 410)], api, run);
  assert.equal(counts.updated, 1);
  assert.equal(counts.created, 1);
  const update = updates(calls)[0];
  assert.equal(update.route, "/issues/42");
  assert.deepEqual(update.data.assignees, ["JFWooten4", "helper"]);
  assert.deepEqual(update.data.labels, ["broken-links", "other"]);
  assert.equal(readState(update.data.body)[0].status, 410);
  assert.equal(readState(creates(calls)[0].data.body)[0].key, "new");
});

test("keeps a prior failure open if its replacement cannot be checked", async () => {
  const { api, calls } = mockApi([managed(row("missing"))]);
  assert.equal((await synchronize([entry("missing", "inconclusive", 429, "https://example.com/new")], api, run)).updated, 1);
  const update = updates(calls)[0];
  assert.equal(readState(update.data.body)[0].pending, "https://example.com/new");
  assert.match(update.data.body, /recheck inconclusive/);
  assert.notEqual(update.data.state, "closed");
});

test("closes each recovered or removed link independently and never from an empty audit", async () => {
  const { api, calls } = mockApi([managed(row("missing")), managed(row("removed"), 43), managed(row("still"), 44)]);
  await assert.rejects(synchronize([], api, run), /Missing completed/);
  assert.equal(calls.length, 0);
  const counts = await synchronize([entry("missing", "ok", 200), entry("still", "dead", 404)], api, run);
  assert.equal(counts.closed, 2);
  assert.equal(counts.unchanged, 1);
  assert.deepEqual(updates(calls).map(call => call.route), ["/issues/42", "/issues/43"]);
  for (const update of updates(calls)) {
    assert.equal(update.data.state, "closed");
    assert.equal(update.data.state_reason, "completed");
    assert.equal(readState(update.data.body)[0].resolved, true);
  }
});

test("manual closure before repair reopens the same issue, never creates another", async () => {
  const { api, calls } = mockApi([managed(row("missing"), 42, "closed")]);
  const counts = await synchronize([entry("missing", "dead", 404)], api, run);
  assert.equal(counts.reopened, 1);
  assert.equal(creates(calls).length, 0);
  assert.equal(updates(calls)[0].route, "/issues/42");
  assert.equal(updates(calls)[0].data.state, "open");
});

test("manual closure followed by verified recovery records resolution without reopening", async () => {
  const { api, calls } = mockApi([managed(row("missing"), 42, "closed")]);
  const counts = await synchronize([entry("missing", "ok", 200)], api, run);
  assert.equal(counts.closed, 1);
  assert.equal(creates(calls).length, 0);
  assert.equal(updates(calls)[0].data.state, "closed");
  assert.equal(readState(updates(calls)[0].data.body)[0].resolved, true);
});

test("a new confirmed failure after verified recovery creates a fresh issue only once", async () => {
  const history = managed({ ...row("missing"), resolved: true }, 42, "closed");
  const first = mockApi([history]);
  assert.equal((await synchronize([entry("missing", "dead", 404)], first.api, run)).created, 1);
  const next = mockApi([history, managed(row("missing"), 43)]);
  assert.equal((await synchronize([entry("missing", "dead", 404)], next.api, run)).unchanged, 1);
  assert.equal(creates(next.calls).length, 0);
});

test("a resolved issue is not reopened on an inconclusive check", async () => {
  const { api, calls } = mockApi([managed({ ...row("missing"), resolved: true }, 42, "closed")]);
  await synchronize([entry("missing", "inconclusive", 429)], api, run);
  assert.ok(calls.every(call => call.method === "GET"));
});

test("fails safely for duplicate unresolved issues and ignores pull requests", async () => {
  const existing = managed(row("missing"));
  const { api, calls } = mockApi([existing, { ...existing, number: 43 }]);
  await assert.rejects(synchronize([entry("missing", "dead", 404)], api, run), /Multiple active/);
  assert.ok(calls.every(call => call.method === "GET"));
  const prs = mockApi([{ ...existing, pull_request: {} }]);
  assert.equal((await synchronize([entry("missing", "dead", 404)], prs.api, run)).created, 1);
});

test("GitHub credentials are sent only to the configured issue API", async () => {
  const calls = [];
  const api = githubApi("test-token", "JFWooten4/JFWooten4", "https://api.github.com", async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => [] };
  });
  await api("GET", "/issues?state=all");
  assert.equal(calls[0].url, "https://api.github.com/repos/JFWooten4/JFWooten4/issues?state=all");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.redirect, "error");
});
