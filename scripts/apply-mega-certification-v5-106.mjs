import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.106.0";
pkg.scripts ??= {};
pkg.scripts["certify:progression"] = "vitest run src/certification/oracle/progressionOracle.test.ts";
pkg.scripts["certify:matrix:mega"] = "vitest run src/certification/matrix/megaScenarioGenerator.test.ts";
pkg.scripts["certify:ancestry:all"] = "playwright test e2e/certification-all-ancestries.spec.ts";
pkg.scripts["certify:mega:report"] = "node scripts/generate-mega-certification-report.mjs";
pkg.scripts["certify:mega:quick"] = "npm run test:oracle && npm run certify:progression && npm run certify:matrix:mega && npm run build && npm run certify:mega:report";
pkg.scripts["certify:mega:release"] = "npm run certify:mega:quick && npm run certify:builder && npm run certify:ancestry:all";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.106 Mega Certification scripts installed.");
