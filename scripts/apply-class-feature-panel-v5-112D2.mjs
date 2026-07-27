import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.112.4";
pkg.scripts ??= {};

pkg.scripts["certify:class-subclass:ui:persistence-bridge"] =
  "vitest run src/certification/integration/classFeaturePersistenceBridge.test.ts";
pkg.scripts["certify:class-subclass:ui:usage-matrix"] =
  "vitest run src/certification/matrix/classFeatureUsagePersistenceMatrix.test.ts";
pkg.scripts["certify:class-subclass:ui:component-foundation"] =
  "npm run certify:class-subclass:golden && npm run certify:class-subclass:persistence && npm run certify:class-subclass:ui:persistence-bridge && npm run certify:class-subclass:ui:usage-matrix && npm run build";

await writeFile(
  packagePath,
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8",
);

const cssCandidates = [
  resolve(root, "src/index.css"),
  resolve(root, "src/App.css"),
  resolve(root, "src/styles.css"),
];

const importLine =
  '@import "./styles/47-class-feature-panel.css";';

for (const cssPath of cssCandidates) {
  try {
    let css = await readFile(cssPath, "utf8");

    if (!css.includes(importLine)) {
      css = `${importLine}\n${css}`;
      await writeFile(cssPath, css, "utf8");
    }

    break;
  } catch {
    // Try next.
  }
}

console.log("v5.112D2 Class Feature Panel installed.");
