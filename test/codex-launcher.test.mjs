import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { codexDestination, initLauncher } from "../codex/launcher.mjs";

const id = "019c56c3-06fc-7db3-a928-9c3607e17129";
const root = `https://wooten.link/codex/${id}`;
const native = `codex://threads/${id}`;

test("serves the Codex launcher before the generic redirect", () => {
  const routes = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8")).rewrites;
  assert.deepEqual(routes.slice(0, 2), [
    { source: "/codex", destination: "/codex/index.html" },
    { source: "/codex/:thread", destination: "/codex/index.html" },
  ]);
});

test("opens a Codex thread from its HTTPS route", () => {
  assert.equal(codexDestination(root), native);
  assert.equal(codexDestination(root + "/"), native);
  assert.equal(codexDestination(root + "?url=" + encodeURIComponent(native + "?host=remote")), native + "?host=remote");
});

test("rejects non-Codex destinations, mismatched IDs and malformed parameters", () => {
  for (const url of [
    "https://wooten.link/codex/not-a-thread",
    root + "?url=" + encodeURIComponent("https://example.com"),
    root + "?url=" + encodeURIComponent("codex://threads/11111111-2222-4333-8444-555555555555"),
    root + "?url=" + encodeURIComponent(native + "#fragment"),
    root + "?url=" + encodeURIComponent("codex://user@threads/" + id),
    root + "?url=" + encodeURIComponent(native) + "&url=" + encodeURIComponent(native),
    root + "?other=value",
    root + "#fragment",
    "https://wooten.link/codex/" + id + "/extra",
  ]) assert.equal(codexDestination(url), null, url);
});

test("shows an actionable fallback and launches only validated URLs", () => {
  const elements = Object.fromEntries(["status", "open", "copy", "native", "help"].map(name => [name, {
    textContent: "", hidden: true, href: "", addEventListener() {},
  }]));
  const dom = { getElementById: name => elements[name] };
  const launched = [];
  assert.equal(initLauncher(root, dom, url => launched.push(url)), true);
  assert.deepEqual(launched, [native]);
  assert.equal(elements.open.href, native);
  assert.equal(elements.open.hidden, false);
  assert.equal(elements.native.textContent, native);
  assert.equal(initLauncher(root + "?url=https://example.com", dom, url => launched.push(url)), false);
  assert.deepEqual(launched, [native]);
});
