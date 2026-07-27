import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));
pkg.version = "5.115.3";
pkg.scripts ??= {};
pkg.scripts["certify:death-dying:play-mode"] =
  "vitest run src/certification/integration/deathDyingPlayModeIntegration.test.ts";
pkg.scripts["certify:death-dying:e2e"] =
  "playwright test e2e/death-dying-play-mode-v5.115D.spec.ts";
pkg.scripts["certify:death-dying:final:audit"] =
  "node scripts/audit-death-dying-final-closure-v5-115D.mjs";
pkg.scripts["certify:death-dying:final"] =
  "npm run certify:death-dying:character && npm run certify:death-dying:play-mode && npm run build && npm run certify:death-dying:e2e && npm run certify:death-dying:final:audit";
await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
console.log("v5.115D Death & Dying final closure installed.");
