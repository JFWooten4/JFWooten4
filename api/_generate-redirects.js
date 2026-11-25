const fs = require("node:fs");
const path = require("node:path");
const { loadRedirectEntries } = require("./_redirects");

// Escape HTML script delimiters and Liquid syntax inside generated string literals.
function safeString(value) {
  return JSON.stringify(value).replace(/[<>{}\u2028\u2029]/g, character =>
    "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0"));
}

function renderObject(name, pairs) {
  const properties = pairs.map(([key, value]) =>
    "  " + (key === "__proto__" ? "[" + safeString(key) + "]" : safeString(key)) + ": " + safeString(value));
  return "const " + name + " = {\n" + properties.join(",\n") + "\n};\n";
}

function renderLookup(entries) {
  return renderObject("redirects", entries.map(({ key, href }) => [key, href]));
}

function renderComments(entries) {
  return renderObject("redirectComments", entries.filter(entry => entry.comment)
    .map(({ key, comment }) => [key, comment]));
}

function generateRedirects(root = path.resolve(__dirname, "..")) {
  const entries = loadRedirectEntries(root);
  const includes = path.join(root, "api");
  fs.mkdirSync(includes, { recursive: true });
  fs.writeFileSync(path.join(includes, "_redirect-lookup.generated.js"), renderLookup(entries));
  fs.writeFileSync(path.join(includes, "_redirect-comments.generated.js"), renderComments(entries));
  return entries.length;
}

function generateStylesheet(root = path.resolve(__dirname, "..")) {
  const source = fs.readFileSync(path.join(root, "api", "_main.scss"), "utf8");
  const assets = path.join(root, "assets");
  fs.mkdirSync(assets, { recursive: true });
  fs.writeFileSync(path.join(assets, "main.scss"), "---\n---\n\n" + source);
}

// Preserve the public launcher URL while keeping its only tracked source in api/.
function generateLauncher(root = path.resolve(__dirname, "..")) {
  const output = path.join(root, "scripts");
  fs.mkdirSync(output, { recursive: true });
  fs.copyFileSync(path.join(root, "api", "_codex-launcher.mjs"), path.join(output, "codex-launcher.mjs"));
}

if (require.main === module) {
  console.log("Generated browser lookup for " + generateRedirects() + " redirects");
  generateStylesheet();
  generateLauncher();
}

module.exports = { generateRedirects, generateStylesheet, generateLauncher, renderLookup, renderComments };
