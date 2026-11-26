"use strict";

const fs = require("node:fs");

const title = key => "🔗 Repair broken shortlink /" + key;
const label = "broken-links";
const assignee = "JFWooten4";
const marker = "<!-- redirect-link-state:v2:";
const footer = '<p align="center"><a href="https://github.com/pony-factor/kefania"><img src="https://github.com/user-attachments/assets/2d5481b8-54dc-48c6-87e5-b67927d630bd" alt="Write PR descriptions automatically."></a></p>';

function readState(body) {
  const match = (body || "").match(/<!-- redirect-link-state:v2:([^\s]+) -->/);
  if (!match) throw new Error("Missing managed issue state");
  const rows = JSON.parse(decodeURIComponent(match[1]));
  if (!Array.isArray(rows) || rows.length !== 1 || rows.some(row => !row || typeof row.key !== "string" ||
      typeof row.url !== "string" || ![404, 410].includes(row.status))) {
    throw new Error("Invalid managed issue state");
  }
  return rows;
}

function reconcile(results, previous) {
  if (!Array.isArray(results) || !results.length) throw new Error("Missing completed link audit");
  const prior = new Map(previous.map(row => [row.key, row]));
  const seen = new Set();
  const rows = [];
  for (const result of results) {
    if (!result || !["ok", "dead", "inconclusive"].includes(result.state) ||
        typeof result.url !== "string" || !Array.isArray(result.references) ||
        !result.references.length || (result.state === "dead" && ![404, 410].includes(result.status))) {
      throw new Error("Invalid link audit result");
    }
    for (const ref of result.references) {
      if (!ref || typeof ref.key !== "string" || typeof ref.source !== "string" || seen.has(ref.key)) {
        throw new Error("Invalid or duplicate audit reference");
      }
      seen.add(ref.key);
      if (result.state === "dead") {
        rows.push({ key: ref.key, source: ref.source, url: result.url, status: result.status });
      } else if (result.state === "inconclusive" && prior.has(ref.key)) {
        // A temporary block is not proof that a previously broken shortlink works.
        rows.push({ ...prior.get(ref.key), source: ref.source, pending: result.url });
      }
      // Removed mappings and successfully checked destinations need no further action.
    }
  }
  return rows.sort((a, b) => a.key.localeCompare(b.key, "en"));
}

