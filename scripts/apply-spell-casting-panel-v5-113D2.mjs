import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = process.cwd();
const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = "5.113.5";
pkg.scripts ??= {};
pkg.scripts["certify:spell-runtime:ui:persistence-bridge"] = "vitest run src/certification/integration/spellCastingPersistenceBridge.test.ts";
pkg.scripts["certify:spell-runtime:ui:casting-matrix"] = "vitest run src/certification/matrix/spellCastingUiPersistenceMatrix.test.ts";
pkg.scripts["certify:spell-runtime:ui:component-foundation"] = "npm run certify:spell-runtime:golden && npm run certify:spell-runtime:persistence && npm run certify:spell-runtime:ui:persistence-bridge && npm run certify:spell-runtime:ui:casting-matrix && npm run build";
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
for (const cssPath of [resolve(root, "src/index.css"), resolve(root, "src/App.css"), resolve(root, "src/styles.css")]) {
  try {
    let css = await readFile(cssPath, "utf8");
    const importLine = '@import "./styles/49-spell-casting-runtime-panel.css";';
    if (!css.includes(importLine)) await writeFile(cssPath, `${importLine}\n${css}`, "utf8");
    break;
  } catch {}
}
console.log("v5.113D2 Spell Casting Panel installed.");
