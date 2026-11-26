import { createHash } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile, open, stat } from "node:fs/promises";
import { dirname, join, resolve, relative, sep } from "node:path";

const root = process.cwd();
const partsRoot = resolve(root, "_pdf-parts");
const chunkSize = 25 * 1024 * 1024;
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const partName = index => "part-" + String(index).padStart(6, "0");

function pdfPath(value) {
  if (typeof value !== "string" || !value.startsWith("static/") || !value.endsWith(".pdf") || value.includes("\\") || value.split("/").some(part => !part || part === "." || part === "..")) {
    throw new Error("Expected a site-relative static PDF path: " + value);
  }
  return value;
}

async function exists(path) {
  return stat(path).then(() => true, error => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

// Reconstructed PDFs are created after Jekyll's static alias hook.
async function publishPdf(temporary, outputRoot, target) {
  const output = join(outputRoot, target);
  const alias = join(outputRoot, target.slice("static/".length));
  const aliasTemporary = alias + ".tmp-" + process.pid;
  await mkdir(dirname(alias), { recursive: true });
  if (await exists(alias) && !(await exists(output))) throw new Error("Static publishing collision: " + alias);
  await copyFile(temporary, aliasTemporary, constants.COPYFILE_EXCL);
  try {
    await rename(temporary, output);
    await rename(aliasTemporary, alias);
  } finally {
    await rm(aliasTemporary, { force: true });
  }
}

async function split(source, target) {
  const destination = join(partsRoot, pdfPath(target));
  const temporary = destination + ".tmp-" + process.pid;
  await mkdir(dirname(destination), { recursive: true });
  if (await exists(destination)) throw new Error("Chunk directory already exists: " + destination);
  const input = await open(source, "r");
  const wholeHash = createHash("sha256");
  const parts = [];
  let size = 0;
  try {
    await mkdir(temporary);
    const buffer = Buffer.alloc(chunkSize);
    while (true) {
      let length = 0;
      while (length < buffer.length) {
        const { bytesRead } = await input.read(buffer, length, buffer.length - length, null);
        if (!bytesRead) break;
        length += bytesRead;
      }
      if (!length) break;
      const bytes = buffer.subarray(0, length);
      if (!parts.length && !bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Input is not a PDF");
      const name = partName(parts.length);
      await writeFile(join(temporary, name), bytes, { flag: "wx" });
      parts.push({ name, size: length, sha256: hash(bytes) });
      wholeHash.update(bytes);
      size += length;
    }
    if (!parts.length) throw new Error("Empty PDF");
    await writeFile(join(temporary, "manifest.json"), JSON.stringify({ size, sha256: wholeHash.digest("hex"), parts }, null, 2) + "\n");
    await rename(temporary, destination);
    console.log("Split " + target + " into " + parts.length + " verified chunks");
  } finally {
    await input.close();
    await rm(temporary, { recursive: true, force: true });
  }
}

async function assemble(directory, outputRoot) {
  const target = pdfPath(relative(partsRoot, directory).split(sep).join("/"));
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  if (!Array.isArray(manifest.parts) || !manifest.parts.length) throw new Error("Empty manifest: " + target);
  const output = join(outputRoot, target);
  const temporary = output + ".tmp-" + process.pid;
  await mkdir(dirname(output), { recursive: true });
  const file = await open(temporary, "wx");
  const wholeHash = createHash("sha256");
  let size = 0;
  try {
    const expected = new Set(["manifest.json", ...manifest.parts.map((_, index) => partName(index))]);
    const entries = await readdir(directory, { withFileTypes: true });
    if (entries.length !== expected.size || entries.some(entry => !entry.isFile() || !expected.has(entry.name))) throw new Error("Unexpected or missing chunks: " + target);
    for (const [index, part] of manifest.parts.entries()) {
      if (part.name !== partName(index) || !Number.isSafeInteger(part.size) || part.size <= 0 || part.size > chunkSize) throw new Error("Invalid chunk manifest: " + target);
      const bytes = await readFile(join(directory, part.name));
      if (bytes.length !== part.size || hash(bytes) !== part.sha256) throw new Error("Chunk checksum mismatch: " + target + "/" + part.name);
      if (!index && !bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Invalid PDF header: " + target);
      await file.writeFile(bytes);
      wholeHash.update(bytes);
      size += bytes.length;
    }
    if (size !== manifest.size || wholeHash.digest("hex") !== manifest.sha256) throw new Error("PDF checksum mismatch: " + target);
    await file.close();
    await publishPdf(temporary, outputRoot, target);
    console.log("Assembled " + target + " (" + size + " bytes)");
  } finally {
    await file.close();
    await rm(temporary, { force: true });
  }
}

async function walk(directory, outputRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  if (entries.some(entry => entry.name === "manifest.json")) return assemble(directory, outputRoot);
  for (const entry of entries) {
    if (!entry.isDirectory()) throw new Error("Unexpected file in chunk storage: " + join(directory, entry.name));
    await walk(join(directory, entry.name), outputRoot);
  }
  if (!entries.length) throw new Error("Empty chunk directory: " + directory);
}


function run(command, args, capture = false) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + " failed (exit " + result.status + ")");
  return result.stdout;
}

let qpdfReady = false;
function ensureQpdf() {
  if (qpdfReady) return;
  const probe = spawnSync("qpdf", ["--version"], { stdio: "ignore" });
  if (probe.error?.code === "ENOENT" && process.env.VERCEL === "1") {
    run("dnf", ["install", "-y", "qpdf"]);
  }
  run("qpdf", ["--version"]);
  qpdfReady = true;
}

function pageCount(path) {
  const count = Number(run("qpdf", ["--show-npages", path], true).trim());
  if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid page count: " + path);
  return count;
}

async function mergeBook(directory, outputRoot) {
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  if (manifest.format !== "pdf-pages" || !Array.isArray(manifest.parts) || !manifest.parts.length) throw new Error("Invalid page-part manifest: " + directory);
  const names = new Set(["manifest.json"]);
  const inputs = [];
  for (const [index, part] of manifest.parts.entries()) {
    if (part.name !== "part-" + (index + 1) + ".pdf" || !Number.isSafeInteger(part.size) || part.size < 1 || !/^[a-f0-9]{40}$/.test(part.gitBlobSha1)) throw new Error("Invalid PDF part entry: " + directory);
    names.add(part.name);
    const path = join(directory, part.name);
    const info = await stat(path);
    if (info.size !== part.size) throw new Error("PDF part size mismatch: " + path);
    const digest = createHash("sha1").update("blob " + info.size + "\0");
    for await (const bytes of createReadStream(path)) digest.update(bytes);
    if (digest.digest("hex") !== part.gitBlobSha1) throw new Error("PDF part checksum mismatch: " + path);
    inputs.push(path);
  }
  const entries = await readdir(directory, { withFileTypes: true });
  if (entries.length !== names.size || entries.some(entry => !entry.isFile() || !names.has(entry.name))) throw new Error("Unexpected or missing PDF parts: " + directory);
  ensureQpdf();
  const expectedPages = inputs.reduce((total, path) => total + pageCount(path), 0);
  const target = pdfPath(relative(root, directory).split(sep).join("/") + ".pdf");
  const output = join(outputRoot, target);
  const temporary = output + ".tmp-" + process.pid;
  await mkdir(dirname(output), { recursive: true });
  try {
    run("qpdf", ["--empty", "--stream-data=preserve", "--pages", ...inputs.flatMap(path => [path, "1-z"]), "--", temporary]);
    run("qpdf", ["--check", temporary]);
    if (pageCount(temporary) !== expectedPages) throw new Error("Merged page count mismatch: " + target);
    await publishPdf(temporary, outputRoot, target);
    // Jekyll may copy source parts for additional books not explicitly excluded.
    const publishedParts = join(outputRoot, relative(root, directory));
    if (resolve(publishedParts) !== resolve(directory)) await rm(publishedParts, { recursive: true, force: true });
    const aliasParts = join(outputRoot, relative(root, directory).slice("static/".length));
    await rm(aliasParts, { recursive: true, force: true });
    console.log("Merged " + inputs.length + " PDFs into " + target + " (" + expectedPages + " pages)");
  } finally {
    await rm(temporary, { force: true });
  }
}

async function mergeBooks(outputRoot) {
  const books = join(root, "static", "book");
  if (!(await exists(books))) return;
  for (const entry of await readdir(books, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = join(books, entry.name);
    const files = await readdir(directory);
    if (files.includes("manifest.json") || files.some(name => /^part-\d+\.pdf$/.test(name))) {
      await mergeBook(directory, outputRoot);
    }
  }
}

const [command, source, target, ...extra] = process.argv.slice(2);
if (command === "split" && source && target && !extra.length) {
  await split(source, target);
} else if (command === "build" && !target && !extra.length) {
  const outputRoot = resolve(root, source || "_site");
  if (outputRoot === root) throw new Error("Build output must not be the source directory");
  if (await exists(partsRoot)) await walk(partsRoot, outputRoot);
  await mergeBooks(outputRoot);
} else {
  throw new Error("Usage: node api/_pdf-parts.mjs split <input.pdf> <static/path.pdf> | build [output-directory]");
}
