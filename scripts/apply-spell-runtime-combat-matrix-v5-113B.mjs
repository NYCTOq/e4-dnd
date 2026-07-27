import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.113.1";
pkg.scripts ??= {};

pkg.scripts["certify:spell-runtime:differential"] =
  "vitest run src/certification/differential/spellRuntimeCombatDifferential.test.ts";
pkg.scripts["certify:spell-runtime:matrix"] =
  "vitest run src/certification/matrix/spellRuntimeCombatScenarioMatrix.test.ts";
pkg.scripts["certify:spell-runtime:report"] =
  "node scripts/generate-spell-runtime-combat-report-v5-113B.mjs";
pkg.scripts["certify:spell-runtime:runtime"] =
  "npm run certify:spell-runtime:oracle && npm run certify:spell-runtime:differential && npm run certify:spell-runtime:matrix && npm run build && npm run certify:spell-runtime:report";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.113B Spell Runtime Combat Matrix installed.");
