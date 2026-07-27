import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.112.3";
pkg.scripts ??= {};

pkg.scripts["certify:class-subclass:ui:discover"] =
  "node scripts/discover-class-subclass-ui-contract-v5-112D1.mjs";
pkg.scripts["certify:class-subclass:ui:contract"] =
  "vitest run src/certification/integration/classSubclassUiContract.test.ts";
pkg.scripts["certify:class-subclass:ui:foundation"] =
  "npm run certify:class-subclass:ui:discover && npm run certify:class-subclass:ui:contract && npm run certify:class-subclass:golden && npm run certify:class-subclass:persistence && npm run build";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.112D1 Class/Subclass UI contract installed.");
