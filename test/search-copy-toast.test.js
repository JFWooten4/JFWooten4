const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const page = fs.readFileSync(path.join(__dirname, "..", "static/search.html"), "utf8");
const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];

test("search page preserves valid JavaScript and accessible copy feedback", () => {
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(page, /id="copy-toast"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(script, /navigator\.clipboard\.writeText\(item\.href\)/);
  assert.match(script, /if \(document\.execCommand\("copy"\)\)/);
});

test("copy toast shows success or failure, resets its timer, and dismisses", () => {
  const start = script.indexOf("function showCopyToast(");
  const end = script.indexOf("function renderList(", start);
  assert.ok(start >= 0 && end > start);

  const classes = new Set();
  const toast = {
    textContent: "",
    dataset: {},
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
    },
  };
  const scheduled = new Map();
  let nextId = 0;
  const sandbox = {
    copyToastEl: toast,
    copyToastTimer: null,
    clearTimeout(id) { scheduled.delete(id); },
    setTimeout(callback, duration) {
      assert.equal(duration, 2200);
      const id = ++nextId;
      scheduled.set(id, callback);
      return id;
    },
  };

  vm.runInNewContext(script.slice(start, end), sandbox);
  sandbox.showCopyToast("Copied to clipboard", true);
  assert.equal(toast.textContent, "Copied to clipboard");
  assert.equal(toast.dataset.result, "success");
  assert.ok(classes.has("is-visible"));

  sandbox.showCopyToast("Copy failed", false);
  assert.equal(toast.textContent, "Copy failed");
  assert.equal(toast.dataset.result, "error");
  assert.equal(scheduled.size, 1);

  scheduled.values().next().value();
  assert.ok(!classes.has("is-visible"));
});

test("search indexes generated registries without fetching data and preserves topics", () => {
  const { loadRedirectEntries } = require("../site/_redirects");
  const { renderLookup, renderComments } = require("../scripts/generate-redirects");
  const entries = loadRedirectEntries();
  const context = vm.createContext({ URL, fetch() { assert.fail("Unexpected search fetch"); } });
  assert.ok(page.includes("{% include redirect-lookup.generated.js %}"));
  vm.runInContext(renderLookup(entries) + renderComments(entries), context);
  vm.runInContext(script.slice(0, script.indexOf("    function initializeSearch(")), context);
  const results = context.buildEntries();
  const configured = require("../site/_redirects").loadRedirects();
  assert.equal(results.length, Object.keys(configured).length);
  for (const entry of results) assert.equal(entry.href, configured[entry.key], entry.key);
  const tagged = results.find(entry => entry.key === "scf-1");
  assert.ok(tagged.searchText.includes("round 11"));
  assert.equal(results.find(entry => entry.key === "_5").href, configured._5);
  assert.ok(!script.includes("new Function("));
  assert.equal(context.searchEntries(results, "").length, results.length);
  assert.equal(context.searchEntries(results, "_").every(entry =>
    entry.key.includes("_") || entry.href.includes("_")), true);
  assert.ok(context.searchEntries(results, "round 11").some(entry => entry.key === "scf-1"));
  assert.ok(context.searchEntries(results, "_5").some(entry => entry.key === "_5"));
  assert.ok(context.searchEntries(results, "+0").some(entry => entry.key === "+0"));
  assert.equal(context.searchEntries(results, "https://no-match.invalid/").length, 0);
  assert.equal(context.searchEntries(results, "https://github.com/JFWooten4").every(entry =>
    entry.href.toLowerCase().includes("https://github.com/jfwooten4")), true);
});
