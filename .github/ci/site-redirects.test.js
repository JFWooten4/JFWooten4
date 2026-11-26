const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const handler = require("../../api/redirect");
const { loadRedirects } = require("../../api/_redirects");
const root = path.join(__dirname, "..", "..");
const site = path.join(root, "_site");
const registryFiles = fs.readdirSync(path.join(root, "redirects"), { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".toml"))
  .map(entry => "redirects/" + entry.name).sort();

// Use a standards-compliant parser independent of the application's restricted
// parser, so a shared parser bug cannot make all the assertions pass.
function referenceRegistry(file) {
  return JSON.parse(execFileSync("python3", ["-c", [
    "import json, sys, tomllib",
    "with open(sys.argv[1], 'rb') as source:",
    "    data = tomllib.load(source)",
    "result = {}",
    "for section, table in data.items():",
    "    assert section == 'redirects' or (section.isupper() and section.replace('_', '').isalnum()), section",
    "    pairs = []",
    "    for key, value in table.items():",
    "        if isinstance(value, str):",
    "            pairs.append((key, value))",
    "        else:",
    "            assert section == 'redirects', section",
    "            pairs.extend((key + k, v) for k, v in value.items())",
    "    for key, destination in pairs:",
    "        assert isinstance(destination, str) and destination, key",
    "        key = key.lower()",
    "        assert key not in result, key",
    "        result[key] = destination",
    "print(json.dumps(result))",
  ].join("\n"), path.join(root, file)], { encoding: "utf8" }));
}

const expected = Object.fromEntries(registryFiles.flatMap(file => Object.entries(referenceRegistry(file))));
assert.equal(Object.keys(expected).length, registryFiles.reduce((count, file) => count + Object.keys(referenceRegistry(file)).length, 0));

function readSite(file) {
  return fs.readFileSync(path.join(site, file), "utf8");
}

function findScript(html, id) {
  const pattern = id
    ? new RegExp('<script[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/script>')
    : /<script>([\s\S]*?)<\/script>/;
  const match = html.match(pattern);
  assert.ok(match, "Missing rendered script: " + (id || "inline"));
  assert.doesNotMatch(match[1], /{%\s*(?:include|include_relative)\b/);
  return match[1];
}

function request(key, method = "GET", accept = "*/*") {
  const result = { headers: {} };
  const response = {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.status = code; return this; },
    send(body) { result.body = body; },
    redirect(code, destination) { result.status = code; result.destination = destination; },
  };
  handler({ method, headers: { accept }, query: { path: key } }, response);
  return result;
}

function runPdfBridge(body, destination, hash) {
  let actual;
  vm.runInNewContext(findScript(body), {
    document: { getElementById() { return { getAttribute() { return destination; } }; } },
    window: { location: { hash, replace(url) { actual = url; } } },
  });
  return actual;
}

