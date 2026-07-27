import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.113.0";
pkg.scripts ??= {};

pkg.scripts["certify:spell-runtime:oracle"] =
  "vitest run src/certification/oracle/spellRuntimeCombatOracle.test.ts";
pkg.scripts["certify:spell-runtime:discover"] =
  "node scripts/discover-spell-runtime-combat-v5-113A.mjs";
pkg.scripts["certify:spell-runtime:foundation"] =
  "npm run certify:spell-runtime:oracle && npm run certify:spell-runtime:discover && npm run build";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.113A Spell Runtime Combat oracle + discovery installed.");
