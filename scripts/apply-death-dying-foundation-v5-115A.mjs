import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.115.0";
pkg.scripts ??= {};

pkg.scripts["certify:death-dying:oracle"] =
  "vitest run src/certification/oracle/deathDyingOracle.test.ts";
pkg.scripts["certify:death-dying:discover"] =
  "node scripts/discover-death-dying-runtime-v5-115A.mjs";
pkg.scripts["certify:death-dying:foundation"] =
  "npm run certify:death-dying:oracle && npm run certify:death-dying:discover && npm run build";

await writeFile(
  path,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.115A Death & Dying oracle + discovery installed.",
);
