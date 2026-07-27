import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));
pkg.version = "5.115.2";
pkg.scripts ??= {};
pkg.scripts["certify:death-dying:golden"] =
  "vitest run src/certification/golden/deathDyingGoldenCharacters.test.ts";
pkg.scripts["certify:death-dying:character-persistence"] =
  "vitest run src/certification/matrix/deathDyingCharacterPersistenceMatrix.test.ts";
pkg.scripts["certify:death-dying:character-report"] =
  "node scripts/generate-death-dying-character-report-v5-115C.mjs";
pkg.scripts["certify:death-dying:character"] =
  "npm run certify:death-dying:runtime && npm run certify:death-dying:golden && npm run certify:death-dying:character-persistence && npm run build && npm run certify:death-dying:character-report";
await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("v5.115C Death & Dying character integration installed.");
