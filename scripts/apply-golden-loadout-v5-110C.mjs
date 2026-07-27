import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.110.7";
pkg.scripts ??= {};

pkg.scripts["certify:equipment-combat:golden"] =
  "vitest run src/certification/golden/equipmentCombatGoldenLoadouts.test.ts";
pkg.scripts["certify:equipment-combat:golden:report"] =
  "node scripts/generate-golden-loadout-report.mjs";
pkg.scripts["certify:equipment-combat:complete"] =
  "npm run certify:equipment-combat:oracle && npm run certify:equipment-combat:matrix && npm run certify:equipment-combat:differential && npm run certify:equipment-combat:golden && npm run build && npm run certify:equipment-combat:report && npm run certify:equipment-combat:differential:report && npm run certify:equipment-combat:golden:report";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.110C golden loadout certification installed.");
