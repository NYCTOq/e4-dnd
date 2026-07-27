import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packagePath = resolve(process.cwd(), "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.111.5";
pkg.scripts ??= {};

pkg.scripts["certify:rest-ui:discover"] =
  "node scripts/discover-rest-ui-integration-contract-v5-111D1.mjs";
pkg.scripts["certify:rest-ui:contract"] =
  "vitest run src/certification/integration/restUiIntegrationContract.test.ts";
pkg.scripts["certify:rest-ui:foundation"] =
  "npm run certify:rest-ui:discover && npm run certify:rest-ui:contract && npm run certify:rest-recovery:golden && npm run certify:rest-recovery:persistence && npm run build";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

console.log("v5.111D1 Rest UI Integration Contract Gate installed.");
