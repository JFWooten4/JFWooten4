const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const handler = require("../api/redirect");
const vm = require("node:vm");
const { normalizePath, resolveRedirect, mergeRedirects } = require("../api/_redirect-core");
const { isPdfDestination, pdfPageDestination } = require("../api/_pdf-pages");
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
  const lawRedirects = parseLawRedirects(fs.readFileSync(path.join(__dirname, "..", "var/law.toml"), "utf8"));
  assert.equal(Object.keys(redirects).length, configuredKeys.length + Object.keys(lawRedirects).length);
  assert.equal(redirects._3, "https://www.issuers.info/1846058/PNL/2025-12-31_Annual.pdf");
});

test("normalizes the first path segment like the browser redirect", () => {
  assert.equal(handler.normalizePath, normalizePath);
  assert.equal(handler.normalizePath("TAR1/more"), "tar1");
  assert.equal(normalizePath("/%ZZ"), "%zz");
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
    headers: { "Cache-Control": "no-store", Vary: "Accept" },
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

test("translates positive PDF page shorthand without losing the query", () => {
  assert.equal(pdfPageDestination("https://example.com/report.PDF?download=1", "#3"), "https://example.com/report.PDF?download=1#page=3");
  assert.equal(pdfPageDestination("/book.pdf#page=20", "#003"), "/book.pdf#page=3");
  assert.equal(pdfPageDestination("/book.pdf#page=20", ""), "/book.pdf#page=20");
  assert.equal(pdfPageDestination("/book.pdf", "#page=7"), "/book.pdf#page=7");
  assert.equal(pdfPageDestination("/book.pdf", "#0"), "/book.pdf#0");
  assert.equal(pdfPageDestination("/book.pdf", "#-3"), "/book.pdf#-3");
  assert.equal(pdfPageDestination("/book.pdf", "#3.5"), "/book.pdf#3.5");
  assert.equal(pdfPageDestination("https://example.com/?file=report.pdf", "#3"), "https://example.com/?file=report.pdf");
  assert.equal(isPdfDestination("/book.pdf#page=2"), true);
});

test("browser PDF navigation runs the page redirect for _5", () => {
  const headers = {};
  let body;
  const response = {
    setHeader(name, value) { headers[name] = value; },
    status(code) { assert.equal(code, 200); return this; },
    send(html) { body = html; },
    redirect() { assert.fail("Browser must receive the PDF page bridge"); },
  };
  handler({ method: "GET", headers: { accept: "text/html,application/xhtml+xml" }, query: { path: "_5" } }, response);
  assert.equal(headers["Content-Type"], "text/html; charset=utf-8");
  assert.equal(headers["Cache-Control"], "no-store");
  assert.equal(headers.Vary, "Accept");
  const destination = loadRedirects()._5;
  assert.ok(isPdfDestination(destination));
  assert.ok(body.includes('href="' + destination + '"'));
  const script = body.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const [hash, expected] of [["#3", destination + "#page=3"], ["", destination], ["#page=4", destination + "#page=4"]]) {
    let actual;
    vm.runInNewContext(script, {
      document: { getElementById() { return { getAttribute() { return destination; } }; } },
      window: { location: { hash, replace(value) { actual = value; } } },
    });
    assert.equal(actual, expected);
  }
});

test("non-PDF browser navigation retains the HTTP redirect", () => {
  handler({ method: "GET", headers: { accept: "text/html" }, query: { path: "github" } }, {
    setHeader() {},
    redirect(status, destination) {
      assert.equal(status, 307);
      assert.equal(destination, "https://github.com/JFWooten4");
    },
  });
});

test("Jekyll fallback shares the PDF fragment transformation", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "404.html"), "utf8");
  assert.ok(html.includes("{% include_relative api/_pdf-pages.js %}"));
  assert.ok(html.includes("{% include_relative api/_redirect-core.js %}"));
  assert.ok(html.includes("navigateToDestination(destination, window.location);"));
});

test("shared resolution rejects inherited properties and retains law precedence", () => {
  const redirects = mergeRedirects({ same: "/first", known: "/known" }, { same: "/second" });
  assert.equal(resolveRedirect(redirects, "/SAME", "/search"), "/second");
  assert.equal(resolveRedirect(redirects, "constructor", "/search"), "/search");
  assert.equal(resolveRedirect(redirects, "__proto__", "/search"), "/search");
  assert.equal(resolveRedirect(redirects, "/%ZZ", "/search"), "/search");
  assert.equal(resolveRedirect(redirects, "known", "/search"), "/known");
  handler({ query: { path: "constructor" } }, {
    setHeader() {},
    redirect(status, destination) {
      assert.equal(status, 307);
      assert.equal(destination, "https://wooten.link/search");
    },
  });
});

test("browser fallback can skip a malformed law entry without losing other entries", () => {
  const source = '[redirects."_"]\n"bad" = "\\q"\n"5" = "https://example.com/a.pdf"';
  assert.throws(() => parseLawRedirects(source));
  assert.deepEqual(parseLawRedirects(source, false), { _5: "https://example.com/a.pdf" });
});

test("executes actual Jekyll fallback scripts with the shared helpers", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "404.html"), "utf8");
  const toml = fs.readFileSync(path.join(root, "var/law.toml"), "utf8");
  const rendered = html.replace(/{% include_relative (api\/[^ ]+) %}/g, (_, file) =>
    fs.readFileSync(path.join(root, file), "utf8")
  );
  const mapScript = rendered.match(/<script id="all-redirects">([\s\S]*?)<\/script>/)[1];
  const redirectScript = rendered.match(/<script>([\s\S]*?)<\/script>/)[1];
  const redirects = loadRedirects();
  for (const [pathname, hash, expected] of [
    ["/_5", "#3", redirects._5 + "#page=3"],
    ["/TAR1/extra", "", redirects.tar1],
    ["/%2B0", "", redirects["+0"]],
    ["/github", "#3", redirects.github],
    ["/%ZZ", "", "/search"],
    ["/constructor", "", "/search"],
    ["/__proto__", "", "/search"],
    ["/", "", "/search"],
  ]) {
    let actual;
    const context = vm.createContext({
      document: { getElementById() { return { textContent: toml }; } },
      window: { location: { pathname, hash, replace(value) { actual = value; } } },
    });
    vm.runInContext(mapScript, context);
    vm.runInContext(redirectScript, context);
    assert.equal(actual, expected, pathname);
  }
});
