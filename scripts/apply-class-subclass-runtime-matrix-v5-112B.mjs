import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.112.1";
pkg.scripts ??= {};

pkg.scripts["certify:class-subclass:differential"] =
  "vitest run src/certification/differential/classSubclassRuntimeDifferential.test.ts";
pkg.scripts["certify:class-subclass:matrix"] =
  "vitest run src/certification/matrix/classSubclassRuntimeScenarioMatrix.test.ts";
pkg.scripts["certify:class-subclass:runtime:report"] =
  "node scripts/generate-class-subclass-runtime-report-v5-112B.mjs";
pkg.scripts["certify:class-subclass:runtime"] =
  "npm run certify:class-subclass:oracle && npm run certify:class-subclass:differential && npm run certify:class-subclass:matrix && npm run build && npm run certify:class-subclass:runtime:report";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.112B Class/Subclass Runtime Matrix installed.");
