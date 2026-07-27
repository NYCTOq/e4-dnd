import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.110.8";
pkg.scripts ??= {};
pkg.scripts["certify:equipment-combat:e2e"] =
  "playwright test e2e/equipment-combat-certification.spec.ts";
pkg.scripts["certify:equipment-combat:e2e:report"] =
  "node scripts/generate-equipment-combat-e2e-report.mjs";
pkg.scripts["certify:equipment-combat:release"] =
  "npm run certify:equipment-combat:complete && npm run certify:equipment-combat:e2e && npm run certify:equipment-combat:e2e:report";

await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.110D equipment & combat E2E certification installed.");
