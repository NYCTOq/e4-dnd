import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.108.2";
pkg.scripts ??= {};
pkg.scripts["certify:ability:e2e"] =
  "playwright test e2e/certification-abilities-smoke.spec.ts --workers=2";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.108.2 atomic ability E2E stability hotfix installed.");
