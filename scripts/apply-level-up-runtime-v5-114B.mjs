import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.114.2";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:differential"] =
  "vitest run src/certification/differential/levelUpProgressionDifferential.test.ts";
pkg.scripts["certify:level-up:matrix"] =
  "vitest run src/certification/matrix/levelUpProgressionScenarioMatrix.test.ts";
pkg.scripts["certify:level-up:report"] =
  "node scripts/generate-level-up-runtime-report-v5-114B.mjs";
pkg.scripts["certify:level-up:runtime"] =
  "npm run certify:level-up:oracle && npm run certify:level-up:differential && npm run certify:level-up:matrix && npm run build && npm run certify:level-up:report";

await writeFile(
  path,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114B Level-Up canonical runtime installed.",
);
