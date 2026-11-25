const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const handler = require("../api/redirect");
const vm = require("node:vm");
const { normalizePath, resolveRedirect, mergeRedirects, parseRedirects, parseRedirectEntries } = require("../_includes/redirect-core");
const { isPdfDestination, pdfPageDestination } = require("../api/_pdf-pages");
const { loadRedirects } = require("../api/_redirects");

test("parses ordinary redirects and preserves inline search comments", () => {
  const source = '[redirects]\n"One" = "https://example.com/file.pdf#page=3" # filing notes\n"two" = "/book.pdf"';
  assert.deepEqual(parseRedirects(source), { one: "https://example.com/file.pdf#page=3", two: "/book.pdf" });
  assert.deepEqual(parseRedirectEntries(source)[0], {
    key: "one", href: "https://example.com/file.pdf#page=3", comment: "filing notes",
  });
  assert.throws(() => parseRedirects('[redirects]\n"one" = ""'));
  assert.throws(() => parseRedirects('[redirects]\n"one" = "/a"\n"ONE" = "/b"'));
});

test("parses law redirects with their punctuation prefixes", () => {
  const source = `
    [redirects."_"]
    "15" = "https://www.law.cornell.edu/uscode/text/15"
    [redirects."+"]
    "17" = "https://www.ecfr.gov/current/title-17"
  `;

  assert.deepEqual(parseRedirects(source), {
    "_15": "https://www.law.cornell.edu/uscode/text/15",
    "+17": "https://www.ecfr.gov/current/title-17",
  });
});

test("loads every configured redirect from both TOML maps", () => {
  const main = parseRedirects(fs.readFileSync(path.join(__dirname, "..", "var/main.toml"), "utf8"));
  const law = parseRedirects(fs.readFileSync(path.join(__dirname, "..", "var/law.toml"), "utf8"));
  const redirects = loadRedirects();
  assert.deepEqual(redirects, { ...main, ...law });
  assert.ok(Object.keys(main).length > 0);
  assert.ok(Object.keys(law).length > 0);
  assert.equal(redirects.tar1, "https://www.sec.gov/comments/sr-occ-2025-801/srocc2025801-598095-1737722.pdf");
  assert.equal(redirects._3, "https://www.issuers.info/1846058/PNL/2025-12-31_Annual.pdf");
  assert.equal(redirects._5, redirects._3);
  assert.equal(redirects.book, "/book.pdf");
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
  assert.ok(html.includes("{% include redirect-core.js %}"));
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
  assert.throws(() => parseRedirects(source));
  assert.deepEqual(parseRedirects(source, false), { _5: "https://example.com/a.pdf" });
});

test("executes actual Jekyll fallback scripts with the shared helpers", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "404.html"), "utf8");
  const main = fs.readFileSync(path.join(root, "var/main.toml"), "utf8");
  const law = fs.readFileSync(path.join(root, "var/law.toml"), "utf8");
  const rendered = html.replace(/{% include_relative (api\/[^ ]+) %}/g, (_, file) =>
    fs.readFileSync(path.join(root, file), "utf8")
  );

  const redirectScript = rendered.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace("{% include redirect-core.js %}", fs.readFileSync(path.join(root, "_includes/redirect-core.js"), "utf8"));
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
      document: { getElementById(id) { return { textContent: id === "main-redirects" ? main : law }; } },
      window: { location: { pathname, hash, replace(value) { actual = value; } } },
    });
    vm.runInContext(redirectScript, context);
    assert.equal(actual, expected, pathname);
  }
});
