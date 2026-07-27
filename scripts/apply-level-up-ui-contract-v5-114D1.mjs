import {
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(
  await readFile(path, "utf8"),
);

pkg.version = "5.114.5";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:ui:discover"] =
  "node scripts/discover-level-up-ui-contract-v5-114D1.mjs";
pkg.scripts["certify:level-up:ui:contract"] =
  "vitest run src/certification/integration/levelUpUiContract.test.ts";
pkg.scripts["certify:level-up:ui:foundation"] =
  "npm run certify:level-up:ui:discover && npm run certify:level-up:ui:contract && npm run certify:level-up:golden && npm run certify:level-up:persistence && npm run build";

await writeFile(
  path,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log(
  "v5.114D1 Level-Up UI contract installed.",
);
