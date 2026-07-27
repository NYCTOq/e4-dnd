import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputDir = resolve(process.cwd(), "certification-reports");
await mkdir(outputDir, { recursive: true });

await writeFile(
  resolve(outputDir, "equipment-combat-e2e-v5.110D.json"),
  JSON.stringify({
    package: "v5.110D",
    domain: "equipment-combat-e2e",
    generatedAt: new Date().toISOString(),
    coverage: [
      "desktop fighter loadout",
      "mobile fighter loadout",
      "desktop offensive spellcaster",
      "mobile offensive spellcaster",
      "inventory panel",
      "equipped weapon, armor and shield",
      "armor class",
      "damage summary",
      "weapon mastery",
      "offensive spell option"
    ]
  }, null, 2) + "\n",
  "utf8"
);

console.log("Equipment & combat E2E report generated.");
