"use strict";

const fs = require("node:fs");

const title = "🔗 Repair broken shortlinks";
const label = "broken-links";
const assignee = "JFWooten4";
const marker = "<!-- redirect-link-state:v1:";
const footer = '<p align="center"><a href="https://github.com/pony-factor/kefania"><img src="https://github.com/user-attachments/assets/2d5481b8-54dc-48c6-87e5-b67927d630bd" alt="Write PR descriptions automatically."></a></p>';

function readState(body) {
  const match = (body || "").match(/<!-- redirect-link-state:v1:([^\s]+) -->/);
  if (!match) throw new Error("Missing managed issue state");
  const rows = JSON.parse(decodeURIComponent(match[1]));
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row.key !== "string" ||
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
    "@" + assignee + " — The scheduled shortlink audit detected destinations requiring repair.",
    "",
    "Latest changed audit: " + runUrl,
    "",
    "| Shortlink | Registry | Last confirmed HTTP status | Destination |",
    "| --- | --- | --- | --- |",
    ...rows.map(row => "| `/" + cell(row.key) + "` | `" + cell(row.source) + "` | " + row.status +
      (row.pending ? " (recheck inconclusive)" : "") + " | " + cell(row.url) +
      (row.pending && row.pending !== row.url ? " → " + cell(row.pending) : "") + " |"),
    "",
    "Access blocks (401/403), rate limits, and temporary failures are listed separately in the Actions report. Every confirmed 404/410 is tracked, including private destinations that return 404. Previously confirmed failures remain here until a successful check or mapping removal.",
    "",
    marker + state + " -->",
    "",
    footer,
  ].join("\n");
}

async function synchronize(results, api, runUrl) {
  // Validate the complete audit before making any GitHub changes.
  reconcile(results, []);
  const matches = [];
  for (let page = 1; ; page++) {
    const issues = await api("GET", "/issues?state=open&per_page=100&page=" + page);
    if (!Array.isArray(issues)) throw new Error("Invalid GitHub issue list");
    for (const issue of issues) {
      if (issue.pull_request) continue;
      if ((issue.body || "").includes(marker)) matches.push(issue);
      else if (issue.title === title) throw new Error("An unmanaged broken-link issue already exists: #" + issue.number);
    }
    if (issues.length < 100) break;
  }
  if (matches.length > 1) throw new Error("Multiple managed broken-link issues; reconcile them manually");
  const existing = matches[0];
  const rows = reconcile(results, existing ? readState(existing.body) : []);
  if (!rows.length) {
    if (existing) {
      await api("POST", "/issues/" + existing.number + "/comments", {
        body: "All tracked broken shortlinks are resolved or no longer require repair. Audit: " + runUrl,
      });
      await api("PATCH", "/issues/" + existing.number, { state: "closed", state_reason: "completed" });
      return "closed";
    }
    return "clear";
  }

  const body = issueBody(rows, runUrl);
  const current = existing && readState(existing.body);
  const assigned = existing && (existing.assignees || []).some(user => user.login.toLowerCase() === assignee.toLowerCase());
  const labeled = existing && (existing.labels || []).some(item => item.name === label);
  if (existing && JSON.stringify(current) === JSON.stringify(rows) && assigned && labeled) return "unchanged";

  if (!labeled) {
    const found = await api("GET", "/labels/" + label, undefined, true);
    if (!found) await api("POST", "/labels", { name: label, color: "d73a4a", description: "Confirmed broken shortlink destinations" });
  }
  if (!existing) {
    await api("POST", "/issues", { title, body, assignees: [assignee], labels: [label] });
    return "created";
  }
  await api("PATCH", "/issues/" + existing.number, {
    body,
    assignees: [...new Set([...(existing.assignees || []).map(user => user.login), assignee])],
    labels: [...new Set([...(existing.labels || []).map(item => item.name), label])],
  });
  return "updated";
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
  console.log("Broken-link issue: " + await synchronize(results, api, runUrl));
}

if (require.main === module) main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = { reconcile, readState, issueBody, synchronize, githubApi };
