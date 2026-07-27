import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.112.0";
pkg.scripts ??= {};

pkg.scripts["certify:class-subclass:oracle"] =
  "vitest run src/certification/oracle/classSubclassRuntimeOracle.test.ts";
pkg.scripts["certify:class-subclass:discover"] =
  "node scripts/discover-class-subclass-runtime-v5-112A.mjs";
pkg.scripts["certify:class-subclass:foundation"] =
  "npm run certify:class-subclass:oracle && npm run certify:class-subclass:discover && npm run build";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.112A Class/Subclass oracle + discovery installed.");
