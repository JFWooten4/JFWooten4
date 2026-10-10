const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const handler = require("../api/redirect");
const {
  loadRedirects,
  parseLawRedirects,
  parseStandardRedirects,
} = require("../api/_redirects");

test("parses literal and constant redirects from the existing 404 map", () => {
  const source = `
    const LATEST = "https://example.com/latest";
    window.LINKS = {
      "literal": "https://example.com/literal",
      "constant": LATEST
    };
  `;

  assert.deepEqual(parseStandardRedirects(source), {
    literal: "https://example.com/literal",
    constant: "https://example.com/latest",
  });
});

test("parses law redirects with their punctuation prefixes", () => {
  const source = `
    [redirects."_"]
    "15" = "https://www.law.cornell.edu/uscode/text/15"
    [redirects."+"]
    "17" = "https://www.ecfr.gov/current/title-17"
  `;

  assert.deepEqual(parseLawRedirects(source), {
    "_15": "https://www.law.cornell.edu/uscode/text/15",
    "+17": "https://www.ecfr.gov/current/title-17",
  });
});

test("loads every current redirect directly from the 404 sources", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "404.html"), "utf8");
  const linksBlock = html.match(/window\.LINKS\s*=\s*\{([\s\S]*?)\n\s*\};/);
  const configuredKeys = [...linksBlock[1].matchAll(/^\s*"([^"]+)"\s*:/gm)].map((match) => match[1]);
  const standardRedirects = parseStandardRedirects(html);
  const redirects = loadRedirects();

  assert.equal(Object.keys(standardRedirects).length, configuredKeys.length);
  assert.equal(
    redirects.tar1,
    "https://www.sec.gov/comments/sr-occ-2025-801/srocc2025801-598095-1737722.pdf"
  );
  assert.equal(Object.keys(redirects).length, configuredKeys.length + 2);
});

test("normalizes the first path segment like the browser redirect", () => {
  assert.equal(handler.normalizePath("TAR1/more"), "tar1");
  assert.equal(handler.normalizePath("%2B17"), "+17");
  assert.equal(handler.normalizePath(["Latest", "ignored"]), "latest");
});

test("returns an uncached temporary redirect for a configured shortlink", () => {
  const result = {};
  const response = {
    setHeader(name, value) {
      result.headers = { ...result.headers, [name]: value };
    },
    redirect(status, destination) {
      result.status = status;
      result.destination = destination;
      return result;
    },
  };

  handler({ query: { path: "tar1" } }, response);

  assert.deepEqual(result, {
    headers: { "Cache-Control": "no-store" },
    status: 307,
    destination: "https://www.sec.gov/comments/sr-occ-2025-801/srocc2025801-598095-1737722.pdf",
  });
});

test("sends unknown paths to search without exposing an open redirect", () => {
  const result = {};
  const response = {
    setHeader() {},
    redirect(status, destination) {
      result.status = status;
      result.destination = destination;
    },
  };

  handler({ query: { path: "https://malicious.example" } }, response);

  assert.deepEqual(result, {
    status: 307,
    destination: "https://wooten.link/search",
  });
});
