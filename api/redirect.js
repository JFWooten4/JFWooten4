const { loadRedirects } = require("./_redirects");
const { isPdfDestination, pdfPageDestination } = require("./_pdf-pages");

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

function renderPdfRedirect(destination) {
  const escaped = destination.replace(/[&"<>]/g, (character) => ({
    "&": "&amp;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;",
  })[character]);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, follow">
  <title>Opening PDF</title>
  <noscript><meta http-equiv="refresh" content="0;url=${escaped}"></noscript>
</head>
<body>
  <a id="destination" href="${escaped}">Open PDF</a>
  <script>
    ${isPdfDestination.toString()}
    ${pdfPageDestination.toString()}
    const destination = document.getElementById("destination").getAttribute("href");
    window.location.replace(pdfPageDestination(destination, window.location.hash));
  </script>
</body>
</html>`;
}

function handler(request, response) {
  const key = normalizePath(request.query.path);
  const destination = redirects[key] || SEARCH_URL;

  response.setHeader("Cache-Control", "no-store");
  // Fragments never reach the server; let HTML navigations translate PDF pages.
  if (isPdfDestination(destination)) {
    response.setHeader("Vary", "Accept");
    if (request.method === "GET" && /(?:^|,)\s*text\/html(?:\s*;|\s*,|\s*$)/i.test(request.headers?.accept || "")) {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      return response.status(200).send(renderPdfRedirect(destination));
    }
  }

  return response.redirect(307, destination);
}

module.exports = handler;
module.exports.normalizePath = normalizePath;
