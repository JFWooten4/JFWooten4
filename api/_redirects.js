const fs = require("node:fs");
const path = require("node:path");

function parseStandardRedirects(source) {
  const constants = {};
  const constantPattern = /const\s+([A-Z0-9_]+)\s*=\s*("(?:\\.|[^"\\])*");/g;
  let match;

  while ((match = constantPattern.exec(source))) {
    constants[match[1]] = JSON.parse(match[2]);
  }

  const linksBlock = source.match(/window\.LINKS\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (!linksBlock) {
    throw new Error("Could not find window.LINKS in 404.html");
  }

  const redirects = {};
  const entryPattern = /^\s*("(?:\\.|[^"\\])*")\s*:\s*("(?:\\.|[^"\\])*"|[A-Z][A-Z0-9_]*)\s*,?\s*(?:\/\/.*)?$/gm;

  while ((match = entryPattern.exec(linksBlock[1]))) {
    const key = JSON.parse(match[1]).toLowerCase();
    const rawValue = match[2];
    const destination = rawValue.startsWith('"') ? JSON.parse(rawValue) : constants[rawValue];

    if (!destination) {
      throw new Error(`Unknown redirect constant ${rawValue} for ${key}`);
    }

    redirects[key] = destination;
  }

  return redirects;
}

function parseLawRedirects(source) {
  let delimiter = null;

  return source.split(/\r?\n/).reduce((redirects, line) => {
    const section = line.match(/^\s*\[redirects\.("(?:\\.|[^"\\])*")\]\s*(?:#.*)?$/);

    if (section) {
      try {
        delimiter = JSON.parse(section[1]);
      } catch (_error) {
        delimiter = null;
      }

      return redirects;
    }

    if (/^\s*\[/.test(line)) {
      delimiter = null;
      return redirects;
    }

    if (delimiter !== null) {
      const entry = line.match(/^\s*("(?:\\.|[^"\\])*")\s*=\s*("(?:\\.|[^"\\])*")\s*(?:#.*)?$/);

      if (entry) {
        redirects[(delimiter + JSON.parse(entry[1])).toLowerCase()] = JSON.parse(entry[2]);
      }
    }

    return redirects;
  }, {});
}

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
  return {
    ...parseStandardRedirects(readProjectFile("404.html")),
    ...parseLawRedirects(readProjectFile(path.join("var", "law.toml"))),
  };
}

module.exports = {
  loadRedirects,
  parseLawRedirects,
  parseStandardRedirects,
};
