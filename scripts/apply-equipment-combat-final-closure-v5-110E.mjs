import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.110.12";
pkg.scripts ??= {};

pkg.scripts["certify:equipment-combat:final:audit"] =
  "node scripts/audit-equipment-combat-final-closure-v5-110E.mjs";

pkg.scripts["certify:equipment-combat:final"] =
  "npm run certify:equipment-combat:release && npm run certify:equipment-combat:final:audit";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.110E final closure gate installed.");
