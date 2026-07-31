import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const report = {
  generatedAt: new Date().toISOString(),
  package: "N-MEGA14",
  coverage: {
    spellcasting: [
      "primary class spellcasting ability inference",
      "spellSources based multiclass ability inference",
      "explicit ability override compatibility",
    ],
    ancestry: [
      "selected Dragonborn and Tiefling resistance",
      "selected lineage spell progression",
      "2014 Dwarf weapon and tool proficiency contract",
      "fixed ancestry skills",
      "trait based saves, resistance, darkvision and HP",
    ],
  },
  manualFollowUp: [
    "Wire toolChoiceOptions to a required 2014 Dwarf builder choice.",
    "Use getSpellSaveDcForSpell/getSpellAttackBonusForSpell on spell-specific multiclass UI.",
    "Add UI controls for active Aasimar and Goliath ancestry actions where not already present.",
  ],
};

const outDir = path.join(root, "certification-reports", "n-mega14");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "N_MEGA14_ANCESTRY_SPELLCASTING_CLOSURE.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
console.log("N-MEGA14 report generated.");
