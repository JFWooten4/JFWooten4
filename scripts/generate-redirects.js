const fs = require("node:fs");
const path = require("node:path");
const { loadRedirectEntries } = require("../api/_redirects");

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
  const includes = path.join(root, "_includes");
  fs.mkdirSync(includes, { recursive: true });
  fs.writeFileSync(path.join(includes, "redirect-lookup.generated.js"), renderLookup(entries));
  fs.writeFileSync(path.join(includes, "redirect-comments.generated.js"), renderComments(entries));
  return entries.length;
}

if (require.main === module) {
  console.log("Generated browser lookup for " + generateRedirects() + " redirects");
}

module.exports = { generateRedirects, renderLookup, renderComments };
