import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile, open, stat } from "node:fs/promises";
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
    await rename(temporary, output);
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

const [command, source, target, ...extra] = process.argv.slice(2);
if (command === "split" && source && target && !extra.length) {
  await split(source, target);
} else if (command === "build" && !target && !extra.length) {
  if (await exists(partsRoot)) await walk(partsRoot, resolve(root, source || "_site"));
} else {
  throw new Error("Usage: node api/_pdf-parts.mjs split <input.pdf> <static/path.pdf> | build [output-directory]");
}
