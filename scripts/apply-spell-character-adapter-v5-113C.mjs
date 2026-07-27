import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.113.2";
pkg.scripts ??= {};

pkg.scripts["certify:spell-runtime:golden"] =
  "vitest run src/certification/golden/spellRuntimeGoldenCasters.test.ts";
pkg.scripts["certify:spell-runtime:persistence"] =
  "vitest run src/certification/matrix/spellCharacterCombatPersistenceMatrix.test.ts";
pkg.scripts["certify:spell-runtime:adapter:report"] =
  "node scripts/generate-spell-character-adapter-report-v5-113C.mjs";
pkg.scripts["certify:spell-runtime:integration"] =
  "npm run certify:spell-runtime:oracle && npm run certify:spell-runtime:differential && npm run certify:spell-runtime:matrix && npm run certify:spell-runtime:golden && npm run certify:spell-runtime:persistence && npm run build && npm run certify:spell-runtime:report && npm run certify:spell-runtime:adapter:report";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.113C Spell Character Adapter installed.");
