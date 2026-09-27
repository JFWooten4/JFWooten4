const { loadRedirects } = require("./_redirects");

const redirects = loadRedirects();
const SEARCH_URL = "https://wooten.link/search";

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

function handler(request, response) {
  const key = normalizePath(request.query.path);
  const destination = redirects[key] || SEARCH_URL;

  response.setHeader("Cache-Control", "no-store");
  return response.redirect(307, destination);
}

module.exports = handler;
module.exports.normalizePath = normalizePath;