function cell(value) {
  return String(value).replace(/[\r\n]/g, " ").replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`/g, "'");
}

function issueBody(rows, runUrl) {
  const state = encodeURIComponent(JSON.stringify(rows)).replace(/-/g, "%2D");
  return [
    "@" + assignee + " — The shortlink audit detected a destination requiring repair.",
    "",
    (rows[0].resolved ? "Verified resolution: " : "Latest changed audit: ") + runUrl,
    "",
    "| Shortlink | Registry | Last confirmed HTTP status | Destination |",
    "| --- | --- | --- | --- |",
    ...rows.map(row => "| `/" + cell(row.key) + "` | `" + cell(row.source) + "` | " + row.status +
      (row.pending ? " (recheck inconclusive)" : "") + " | " + cell(row.url) +
      (row.pending && row.pending !== row.url ? " → " + cell(row.pending) : "") + " |"),
    "",
    "Every confirmed 404/410 is tracked without exceptions. Inconclusive rechecks do not resolve an existing failure. A new issue is created only after a verified resolution and a subsequent confirmed failure.",
    "",
    marker + state + " -->",
    "",
    footer,
  ].join("\n");
}

async function synchronize(results, api, runUrl) {
  // Validate the complete audit before making any GitHub changes.
  reconcile(results, []);
  const history = new Map();
  for (let page = 1; ; page++) {
    const issues = await api("GET", "/issues?state=all&per_page=100&page=" + page);
    if (!Array.isArray(issues)) throw new Error("Invalid GitHub issue list");
    for (const issue of issues) {
      if (issue.pull_request || !(issue.body || "").includes(marker)) continue;
      const [row] = readState(issue.body);
      const items = history.get(row.key) || [];
      items.push({ issue, row });
      history.set(row.key, items);
    }
    if (issues.length < 100) break;
  }

  const current = new Map();
  for (const [key, items] of history) {
    items.sort((a, b) => b.issue.number - a.issue.number);
    const unresolved = items.filter(item => !item.row.resolved);
    if (unresolved.length > 1 || items.slice(1).some(item => item.issue.state === "open")) {
      throw new Error("Multiple active managed issues for /" + key);
    }
    current.set(key, items[0]);
  }

  const previous = [...current.values()].filter(item => !item.row.resolved).map(item => item.row);
  const rows = new Map(reconcile(results, previous).map(row => [row.key, row]));
  const counts = { created: 0, updated: 0, reopened: 0, closed: 0, unchanged: 0 };
  let labelReady = false;

  async function ensureLabel() {
    if (labelReady) return;
    const found = await api("GET", "/labels/" + label, undefined, true);
    if (!found) await api("POST", "/labels", { name: label, color: "d73a4a", description: "Confirmed broken shortlink destinations" });
    labelReady = true;
  }

  for (const key of new Set([...current.keys(), ...rows.keys()])) {
    const latest = current.get(key);
    const row = rows.get(key);
    const existing = latest && !latest.row.resolved ? latest.issue : null;
    if (!row) {
      if (existing) {
        // Mark verified resolution atomically with closure. Manual closure alone is not recovery.
        await api("PATCH", "/issues/" + existing.number, {
          body: issueBody([{ ...latest.row, resolved: true }], runUrl),
          state: "closed", state_reason: "completed",
        });
        counts.closed++;
      } else if (latest && latest.issue.state === "open") {
        await api("PATCH", "/issues/" + latest.issue.number, { state: "closed", state_reason: "completed" });
        counts.closed++;
      }
      continue;
    }

    if (!existing) {
      if (latest && latest.issue.state === "open") {
        await api("PATCH", "/issues/" + latest.issue.number, { state: "closed", state_reason: "completed" });
      }
      await ensureLabel();
      await api("POST", "/issues", { title: title(key), body: issueBody([row], runUrl), assignees: [assignee], labels: [label] });
      counts.created++;
      continue;
    }

    const assigned = (existing.assignees || []).some(user => user.login.toLowerCase() === assignee.toLowerCase());
    const labeled = (existing.labels || []).some(item => item.name === label);
    if (existing.state === "open" && JSON.stringify(latest.row) === JSON.stringify(row) && assigned && labeled) {
      counts.unchanged++;
      continue;
    }
    if (!labeled) await ensureLabel();
    const update = {
      body: issueBody([row], runUrl),
      assignees: [...new Set([...(existing.assignees || []).map(user => user.login), assignee])],
      labels: [...new Set([...(existing.labels || []).map(item => item.name), label])],
    };
    if (existing.state === "closed") {
      update.state = "open";
      counts.reopened++;
    } else {
      counts.updated++;
    }
    await api("PATCH", "/issues/" + existing.number, update);
  }
  return counts;
}

function githubApi(token, repository, apiUrl, fetchImpl = fetch) {
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository || "")) throw new Error("Missing GitHub issue credentials");
  const base = apiUrl.replace(/\/$/, "") + "/repos/" + repository;
  return async (method, route, data, allowMissing = false) => {
    const response = await fetchImpl(base + route, {
      method, redirect: "error", signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) throw new Error("GitHub issue API " + method + " " + route + ": HTTP " + response.status);
    return response.status === 204 ? null : response.json();
  };
}

async function main() {
  const env = process.env;
  const results = JSON.parse(fs.readFileSync(env.LINK_CHECK_RESULTS, "utf8"));
  const api = githubApi(env.GITHUB_TOKEN, env.GITHUB_REPOSITORY, env.GITHUB_API_URL || "https://api.github.com");
  const runUrl = (env.GITHUB_SERVER_URL || "https://github.com") + "/" + env.GITHUB_REPOSITORY + "/actions/runs/" + env.GITHUB_RUN_ID;
  console.log("Broken-link issues:", await synchronize(results, api, runUrl));
}

if (require.main === module) main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = { reconcile, readState, issueBody, synchronize, githubApi };
