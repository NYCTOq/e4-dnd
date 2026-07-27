import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.111.3";
pkg.scripts ??= {};

pkg.scripts["certify:rest-recovery:golden"] =
  "vitest run src/certification/golden/restRecoveryGoldenCharacters.test.ts";
pkg.scripts["certify:rest-recovery:persistence"] =
  "vitest run src/certification/matrix/restRecoveryPersistenceMatrix.test.ts";
pkg.scripts["certify:rest-recovery:golden:report"] =
  "node scripts/generate-rest-recovery-golden-report-v5-111C.mjs";
pkg.scripts["certify:rest-recovery:integration"] =
  "npm run certify:rest-recovery:oracle && npm run certify:rest-recovery:differential && npm run certify:rest-recovery:matrix && npm run certify:rest-recovery:golden && npm run certify:rest-recovery:persistence && npm run build && npm run certify:rest-recovery:runtime:report && npm run certify:rest-recovery:golden:report";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.111C Golden Character Integration installed.");
