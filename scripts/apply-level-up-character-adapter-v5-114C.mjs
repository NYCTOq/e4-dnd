import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.114.3";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:golden"] =
  "vitest run src/certification/golden/levelUpGoldenCharacters.test.ts";
pkg.scripts["certify:level-up:persistence"] =
  "vitest run src/certification/matrix/levelUpCharacterPersistenceMatrix.test.ts";
pkg.scripts["certify:level-up:adapter:report"] =
  "node scripts/generate-level-up-character-report-v5-114C.mjs";
pkg.scripts["certify:level-up:integration"] =
  "npm run certify:level-up:oracle && npm run certify:level-up:differential && npm run certify:level-up:matrix && npm run certify:level-up:golden && npm run certify:level-up:persistence && npm run build && npm run certify:level-up:report && npm run certify:level-up:adapter:report";

await writeFile(
  path,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114C Level-Up Character Adapter installed.",
);
