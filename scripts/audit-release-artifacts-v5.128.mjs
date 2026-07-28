import fs from "node:fs";
import path from "node:path";

const MAX_ENTRY_CHUNK_BYTES = 450_000;
const assetsDir = path.resolve("dist/assets");
if (!fs.existsSync(assetsDir)) throw new Error("dist/assets bulunamadı. Önce build çalıştırılmalı.");
const js = fs.readdirSync(assetsDir)
  .filter((name) => name.endsWith(".js"))
  .map((name) => ({ name, size: fs.statSync(path.join(assetsDir, name)).size }));
const entry = js.filter((item) => item.name.startsWith("index-")).sort((a, b) => b.size - a.size)[0];
if (!entry) throw new Error("Ana index chunk bulunamadı.");
if (entry.size > MAX_ENTRY_CHUNK_BYTES) throw new Error(`Ana chunk bütçeyi aştı: ${entry.size} > ${MAX_ENTRY_CHUNK_BYTES}`);
const total = js.reduce((sum, item) => sum + item.size, 0);
console.log(`Release artifact audit OK: entry=${entry.size} bytes, total-js=${total} bytes, chunks=${js.length}`);
