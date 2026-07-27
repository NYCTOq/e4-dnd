import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path=resolve(process.cwd(),"package.json");
const pkg=JSON.parse(await readFile(path,"utf8"));

pkg.version="5.108.0";
pkg.scripts??={};
pkg.scripts["certify:ability:oracle"]="vitest run src/certification/oracle/abilityProficiencyOracle.test.ts";
pkg.scripts["certify:ability:matrix"]="vitest run src/certification/matrix/derivedStatsScenarioMatrix.test.ts";
pkg.scripts["certify:ability:e2e"]="playwright test e2e/certification-abilities-smoke.spec.ts --workers=4";
pkg.scripts["certify:ability:report"]="node scripts/generate-ability-certification-report.mjs";
pkg.scripts["certify:ability:quick"]="npm run certify:ability:oracle && npm run certify:ability:matrix && npm run build && npm run certify:ability:report";
pkg.scripts["certify:ability:release"]="npm run certify:ability:quick && npm run certify:ability:e2e";

await writeFile(path,JSON.stringify(pkg,null,2)+"\n","utf8");
console.log("v5.108 ability/proficiency certification scripts installed.");
