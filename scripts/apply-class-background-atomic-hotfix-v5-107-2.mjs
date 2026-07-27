import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(path, "utf8"));

pkg.version = "5.107.2";
pkg.scripts ??= {};
pkg.scripts["certify:class-background:e2e"] =
  "playwright test e2e/certification-all-classes-backgrounds.spec.ts --workers=4";

await writeFile(path, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.107.2 atomic selector and worker limit installed.");
