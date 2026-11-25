// Pure redirect helpers shared by Node and the Jekyll fallback.
function normalizePath(value) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const firstSegment = String(rawValue || "").split("/").filter(Boolean)[0];

  if (!firstSegment) {
    return "";
  }

  try {
    return decodeURIComponent(firstSegment).toLowerCase();
  } catch (_error) {
    return firstSegment.toLowerCase();
  }
}

// The redirect files use quoted, single-line string entries. The optional
// table suffix is a literal prefix, not part of the stored key.
function parseRedirectEntries(source, strict = true) {
  let prefix = null;
  const entries = new Map();

  for (const line of source.split(/\r?\n/)) {
    const section = line.match(/^\s*\[redirects(?:\.("(?:\\.|[^"\\])*"))?\]\s*(?:#.*)?$/);
    if (section) {
      try {
        prefix = section[1] === undefined ? "" : JSON.parse(section[1]);
      } catch (error) {
        if (strict) throw error;
        prefix = null;
      }
      continue;
    }

    if (/^\s*\[/.test(line)) {
      prefix = null;
      continue;
    }

    if (prefix === null || /^\s*(?:#.*)?$/.test(line)) continue;
    const entry = line.match(/^\s*("(?:\\.|[^"\\])*")\s*=\s*("(?:\\.|[^"\\])*")\s*(?:#(.*))?$/);
    if (!entry) {
      if (strict) throw new Error("Invalid redirect entry: " + line);
      continue;
    }

    try {
      const key = (prefix + JSON.parse(entry[1])).toLowerCase();
      const href = JSON.parse(entry[2]);
      if (!href) throw new Error("Empty redirect destination: " + key);
      if (strict && entries.has(key)) throw new Error("Duplicate redirect: " + key);
      entries.set(key, { key, href, comment: (entry[3] || "").trim() });
    } catch (error) {
      if (strict) throw error;
    }
  }

  return [...entries.values()];
}

function parseRedirects(source, strict = true) {
  return Object.fromEntries(parseRedirectEntries(source, strict).map(({ key, href }) => [key, href]));
}

function mergeRedirects(standard, law) {
  return { ...standard, ...law };
}

function resolveRedirect(redirects, value, fallback) {
  const key = normalizePath(value);
  return Object.prototype.hasOwnProperty.call(redirects, key) ? redirects[key] : fallback;
}

if (typeof module !== "undefined") {
  module.exports = { normalizePath, parseRedirects, parseRedirectEntries, mergeRedirects, resolveRedirect };
}
