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

function parseLawRedirects(source, strict = true) {
  let delimiter = null;

  return source.split(/\r?\n/).reduce((redirects, line) => {
    const section = line.match(/^\s*\[redirects\.("(?:\\.|[^"\\])*")\]\s*(?:#.*)?$/);

    if (section) {
      try {
        delimiter = JSON.parse(section[1]);
      } catch (_error) {
        delimiter = null;
      }

      return redirects;
    }

    if (/^\s*\[/.test(line)) {
      delimiter = null;
      return redirects;
    }

    if (delimiter !== null) {
      const entry = line.match(/^\s*("(?:\\.|[^"\\])*")\s*=\s*("(?:\\.|[^"\\])*")\s*(?:#.*)?$/);

      if (entry) {
        try {
          redirects[(delimiter + JSON.parse(entry[1])).toLowerCase()] = JSON.parse(entry[2]);
        } catch (error) {
          if (strict) {
            throw error;
          }
        }
      }
    }

    return redirects;
  }, {});
}

function mergeRedirects(standard, law) {
  return { ...standard, ...law };
}

function resolveRedirect(redirects, value, fallback) {
  const key = normalizePath(value);
  return Object.prototype.hasOwnProperty.call(redirects, key) ? redirects[key] : fallback;
}

if (typeof module !== "undefined") {
  module.exports = { normalizePath, parseLawRedirects, mergeRedirects, resolveRedirect };
}
