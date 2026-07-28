import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packagePath = path.join(root, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
packageJson.version = "5.132.0";
packageJson.scripts ??= {};
packageJson.scripts["test:spell-runtime-completion"] = "vitest run src/core/rulesets/spellRuntimeCompletion-v5.132.test.ts";
packageJson.scripts["certify:spell-runtime-completion"] = "npm run test:spell-runtime-completion && npm run build";
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

const cssPath = path.join(root, "src/styles/49-spell-casting-runtime-panel.css");
const marker = "/* v5.132 spell runtime completion */";
const css = `\n${marker}\n.spell-casting-runtime-panel__rest-actions,.spell-casting-runtime-panel__concentration-check{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.spell-casting-runtime-panel__rest-actions button,.spell-casting-runtime-panel__concentration-check button,.spell-casting-runtime-panel__concentration-check input{min-height:44px}.spell-casting-runtime-panel__feedback{margin:0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,currentColor 8%,transparent)}.spell-casting-runtime-panel__concentration-check label{display:grid;gap:4px}.spell-casting-runtime-panel__concentration-check input{width:110px}@media(max-width:640px){.spell-casting-runtime-panel__rest-actions,.spell-casting-runtime-panel__concentration-check{display:grid;grid-template-columns:1fr}.spell-casting-runtime-panel__rest-actions button,.spell-casting-runtime-panel__concentration-check button,.spell-casting-runtime-panel__concentration-check input{width:100%}}\n`;
if (!fs.existsSync(cssPath)) throw new Error(`Missing CSS target: ${cssPath}`);
const currentCss = fs.readFileSync(cssPath, "utf8");
if (!currentCss.includes(marker)) fs.appendFileSync(cssPath, css);

console.log("v5.132 source metadata and styles applied.");