test("Jekyll publishes every TOML registry and the Minima stylesheet", () => {
  for (const file of registryFiles) {
    assert.deepEqual(fs.readFileSync(path.join(site, file)), fs.readFileSync(path.join(root, file)), file);
  }
  assert.deepEqual(loadRedirects(), expected);
  assert.deepEqual(fs.readFileSync(path.join(site, "scripts/codex-launcher.mjs")), fs.readFileSync(path.join(root, "api/_codex-launcher.mjs")));
  assert.match(readSite("codex/index.html"), /src="\/scripts\/codex-launcher\.mjs"/);
  const css = readSite("assets/main.css");
  assert.match(css, /#fdda24/i);
  assert.match(css, /radial-gradient\(/);
  assert.match(css, /#080b12/i);
  assert.doesNotMatch(css, /{%\s*include\b/);
  assert.equal(fs.existsSync(path.join(site, "site")), false);
  assert.equal(fs.existsSync(path.join(site, "api")), false);
});

test("Jekyll publishes the public search index", () => {
  const entries = JSON.parse(readSite("search-index.json"));
  assert.equal(entries.length, Object.keys(expected).length);
  assert.deepEqual(Object.fromEntries(entries.map(({ key, href }) => [key, href])), expected);
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry).sort(), ["comment", "href", "key"]);
    assert.equal(typeof entry.comment, "string");
  }
  assert.equal(entries.find(({ key }) => key === "scf-1").comment, "Round 11");
});

test("every configured shortlink returns its exact HTTP destination", () => {
  for (const [key, destination] of Object.entries(expected)) {
    for (const method of ["GET", "HEAD"]) {
      const result = request(encodeURIComponent(key), method);
      assert.equal(result.status, 307, method + " " + key);
      assert.equal(result.destination, destination, key);
      assert.equal(result.headers["Cache-Control"], "no-store", key);
    }
  }
  for (const key of ["__proto__", "constructor", "%ZZ", "unconfigured-test-path"]) {
    assert.equal(request(key).destination, "https://wooten.link/search", key);
  }
});

test("every configured browser shortlink preserves its destination and PDF shorthand", () => {
  for (const [key, destination] of Object.entries(expected)) {
    const result = request(encodeURIComponent(key), "GET", "text/html,application/xhtml+xml");
    const isPdf = /\.pdf$/i.test(destination.split(/[?#]/, 1)[0]);
    if (!isPdf) {
      assert.equal(result.status, 307, key);
      assert.equal(result.destination, destination, key);
      continue;
    }
    assert.equal(result.status, 200, key);
    assert.equal(result.headers["Content-Type"], "text/html; charset=utf-8", key);
    assert.equal(runPdfBridge(result.body, destination, ""), destination, key);
    assert.equal(runPdfBridge(result.body, destination, "#3"), destination.split("#")[0] + "#page=3", key);
    assert.equal(runPdfBridge(result.body, destination, "#3#4"), destination.includes("#") ? destination : destination + "#3#4", key);
  }
});

test("rendered 404 fallback resolves every configured shortlink", () => {
  const html = readSite("404.html");
  assert.doesNotMatch(html, /parseRedirectEntries|parseRedirects\(|fetch\(/);
  const redirect = new vm.Script(findScript(html));
  function resolve(pathname, hash = "") {
    let actual;
    redirect.runInNewContext({
      window: { location: { pathname, hash, replace(url) { actual = url; } } },
    });
    return actual;
  }
  for (const [key, destination] of Object.entries(expected)) {
    assert.equal(resolve("/" + encodeURIComponent(key)), destination, key);
    if (/\.pdf$/i.test(destination.split(/[?#]/, 1)[0])) {
      assert.equal(resolve("/" + encodeURIComponent(key), "#3"), destination.split("#")[0] + "#page=3", key);
    }
  }
  assert.equal(resolve("/%ZZ"), "/search");
  assert.equal(resolve("/constructor"), "/search");
});

test("rendered search indexes every configured shortlink without registry requests", () => {
  const html = readSite("search/index.html");
  const context = vm.createContext({ URL, fetch() { assert.fail("Unexpected search fetch"); } });
  vm.runInContext(findScript(html, "redirect-registry"), context);
  const script = findScript(html);
  assert.doesNotMatch(script, /parseRedirectEntries|parseRedirects\(|fetch\(/);
  const boundary = script.indexOf("    function initializeSearch(");
  assert.ok(boundary >= 0);
  vm.runInContext(script.slice(0, boundary), context);
  const entries = context.buildEntries();
  assert.equal(entries.length, Object.keys(expected).length);
  assert.deepEqual(Object.fromEntries(entries.map(entry => [entry.key, entry.href])), expected);
  assert.ok(entries.find(entry => entry.key === "scf-1").searchText.includes("round 11"));
  for (const [key, destination] of Object.entries(expected)) {
    assert.ok(context.searchEntries(entries, key.toUpperCase()).some(entry => entry.key === key), key);
    assert.ok(context.searchEntries(entries, destination).some(entry => entry.key === key), destination);
  }
  assert.equal(context.searchEntries(entries, " ").length, entries.length);
  assert.equal(context.searchEntries(entries, "https://no-match.invalid/").length, 0);
  assert.ok(context.searchEntries(entries, "+0").some(entry => entry.key === "+0"));
  assert.ok(context.searchEntries(entries, "round 11").some(entry => entry.key === "scf-1"));
  assert.ok(context.searchEntries(entries, "_").length < entries.length);
  assert.match(script, /renderList\(searchEntries\(entries, queryInput\.value\)\)/);
  assert.match(script, /queryInput\.addEventListener\("input", filterResults\)/);
  assert.match(script, /params\.get\("q"\)/);
});

test("published homepage references existing media and matching credits directly", () => {
  const html = readSite("index.html");
  const images = [];
  for (const type of ["Background", "Banner"]) {
    const imageMatch = html.match(new RegExp("window\\.homepage" + type + "Images\\s*=\\s*(\\[[\\s\\S]*?\\]);"));
    const creditMatch = html.match(new RegExp("window\\.homepage" + type + "Credits\\s*=\\s*(\\{[\\s\\S]*?\\});"));
    assert.ok(imageMatch && creditMatch, type);
    const records = JSON.parse(imageMatch[1]);
    const credits = JSON.parse(creditMatch[1]);
    assert.ok(records.length > 0, type);
    for (const record of records) {
      assert.ok(fs.statSync(path.join(site, record.src.slice(1))).isFile(), record.src);
      assert.equal(path.parse(record.src).name, record.key, record.src);
      assert.ok(Object.hasOwn(credits, record.key), record.key);
      images.push(record.src);
    }
  }
  for (const image of [
    "/backgrounds/power-mountain.jpg",
    "/banners/climbing-phoenix.PNG",
    "/banners/deceivingly-cute.png",
  ]) assert.ok(images.includes(image), image);

  assert.match(html, /prop\.src = "\/backgrounds\/props\/mlp\/smirk\.png"/);
  for (const image of [
    "backgrounds/props/mlp/insignia.png",
    "backgrounds/props/mlp/smirk.png",
    "backgrounds/props/mlp/tsparks.png",
    "backgrounds/props/tf2/artifacts.png",
    "backgrounds/props/tf2/fanning.png",
  ]) assert.ok(fs.statSync(path.join(site, image)).isFile(), image);

  assert.doesNotMatch(html, /["']\/props\/|power-mountian|climbing-pheonix|decievingly-cute|fannign|twiggl/);
  const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  assert.ok(!config.redirects.some(rule => /^\/(?:props|backgrounds|banners)\//.test(rule.source)));
});
