import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.114.0";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:oracle"] =
  "vitest run src/certification/oracle/levelUpProgressionOracle.test.ts";
pkg.scripts["certify:level-up:discover"] =
  "node scripts/discover-level-up-progression-v5-114A.mjs";
pkg.scripts["certify:level-up:foundation"] =
  "npm run certify:level-up:oracle && npm run certify:level-up:discover && npm run build";

await writeFile(
  path,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114A Level-Up Progression oracle + discovery installed.",
);
