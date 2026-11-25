// Path lookup shared by the API and Jekyll fallback.
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

function resolveRedirect(redirects, value, fallback) {
  const key = normalizePath(value);
  return Object.prototype.hasOwnProperty.call(redirects, key) ? redirects[key] : fallback;
}

if (typeof module !== "undefined") {
  module.exports = { normalizePath, resolveRedirect };
}
