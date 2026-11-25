const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const handler = require("../api/redirect");
const { loadRedirects } = require("../api/_redirects");
const root = path.join(__dirname, "..");
const site = path.join(root, "_site");
const registryFiles = ["var/main.toml", "var/law.toml"];

// Use a standards-compliant parser independent of the application's restricted
// parser, so a shared parser bug cannot make all the assertions pass.
function referenceRegistry(file) {
  return JSON.parse(execFileSync("python3", ["-c", [
    "import json, sys, tomllib",
    "with open(sys.argv[1], 'rb') as source:",
    "    data = tomllib.load(source)['redirects']",
    "result = {}",
    "for prefix, value in data.items():",
    "    pairs = [(prefix, value)] if isinstance(value, str) else [(prefix + k, v) for k, v in value.items()]",
    "    for key, destination in pairs:",
    "        assert isinstance(destination, str) and destination, key",
    "        key = key.lower()",
    "        assert key not in result, key",
    "        result[key] = destination",
    "print(json.dumps(result))",
  ].join("\n"), path.join(root, file)], { encoding: "utf8" }));
}

const expected = Object.assign({}, ...registryFiles.map(referenceRegistry));

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

test("Jekyll publishes both TOML registries without alteration", () => {
  for (const file of registryFiles) {
    assert.deepEqual(fs.readFileSync(path.join(site, file)), fs.readFileSync(path.join(root, file)), file);
  }
  assert.deepEqual(loadRedirects(), expected);
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
  const scripts = new Map([
    ["main-redirects", findScript(html, "main-redirects")],
    ["law-redirects", findScript(html, "law-redirects")],
  ]);
  const redirect = new vm.Script(findScript(html));
  function resolve(pathname, hash = "") {
    let actual;
    redirect.runInNewContext({
      document: { getElementById(id) { return { textContent: scripts.get(id) }; } },
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

test("rendered search indexes every configured shortlink from the published files", async () => {
  const html = readSite("search/index.html");
  const requested = [];
  const context = vm.createContext({
    URL,
    fetch: async (url) => {
      requested.push(url);
      return { ok: true, text: async () => readSite(url.slice(1)) };
    },
  });
  vm.runInContext(findScript(html, "redirect-core"), context);
  const script = findScript(html);
  const boundary = script.indexOf("    loadRedirects().then(");
  assert.ok(boundary >= 0);
  vm.runInContext(script.slice(0, boundary), context);
  const entries = await context.loadRedirects();
  assert.deepEqual(requested.sort(), registryFiles.map(file => "/" + file).sort());
  assert.equal(entries.length, Object.keys(expected).length);
  assert.deepEqual(Object.fromEntries(entries.map(entry => [entry.key, entry.href])), expected);
  assert.ok(entries.find(entry => entry.key === "scf-1").searchText.includes("round 11"));
});
