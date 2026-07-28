import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vitePath = path.join(root, "vite.config.ts");
const packagePath = path.join(root, "package.json");

if (!fs.existsSync(vitePath) || !fs.existsSync(packagePath)) {
  throw new Error("Run this installer from the E4 D&D project root.");
}

let vite = fs.readFileSync(vitePath, "utf8");
const oldChunkBlock = `          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) return "vendor-react";\n          if (id.includes("spellExpansion")) return "data-spells";\n          if (id.includes("subclassExpansion")) return "data-subclasses";\n          if (id.includes("itemExpansion")) return "data-items";\n          if (id.includes("PageShell") || id.includes("AppFrame")) return "shell";`;
const newChunkBlock = `          if (id.includes("node_modules/react-router")) return "vendor-router";\n          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor-react";\n          if (id.includes("spellExpansion")) return "data-spells";\n          if (id.includes("subclassExpansion")) return "data-subclasses";\n          if (id.includes("itemExpansion")) return "data-items";`;

if (vite.includes(oldChunkBlock)) {
  vite = vite.replace(oldChunkBlock, newChunkBlock);
} else if (!vite.includes('return "vendor-router"')) {
  throw new Error("vite.config.ts manualChunks anchor was not found; no partial patch was applied.");
}

const buildAnchor = `  build: {\n    chunkSizeWarningLimit: 450,`;
const buildReplacement = `  build: {\n    cssCodeSplit: true,\n    modulePreload: { polyfill: false },\n    reportCompressedSize: true,\n    chunkSizeWarningLimit: 400,`;
if (vite.includes(buildAnchor)) vite = vite.replace(buildAnchor, buildReplacement);
else if (!vite.includes("modulePreload: { polyfill: false }")) throw new Error("vite.config.ts build anchor was not found.");

fs.writeFileSync(vitePath, vite, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "5.142.0";
pkg.scripts ??= {};
pkg.scripts["test:bundle-performance"] = "vitest run src/core/performance/bundlePerformanceBudget-v5.142.test.ts";
pkg.scripts["audit:bundle-performance"] = "node scripts/bundle-performance-budget-v5.142.mjs";
pkg.scripts["certify:bundle-performance"] = "npm run test:bundle-performance && npm run build && npm run audit:bundle-performance";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("v5.142 source applied: forced shell chunk removed; router cache split; bundle budgets installed.");
