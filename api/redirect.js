const { loadRedirects } = require("./_redirects");
const { normalizePath, resolveRedirect } = require("../_includes/redirect-core");
const { isPdfDestination, pdfPageDestination, navigateToDestination } = require("./_pdf-pages");

const redirects = loadRedirects();
const SEARCH_URL = "https://wooten.link/search";

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
    ${navigateToDestination.toString()}
    const destination = document.getElementById("destination").getAttribute("href");
    navigateToDestination(destination, window.location);
  </script>
</body>
</html>`;
}

function handler(request, response) {
  const destination = resolveRedirect(redirects, request.query.path, SEARCH_URL);

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
