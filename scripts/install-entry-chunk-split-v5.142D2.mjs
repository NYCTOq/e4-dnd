import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vitePath = path.join(root, "vite.config.ts");
const packagePath = path.join(root, "package.json");

if (!fs.existsSync(vitePath) || !fs.existsSync(packagePath)) {
  throw new Error("Run this installer from the E4 D&D project root.");
}

let vite = fs.readFileSync(vitePath, "utf8");
const anchor = `          if (id.includes("itemExpansion")) return "data-items";`;
const replacement = `          if (id.includes("itemExpansion")) return "data-items";\n          if (id.includes("/src/core/")) return "app-core";\n          if (id.includes("/src/shared/")) return "app-shared";\n          if (id.includes("/src/features/homebrew/homebrewStorage") || id.includes("/src/core/homebrew/")) return "app-homebrew-core";\n          if (id.includes("/src/features/campaigns/campaignStorage") || id.includes("/src/features/campaigns/campaignTemplates") || id.includes("/src/features/campaigns/campaignTypes")) return "app-campaign-core";\n          if (id.includes("/src/features/backup/")) return "app-backup-core";`;

if (vite.includes(anchor) && !vite.includes('return "app-core"')) {
  vite = vite.replace(anchor, replacement);
} else if (!vite.includes('return "app-core"')) {
  throw new Error("vite.config.ts manualChunks anchor was not found; no partial patch was applied.");
}

fs.writeFileSync(vitePath, vite, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "5.142.2";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("v5.142D2 entry chunk split applied.");
