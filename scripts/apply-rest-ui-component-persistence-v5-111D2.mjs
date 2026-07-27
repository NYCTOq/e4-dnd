import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));

pkg.version = "5.111.6";
pkg.scripts ??= {};

pkg.scripts["certify:rest-ui:persistence-bridge"] =
  "vitest run src/certification/integration/restRecoveryPersistenceBridge.test.ts";
pkg.scripts["certify:rest-ui:storage-matrix"] =
  "vitest run src/certification/matrix/restRecoveryStorageMatrix.test.ts";
pkg.scripts["certify:rest-ui:component-foundation"] =
  "npm run certify:rest-recovery:oracle && npm run certify:rest-recovery:differential && npm run certify:rest-recovery:matrix && npm run certify:rest-recovery:golden && npm run certify:rest-recovery:persistence && npm run certify:rest-ui:persistence-bridge && npm run certify:rest-ui:storage-matrix && npm run build";

await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

const cssCandidates = [
  resolve(root, "src/index.css"),
  resolve(root, "src/App.css"),
  resolve(root, "src/styles.css"),
];

for (const cssPath of cssCandidates) {
  try {
    let css = await readFile(cssPath, "utf8");
    const mobileImport =
      '@import "./styles/44-mobile-accessibility-performance.css";';
    const restImport =
      '@import "./styles/45-rest-actions-panel.css";';

    const imports = [];
    if (css.includes(mobileImport)) {
      css = css.replace(mobileImport, "").trimStart();
      imports.push(mobileImport);
    }
    if (!css.includes(restImport)) {
      imports.push(restImport);
    }

    if (imports.length > 0) {
      css = `${imports.join("\n")}\n${css}`;
      await writeFile(cssPath, css, "utf8");
      console.log(`CSS import order fixed in ${cssPath}`);
      break;
    }
  } catch {
    // Try next candidate.
  }
}

console.log("v5.111D2 Rest UI component and persistence bridge installed.");
