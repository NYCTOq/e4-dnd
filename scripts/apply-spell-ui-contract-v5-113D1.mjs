import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.113.4";
pkg.scripts ??= {};

pkg.scripts["certify:spell-runtime:ui:discover"] =
  "node scripts/discover-spell-ui-contract-v5-113D1.mjs";
pkg.scripts["certify:spell-runtime:ui:contract"] =
  "vitest run src/certification/integration/spellUiContract.test.ts";
pkg.scripts["certify:spell-runtime:ui:foundation"] =
  "npm run certify:spell-runtime:ui:discover && npm run certify:spell-runtime:ui:contract && npm run certify:spell-runtime:golden && npm run certify:spell-runtime:persistence && npm run build";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.113D1 Spell UI contract installed.");
