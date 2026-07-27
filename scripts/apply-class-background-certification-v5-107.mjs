import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.107.0";
pkg.scripts ??= {};
pkg.scripts["certify:class-background:oracle"] = "vitest run src/certification/oracle/classBackgroundOracle.test.ts";
pkg.scripts["certify:class-background:e2e"] = "playwright test e2e/certification-all-classes-backgrounds.spec.ts";
pkg.scripts["certify:class-background:report"] = "node scripts/generate-class-background-certification-report.mjs";
pkg.scripts["certify:class-background:quick"] = "npm run certify:class-background:oracle && npm run build && npm run certify:class-background:report";
pkg.scripts["certify:class-background:release"] = "npm run certify:class-background:quick && npm run certify:class-background:e2e";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.107 class/background certification scripts installed.");
