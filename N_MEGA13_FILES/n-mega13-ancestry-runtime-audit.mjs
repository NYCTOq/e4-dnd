import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const editions = ["dnd_2014", "dnd_2024"];
const recognized = [
  /hellish resistance/i,
  /celestial resistance/i,
  /dwarven resilience|stout resilience/i,
  /gnome cunning|gnomish cunning/i,
  /fleet of foot/i,
  /superior darkvision/i,
  /savage attacks/i,
  /dwarven toughness/i,
  /relentless endurance|luck|brave|fey ancestry|breath weapon|healing hands|adrenaline rush|large form|draconic flight/i,
];

const rows = [];
for (const edition of editions) {
  const file = path.join(root, "public", "data", edition, "races.json");
  const races = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const race of races) {
    const groups = [
      { owner: race.name, traits: race.traits ?? [] },
      ...(race.subraces ?? []).map((s) => ({ owner: `${race.name} / ${s.name}`, traits: s.traits ?? [] })),
    ];
    for (const group of groups) {
      for (const trait of group.traits) {
        rows.push({
          edition,
          owner: group.owner,
          trait,
          recognizedByAncestryRuntime: recognized.some((pattern) => pattern.test(trait)),
        });
      }
    }
  }
}

const unsupported = rows.filter((row) => !row.recognizedByAncestryRuntime);
const report = {
  generatedAt: new Date().toISOString(),
  note: "Unsupported here only means not interpreted by ancestryRuntimeRules.ts. Another builder or runtime module may still handle it.",
  totals: {
    traits: rows.length,
    recognizedByAncestryRuntime: rows.length - unsupported.length,
    notRecognizedByAncestryRuntime: unsupported.length,
  },
  unsupported,
};

const outDir = path.join(root, "certification-reports", "n-mega13");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "ANCESTRY_RUNTIME_COVERAGE_AUDIT.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`Ancestry audit written: ${outFile}`);
console.log(JSON.stringify(report.totals));
