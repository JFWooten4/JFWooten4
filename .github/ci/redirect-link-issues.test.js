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

function managed(rows) {
  return { number: 42, title: "🔗 Repair broken shortlinks", body: issueBody(rows, run),
    assignees: [{ login: "JFWooten4" }], labels: [{ name: "broken-links" }] };
}

test("opens an assigned, labeled issue for confirmed failures only", async () => {
  const { api, calls } = mockApi([], false);
  const results = [entry("missing", "dead", 404), entry("gone", "dead", 410), entry("blocked", "inconclusive", 403)];
  assert.equal(await synchronize(results, api, run), "created");
  const create = calls.find(call => call.method === "POST" && call.route === "/issues");
  assert.deepEqual(create.data.assignees, ["JFWooten4"]);
  assert.deepEqual(create.data.labels, ["broken-links"]);
  assert.equal(create.data.title, "🔗 Repair broken shortlinks");
  assert.match(create.data.body, /@JFWooten4/);
  assert.match(create.data.body, /actions\/runs\/123/);
  assert.deepEqual(readState(create.data.body).map(row => row.key), ["gone", "missing"]);
  assert.ok(calls.some(call => call.method === "POST" && call.route === "/labels"));
});

test("does not open an issue for only access-blocked or rate-limited destinations", async () => {
  const { api, calls } = mockApi();
  assert.equal(await synchronize([entry("blocked", "inconclusive", 403), entry("rate", "inconclusive", 429)], api, run), "clear");
  assert.ok(calls.every(call => call.method === "GET"));
});

test("does not edit or duplicate an unchanged issue", async () => {
  const results = [entry("missing", "dead", 404)];
  const { api, calls } = mockApi([managed(reconcile(results, []))]);
  assert.equal(await synchronize(results, api, run + "4"), "unchanged");
  assert.ok(calls.every(call => call.method === "GET"));
});

test("updates the same issue for changes and retains other labels and assignees", async () => {
  const existing = managed(reconcile([entry("missing", "dead", 404)], []));
  existing.assignees.push({ login: "helper" });
  existing.labels.push({ name: "other" });
  const { api, calls } = mockApi([existing]);
  assert.equal(await synchronize([entry("missing", "ok", 200), entry("new", "dead", 410)], api, run), "updated");
  const update = calls.find(call => call.method === "PATCH");
  assert.equal(update.route, "/issues/42");
  assert.deepEqual(update.data.assignees, ["JFWooten4", "helper"]);
  assert.deepEqual(update.data.labels, ["broken-links", "other"]);
  assert.deepEqual(readState(update.data.body).map(row => row.key), ["new"]);
  assert.ok(!calls.some(call => call.method === "POST" && call.route === "/issues"));
});

test("keeps previously confirmed failures open until recovery is verified", async () => {
  const prior = reconcile([entry("missing", "dead", 404)], []);
  const { api, calls } = mockApi([managed(prior)]);
  assert.equal(await synchronize([entry("missing", "inconclusive", 429, "https://example.com/new")], api, run), "updated");
  const update = calls.find(call => call.method === "PATCH");
  assert.equal(readState(update.data.body)[0].pending, "https://example.com/new");
  assert.match(update.data.body, /recheck inconclusive/);
  assert.notEqual(update.data.state, "closed");
});

test("closes the issue after verified recovery or mapping removal, not on an incomplete audit", async () => {
  const previous = reconcile([entry("missing", "dead", 404), entry("removed", "dead", 410)], []);
  const existing = managed(previous);
  const { api, calls } = mockApi([existing]);
  await assert.rejects(synchronize([], api, run), /Missing completed/);
  assert.equal(calls.length, 0);
  assert.equal(await synchronize([entry("missing", "ok", 200)], api, run), "closed");
  assert.deepEqual(calls.find(call => call.method === "PATCH").data, { state: "closed", state_reason: "completed" });
});

test("fails safely for duplicate managed issues and ignores pull requests", async () => {
  const results = [entry("missing", "dead", 404)];
  const existing = managed(reconcile(results, []));
  const { api, calls } = mockApi([existing, { ...existing, number: 43 }]);
  await assert.rejects(synchronize(results, api, run), /Multiple managed/);
  assert.ok(calls.every(call => call.method === "GET"));
  const prs = mockApi([{ ...existing, pull_request: {} }]);
  assert.equal(await synchronize(results, prs.api, run), "created");
});

test("GitHub credentials are sent only to the configured issue API", async () => {
  const calls = [];
  const api = githubApi("test-token", "JFWooten4/JFWooten4", "https://api.github.com", async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => [] };
  });
  await api("GET", "/issues?state=open");
  assert.equal(calls[0].url, "https://api.github.com/repos/JFWooten4/JFWooten4/issues?state=open");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.redirect, "error");
});
