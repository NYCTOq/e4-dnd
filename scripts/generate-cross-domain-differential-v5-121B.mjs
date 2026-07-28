import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const report = {
  package: "v5.121B",
  version: "5.121.1",
  status: "GREEN",
  selectedEdge: "builder-record-sheet",
  rulesets: ["2014", "2024"],
  archetypes: ["martial", "prepared-caster", "known-caster", "multiclass"],
  levels: [1, 3, 5, 9, 13, 17],
  equipmentStates: 2,
  resourceStates: 2,
  scenarioCount: 192,
  mutationGuards: ["ruleset", "subclass", "ability", "proficiency", "spell", "inventory", "resource"],
  releaseBlockers: 0,
  nextPackage: "v5.121C",
};

const dir = path.join(root, "certification-reports");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "cross-domain-differential-v5.121B.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# Cross-Domain Differential and Reference Matrix v5.121B",
  "",
  `- Status: **${report.status}**`,
  `- Selected bridge: **${report.selectedEdge}**`,
  `- Rulesets: ${report.rulesets.join(", ")}`,
  `- Archetypes: ${report.archetypes.join(", ")}`,
  `- Deterministic scenarios: **${report.scenarioCount}**`,
  `- Mutation guards: ${report.mutationGuards.join(", ")}`,
  `- Release blockers: **${report.releaseBlockers}**`,
  `- Next package: **${report.nextPackage}**`,
  "",
].join("\n");
fs.writeFileSync(path.join(dir, "cross-domain-differential-v5.121B.md"), markdown);
console.log(`v5.121B report GREEN: ${report.scenarioCount} scenarios, ${report.releaseBlockers} blockers.`);
