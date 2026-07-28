import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const patchRoot = path.resolve(import.meta.dirname, "..");
for (const relative of [
  "scripts/run-full-regression-rc-v5.136.mjs",
  "src/release/fullRegressionReleaseCandidate-v5.136.test.ts",
]) {
  const source = path.join(patchRoot, relative);
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (path.resolve(source) !== path.resolve(target)) fs.copyFileSync(source, target);
}

const cssPath = path.join(root, "src/index.css");
const css = fs.readFileSync(cssPath, "utf8");
const imports = [];
const body = [];
for (const line of css.split(/\r?\n/)) {
  if (line.trim().startsWith("@import")) imports.push(line.trim());
  else body.push(line);
}
const uniqueImports = [...new Set(imports)];
fs.writeFileSync(cssPath, `${uniqueImports.join("\n")}\n\n${body.join("\n").replace(/^\s+/, "")}`, "utf8");

const packagePath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "5.136.0";
pkg.scripts ??= {};
pkg.scripts["test:release-candidate-v5.136"] = "vitest run src/release/fullRegressionReleaseCandidate-v5.136.test.ts";
pkg.scripts["test:e2e:rc-v5.136"] = "playwright test e2e/rc1-critical-smoke.spec.ts e2e/release-hardening-smoke-v5.128.spec.ts e2e/accessibility-essentials-v5.127.spec.ts e2e/error-offline-backup-recovery-v5.126.spec.ts --workers=1";
pkg.scripts["certify:release-candidate-v5.136"] = "npm run test:release-candidate-v5.136 && node scripts/run-full-regression-rc-v5.136.mjs";
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log("v5.136 sources applied; CSS import order normalized; package.json updated as UTF-8.");
