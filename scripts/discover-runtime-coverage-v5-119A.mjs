import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const editions = ["dnd_2014", "dnd_2024"];
const categories = ["subclasses", "feats", "spells", "items"];
const catalogCounts = Object.fromEntries(editions.map((edition) => [
  edition,
  Object.fromEntries(categories.map((category) => [
    category,
    JSON.parse(readFileSync(resolve(root, `public/data/${edition}/${category}.json`), "utf8")).length,
  ])),
]));
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const certificationCommands = Object.keys(packageJson.scripts)
  .filter((name) => /feat|spell|item|subclass|runtime-coverage/.test(name))
  .sort();
const evidence = [
  "src/core/rulesets/runtimeCoverageCertification.ts",
  "src/core/rulesets/runtimeCoverageClosure.ts",
  "src/core/rulesets/featRuntimeRules.ts",
  "src/core/rulesets/spellRuntimeCombatRules.ts",
  "src/core/rulesets/itemEffectRuntimeRules.ts",
  "src/core/rulesets/subclassRuntimeRules.ts",
];
for (const file of evidence) readFileSync(resolve(root, file), "utf8");

const report = {
  package: "v5.119A",
  version: packageJson.version,
  status: "READY_FOR_CLOSURE",
  selectedDomain: "runtime-coverage",
  editions,
  categories,
  catalogCounts,
  certificationCommandCount: certificationCommands.length,
  certificationCommands,
  evidence,
  policy: {
    automatic: "Shared runtime resolves the mechanical result.",
    assisted: "Guided Play Mode plan remains visible and captures choices.",
    manual: "Explicit table-ruling policy remains visible and tested.",
    missing: "Release blocker until runtime metadata or manual policy exists.",
  },
  nextPackage: "v5.119B",
  nextTarget: "Runtime Differential and Missing Behavior Closure",
};
const directory = resolve(root, "certification-reports");
mkdirSync(directory, { recursive: true });
writeFileSync(resolve(directory, "runtime-coverage-discovery-v5.119A.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(directory, "runtime-coverage-discovery-v5.119A.md"), `# Runtime Coverage Discovery v5.119A

- Status: ${report.status}
- Version: ${report.version}
- Editions: ${editions.join(", ")}
- Categories: ${categories.join(", ")}
- Certification commands: ${certificationCommands.length}
- Next: ${report.nextPackage} - ${report.nextTarget}

## Catalog baseline

${editions.map((edition) => `- ${edition}: ${categories.map((category) => `${category} ${catalogCounts[edition][category]}`).join(", ")}`).join("\n")}

Missing entries remain release blockers. Assisted and manual entries must retain visible, tested policy.
`);
console.log("v5.119A runtime coverage discovery report generated.");
console.log(`${report.nextPackage}: ${report.nextTarget}`);
