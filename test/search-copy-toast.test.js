const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const page = fs.readFileSync(path.join(__dirname, "..", "static/search.html"), "utf8");
const script = page.match(/<script>([\\s\\S]*?)<\\/script>/)[1];

test("search page preserves valid JavaScript and accessible copy feedback", () => {
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(page, /id="copy-toast"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(script, /navigator\\.clipboard\\.writeText\\(item\\.href\\)/);
  assert.match(script, /if \\(document\\.execCommand\\("copy"\\)\\)/);
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
