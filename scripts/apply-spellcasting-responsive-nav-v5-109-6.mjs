import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.109.6";
pkg.scripts ??= {};
pkg.scripts["certify:spellcasting:e2e"] =
  "playwright test e2e/certification-spellcasting-smoke.spec.ts --workers=1";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.109.6 spellcasting responsive navigation hotfix installed.");
