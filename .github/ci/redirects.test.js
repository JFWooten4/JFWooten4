const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const handler = require("../../api/redirect");
const vm = require("node:vm");
const { normalizePath, resolveRedirect } = require("../../api/_redirect-core");
const { isPdfDestination, pdfPageDestination } = require("../../api/_pdf-pages");
const { loadRedirects, loadRedirectEntries, discoverRedirectFiles, parseRedirects, parseRedirectEntries } = require("../../api/_redirects");
const { generateRedirects, generateStylesheet, generateLauncher, renderLookup, renderComments } = require("../../api/_generate-redirects");
const os = require("node:os");

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

test("named priority tables preserve unprefixed shortlinks", () => {
  const source = '[CHIEF_AMBITION]\n"bottleneck" = "/project"\n[LATEST_COMMENT]\n"latest" = "/comment.pdf"';
  assert.deepEqual(parseRedirects(source), { bottleneck: "/project", latest: "/comment.pdf" });
  assert.throws(() => parseRedirects(source + '\n[OTHER_PRIORITY]\n"BOTTLENECK" = "/other"'), /Duplicate redirect/);
  assert.throws(() => parseRedirects('[unknown]\n"link" = "/wrong"'), /Unsupported redirect table/);
});

test("loads every discovered redirect registry", () => {
  const root = path.join(__dirname, "..", "..");
  const files = discoverRedirectFiles(root);
  const redirects = loadRedirects();
  assert.deepEqual(redirects, Object.assign({}, ...files.map(file =>
    parseRedirects(fs.readFileSync(path.join(root, file), "utf8")))));
  assert.equal(redirects.tar1, "https://www.sec.gov/comments/sr-occ-2025-801/srocc2025801-598095-1737722.pdf");
  assert.equal(redirects._3, "https://www.issuers.info/1846058/PNL/2025-12-31_Annual.pdf");
  assert.equal(redirects._5, redirects._3);
  assert.equal(redirects.book, "/book.pdf");
  const priority = loadRedirectEntries(root).filter(entry => entry.source === "redirects/priority.toml");
  assert.ok(priority.some(entry => entry.key === "bottleneck"));
  assert.ok(priority.some(entry => entry.key === "latest"));
  assert.equal(redirects.latest, priority.find(entry => entry.key === "latest").href);
  assert.equal(redirects.bottleneck, priority.find(entry => entry.key === "bottleneck").href);
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
  const html = fs.readFileSync(path.join(__dirname, "..", "..", "404.html"), "utf8");
  assert.ok(html.includes("{% include _pdf-pages.js %}"));
  assert.ok(html.includes("{% include _redirect-core.js %}"));
  assert.ok(html.includes("navigateToDestination(destination, window.location);"));
});

test("shared resolution rejects inherited properties", () => {
  const redirects = { known: "/known" };
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

test("registry discovery includes added files, rejects duplicates, and regenerates removed links", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "redirect-registry-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, "redirects");
  fs.mkdirSync(dir);
  const put = (name, contents) => fs.writeFileSync(path.join(dir, name), contents);
  put("main.toml", '[redirects]\n"one" = "/one"');
  put("notes.txt", "ignored");
  assert.equal(generateRedirects(root), 1);
  put("new.toml", '[redirects."+"]\n"42" = "/two" # new topic');
  assert.deepEqual(discoverRedirectFiles(root), ["redirects/main.toml", "redirects/new.toml"]);
  assert.equal(generateRedirects(root), 2);
  assert.deepEqual(loadRedirects(root), { one: "/one", "+42": "/two" });
  const generated = fs.readFileSync(path.join(root, "api/_redirect-lookup.generated.js"), "utf8");
  assert.equal(vm.runInNewContext(generated + '\nredirects["+42"]'), "/two");
  assert.equal(generateRedirects(root), 2);
  assert.equal(fs.readFileSync(path.join(root, "api/_redirect-lookup.generated.js"), "utf8"), generated);
  put("duplicate.toml", '[redirects]\n"ONE" = "/other"');
  assert.throws(() => loadRedirects(root), /Duplicate redirect one.*duplicate\.toml.*main\.toml/);
  fs.unlinkSync(path.join(dir, "duplicate.toml"));
  fs.unlinkSync(path.join(dir, "new.toml"));
  assert.equal(generateRedirects(root), 1);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "api/_redirect-lookup.generated.js"), "utf8"), /\+42/);
});

test("stylesheet preparation preserves source and produces the conventional Jekyll entry", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "site-stylesheet-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "api"));
  const source = '$brand-color: #fdda24;\n@import "minima";\n';
  fs.writeFileSync(path.join(root, "api", "_main.scss"), source);
  generateStylesheet(root);
  assert.equal(fs.readFileSync(path.join(root, "assets/main.scss"), "utf8"), "---\n---\n\n" + source);
  assert.equal(fs.readFileSync(path.join(root, "api/_main.scss"), "utf8"), source);
});

test("launcher preparation preserves the public asset byte for byte", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "site-launcher-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "api"));
  const source = 'export const launcher = true;\n';
  fs.writeFileSync(path.join(root, "api", "_codex-launcher.mjs"), source);
  generateLauncher(root);
  assert.equal(fs.readFileSync(path.join(root, "scripts/codex-launcher.mjs"), "utf8"), source);
});

test("generated literals preserve values without permitting script or Liquid injection", () => {
  const entries = [{ key: "__proto__", href: "/</script>{{ unsafe }}", comment: "{% unsafe %}" }];
  const code = renderLookup(entries) + renderComments(entries);
  assert.doesNotMatch(code, /<\/script|{{|{%/);
  assert.equal(vm.runInNewContext(code + '\nredirects["__proto__"]'), entries[0].href);
  assert.equal(vm.runInNewContext(code + '\nredirectComments["__proto__"]'), entries[0].comment);
});

test("executes actual Jekyll fallback scripts with the shared helpers", () => {
  const root = path.join(__dirname, "..", "..");
  const html = fs.readFileSync(path.join(root, "404.html"), "utf8");
  const rendered = html.replace(/{% include (_pdf-pages\.js) %}/g, (_, file) =>
    fs.readFileSync(path.join(root, "api", file), "utf8")
  );

  const redirectScript = rendered.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace("{% include _redirect-core.js %}", fs.readFileSync(path.join(root, "api/_redirect-core.js"), "utf8"))
    .replace("{% include _redirect-lookup.generated.js %}", renderLookup(loadRedirectEntries()));
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
      window: { location: { pathname, hash, replace(value) { actual = value; } } },
    });
    vm.runInContext(redirectScript, context);
    assert.equal(actual, expected, pathname);
  }
});
