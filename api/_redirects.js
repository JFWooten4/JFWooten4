const fs = require("node:fs");
const path = require("node:path");

const projectRoot = fs.existsSync(path.join(__dirname, "..", "redirects"))
  ? path.resolve(__dirname, "..")
  : process.cwd();

// The redirect files use quoted, single-line string entries. The optional
// table suffix is a literal prefix, not part of the stored key.
// Uppercase named tables group priority links without prefixing their keys.
function parseRedirectEntries(source) {
  let prefix = null;
  const entries = new Map();

  for (const line of source.split(/\r?\n/)) {
    const section = line.match(/^\s*\[redirects(?:\.("(?:\\.|[^"\\])*"))?\]\s*(?:#.*)?$/);
    if (section) {
      prefix = section[1] === undefined ? "" : JSON.parse(section[1]);
      continue;
    }

    if (/^\s*\[[A-Z][A-Z0-9_]*\]\s*(?:#.*)?$/.test(line)) {
      prefix = "";
      continue;
    }

    if (/^\s*\[/.test(line)) {
      throw new Error("Unsupported redirect table: " + line);
    }

    if (prefix === null || /^\s*(?:#.*)?$/.test(line)) continue;
    const entry = line.match(/^\s*("(?:\\.|[^"\\])*")\s*=\s*("(?:\\.|[^"\\])*")\s*(?:#(.*))?$/);
    if (!entry) {
      throw new Error("Invalid redirect entry: " + line);
    }

    const key = (prefix + JSON.parse(entry[1])).toLowerCase();
    const href = JSON.parse(entry[2]);
    if (!href) throw new Error("Empty redirect destination: " + key);
    if (entries.has(key)) throw new Error("Duplicate redirect: " + key);
    entries.set(key, { key, href, comment: (entry[3] || "").trim() });
  }

  return [...entries.values()];
}

function parseRedirects(source) {
  return Object.fromEntries(parseRedirectEntries(source).map(({ key, href }) => [key, href]));
}

function discoverRedirectFiles(root = projectRoot) {
  const files = fs.readdirSync(path.join(root, "redirects"), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".toml"))
    .map(entry => "redirects/" + entry.name)
    .sort();
  if (!files.length) throw new Error("No TOML redirect registries found");
  return files;
}

function loadRedirectEntries(root = projectRoot) {
  const entries = new Map();
  for (const source of discoverRedirectFiles(root)) {
    let parsed;
    try {
      parsed = parseRedirectEntries(fs.readFileSync(path.join(root, source), "utf8"));
      if (!parsed.length) throw new Error("No redirect entries");
    } catch (error) {
      throw new Error(source + ": " + error.message);
    }
    for (const entry of parsed) {
      if (entries.has(entry.key)) {
        throw new Error("Duplicate redirect " + entry.key + " in " + entries.get(entry.key).source + " and " + source);
      }
      entries.set(entry.key, { ...entry, source });
    }
  }
  return [...entries.values()];
}

function loadRedirects(root = projectRoot) {
  return Object.fromEntries(loadRedirectEntries(root).map(({ key, href }) => [key, href]));
}

module.exports = { discoverRedirectFiles, loadRedirectEntries, loadRedirects, parseRedirects, parseRedirectEntries };
