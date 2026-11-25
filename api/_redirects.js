const fs = require("node:fs");
const path = require("node:path");
const { parseRedirects, mergeRedirects } = require("../_includes/redirect-core");

function readProjectFile(relativePath) {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(__dirname, "..", relativePath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf8");
    }
  }

  throw new Error(`Could not read ${relativePath}`);
}

function loadRedirects() {
  return mergeRedirects(
    parseRedirects(readProjectFile(path.join("var", "main.toml"))),
    parseRedirects(readProjectFile(path.join("var", "law.toml"))),
  );
}

module.exports = { loadRedirects };
