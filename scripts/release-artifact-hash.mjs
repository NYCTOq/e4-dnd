import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const outputPath = resolve(root, "release-artifact-checksums.json");

async function walk(directory) {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }

  return files;
}

const files = (await walk(distDir)).sort();
if (files.length === 0) {
  throw new Error("dist directory is empty; build artifacts cannot be hashed.");
}

const artifacts = [];
for (const file of files) {
  const buffer = await readFile(file);
  artifacts.push({
    path: relative(root, file).replaceAll("\\", "/"),
    bytes: buffer.byteLength,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  });
}

const manifest = {
  algorithm: "sha256",
  generatedAt: new Date().toISOString(),
  artifactCount: artifacts.length,
  totalBytes: artifacts.reduce((sum, artifact) => sum + artifact.bytes, 0),
  artifacts,
};

await writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Release artifact checksum manifest created: ${artifacts.length} files.`);
