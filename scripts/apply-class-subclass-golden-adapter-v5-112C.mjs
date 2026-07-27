import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.112.2";
pkg.scripts ??= {};

pkg.scripts["certify:class-subclass:golden"] =
  "vitest run src/certification/golden/classSubclassGoldenCharacters.test.ts";
pkg.scripts["certify:class-subclass:persistence"] =
  "vitest run src/certification/matrix/classSubclassPersistenceMatrix.test.ts";
pkg.scripts["certify:class-subclass:golden:report"] =
  "node scripts/generate-class-subclass-golden-report-v5-112C.mjs";
pkg.scripts["certify:class-subclass:integration"] =
  "npm run certify:class-subclass:oracle && npm run certify:class-subclass:differential && npm run certify:class-subclass:matrix && npm run certify:class-subclass:golden && npm run certify:class-subclass:persistence && npm run build && npm run certify:class-subclass:runtime:report && npm run certify:class-subclass:golden:report";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.112C Golden Class/Subclass Adapter installed.");
