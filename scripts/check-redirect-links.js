"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseStandardRedirects, parseLawRedirects } = require("../api/_redirects");

const root = path.resolve(__dirname, "..");
const baseUrl = "https://wooten.link";

function collectTargets() {
  const standard = parseStandardRedirects(fs.readFileSync(path.join(root, "404.html"), "utf8"));
  const law = parseLawRedirects(fs.readFileSync(path.join(root, "var/law.toml"), "utf8"));
  return [
    ...Object.entries(standard).map(([key, destination]) => ({ source: "404.html", key, destination })),
    ...Object.entries(law).map(([key, destination]) => ({ source: "var/law.toml", key, destination })),
  ];
}

function groupTargets(targets) {
  const groups = new Map();
  for (const target of targets) {
    let url;
    try {
      url = new URL(target.destination, baseUrl);
      if (!(["http:", "https:"].includes(url.protocol))) throw new Error("Unsupported URL scheme");
    } catch (_error) {
      throw new Error(`Invalid redirect destination for ${target.source}:${target.key}`);
    }
    const normalized = url.href;
    if (!groups.has(normalized)) groups.set(normalized, []);
    groups.get(normalized).push(target);
  }
  return [...groups].map(([url, references]) => ({ url, references }));
}

async function requestStatus(url, method, fetchImpl, timeoutMs) {
  const response = await fetchImpl(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "JFWooten4-link-checker/1.0", accept: "*/*" },
  });
  try {
    return response.status;
  } finally {
    // Keep large PDFs and other document bodies out of the runner.
    if (response.body) await response.body.cancel().catch(() => {});
  }
}

async function checkUrl(url, fetchImpl = fetch, timeoutMs = 12000) {
  let status;
  let earlierDead = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      status = await requestStatus(url, "GET", fetchImpl, timeoutMs);
      if (status === 405 || status === 501) {
        const headStatus = await requestStatus(url, "HEAD", fetchImpl, timeoutMs);
        return { state: headStatus >= 200 && headStatus < 400 ? "ok" : "inconclusive", status: headStatus };
      }
      if (status >= 200 && status < 400) return { state: "ok", status };
      if (status === 401 || status === 403 || status === 429) return { state: "inconclusive", status };
      if (status !== 404 && status !== 410 && status < 500) return { state: "inconclusive", status };
      if (status === 404 || status === 410) {
        if (earlierDead) return { state: "dead", status };
        earlierDead = true;
      }
      // Retry definitive missing responses and transient server failures.
    } catch (error) {
      if (attempt === 1) return { state: "inconclusive", reason: error.message };
      continue;
    }
    if (attempt === 1) {
      return { state: "inconclusive", status };
    }
  }
  return { state: "inconclusive", status };
}

function escapeSummary(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").replace(/`/g, "'");
}

async function main() {
  const targets = collectTargets();
  const groups = groupTargets(targets);
  const results = new Array(groups.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(6, groups.length) }, async () => {
    while (next < groups.length) {
      const index = next++;
      results[index] = { ...groups[index], ...await checkUrl(groups[index].url) };
    }
  }));

  const dead = results.filter((result) => result.state === "dead");
  const inconclusive = results.filter((result) => result.state === "inconclusive");
  const good = results.length - dead.length - inconclusive.length;
  const lines = [
    "## Redirect destination check",
    "",
    `Checked ${targets.length} mappings (${groups.length} unique destinations).`,
    `- Reachable: ${good}`,
    `- Confirmed 404/410: ${dead.length}`,
    `- Inconclusive (blocked, rate-limited, or temporary failures): ${inconclusive.length}`,
    "",
  ];

  for (const [label, entries] of [["Confirmed broken links", dead], ["Inconclusive checks", inconclusive]]) {
    if (!entries.length) continue;
    lines.push(`### ${label}`, "", "| Source / shortlink | HTTP result | Destination |", "| --- | --- | --- |");
    for (const entry of entries) {
      const refs = entry.references.map((item) => `${item.source}: ${item.key}`).join(", ");
      lines.push(`| ${escapeSummary(refs)} | ${escapeSummary(entry.status ?? entry.reason)} | ${escapeSummary(entry.url)} |`);
      if (entry.state === "dead") {
        console.error(`::error title=Dead redirect::${escapeSummary(refs)} -> ${entry.url} (HTTP ${entry.status})`);
      }
    }
    lines.push("");
  }

  const summary = lines.join("\n") + "\n";
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (dead.length) process.exitCode = 1;
}

if (require.main === module) main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = { checkUrl, collectTargets, groupTargets };
