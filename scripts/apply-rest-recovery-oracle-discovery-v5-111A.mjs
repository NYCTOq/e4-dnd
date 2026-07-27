import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.111.0";
pkg.scripts ??= {};

pkg.scripts["certify:rest-recovery:oracle"] =
  "vitest run src/certification/oracle/restRecoveryOracle.test.ts";
pkg.scripts["certify:rest-recovery:discover"] =
  "node scripts/discover-rest-recovery-runtime-v5-111A.mjs";
pkg.scripts["certify:rest-recovery:foundation"] =
  "npm run certify:rest-recovery:oracle && npm run certify:rest-recovery:discover && npm run build";

await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.111A Rest/Recovery oracle + discovery mega installed.");
