import {
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(
  process.cwd(),
  "package.json",
);

const pkg = JSON.parse(
  await readFile(path, "utf8"),
);

pkg.version = "5.115.1";
pkg.scripts ??= {};

pkg.scripts["certify:death-dying:differential"] =
  "vitest run src/certification/differential/deathDyingDifferential.test.ts";
pkg.scripts["certify:death-dying:matrix"] =
  "vitest run src/certification/matrix/deathDyingScenarioMatrix.test.ts";
pkg.scripts["certify:death-dying:report"] =
  "node scripts/generate-death-dying-runtime-report-v5-115B.mjs";
pkg.scripts["certify:death-dying:runtime"] =
  "npm run certify:death-dying:oracle && npm run certify:death-dying:differential && npm run certify:death-dying:matrix && npm run build && npm run certify:death-dying:report";

await writeFile(
  path,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.115B Death & Dying canonical runtime installed.",
);
