import {
  readFile,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(
  await readFile(packagePath, "utf8"),
);

pkg.version = "5.114.6";
pkg.scripts ??= {};

pkg.scripts["certify:level-up:ui:persistence-bridge"] =
  "vitest run src/certification/integration/levelUpPersistenceBridge.test.ts";
pkg.scripts["certify:level-up:ui:matrix"] =
  "vitest run src/certification/matrix/levelUpUiPersistenceMatrix.test.ts";
pkg.scripts["certify:level-up:ui:component-foundation"] =
  "npm run certify:level-up:golden && npm run certify:level-up:persistence && npm run certify:level-up:ui:persistence-bridge && npm run certify:level-up:ui:matrix && npm run build";

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
  '@import "./styles/51-level-up-runtime-panel.css";';

for (const cssPath of cssCandidates) {
  try {
    let css = await readFile(cssPath, "utf8");

    if (!css.includes(importLine)) {
      css = `${importLine}\n${css}`;
      await writeFile(cssPath, css, "utf8");
    }

    break;
  } catch {
    // Try next candidate.
  }
}

console.log(
  "v5.114D2 Level-Up panel foundation installed.",
);
