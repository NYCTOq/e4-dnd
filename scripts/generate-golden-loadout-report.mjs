import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const report = {
  package: "v5.110C",
  domain: "golden-loadout-combat-readiness",
  generatedAt: new Date().toISOString(),
  certification: {
    rulesets: ["dnd_2014", "dnd_2024"],
    archetypes: [
      "sword-and-shield fighter",
      "archer fighter",
      "rapier rogue",
      "greatsword barbarian",
      "unarmed monk",
      "offensive wizard",
      "offensive cleric",
      "invalid missing equipment",
      "invalid zero HP",
    ],
    checks: [
      "effective armor class",
      "inventory weight",
      "combat readiness",
      "primary combat options",
      "attack bonus",
      "damage summary",
      "weapon mastery",
      "blockers",
      "notices",
    ],
  },
};

const outputDir = resolve(process.cwd(), "certification-reports");
await mkdir(outputDir, { recursive: true });

await writeFile(
  resolve(outputDir, "golden-loadout-combat-readiness-v5.110C.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

console.log("Golden loadout & combat readiness report generated.");
