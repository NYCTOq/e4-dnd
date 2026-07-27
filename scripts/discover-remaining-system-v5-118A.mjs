import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const editions = ["dnd_2014", "dnd_2024"];
const catalogs = {};

for (const edition of editions) {
  catalogs[edition] = {};
  for (const name of ["classes", "subclasses", "races", "backgrounds", "feats", "spells", "items", "monsters"]) {
    const entries = JSON.parse(await readFile(resolve(`public/data/${edition}/${name}.json`), "utf8"));
    catalogs[edition][name] = entries.length;
  }
}

const domains = [
  ["P0", "Full Character Sheet Derived Stats Closure", "v5.118B"],
  ["P1", "Feat, Spell, Item and Subclass Runtime Coverage", "queued"],
  ["P1", "Class and Subclass Catalog Integrity", "queued"],
  ["P1", "Level 1–20 Player Journey", "queued"],
  ["P1", "Backup, Restore and Migration Safety", "queued"],
  ["P2", "Mobile, PWA and Accessibility", "monitor"],
  ["P2", "Bundle and Runtime Performance", "monitor"],
  ["P2", "Campaign and DM Tools", "monitor"],
];

const report = {
  package: "v5.118A",
  version: packageJson.version,
  status: "READY_FOR_CLOSURE",
  selectedDomain: "character-sheet-derived-stats",
  nextPackage: "v5.118B",
  catalogCounts: catalogs,
  certificationCommands: Object.keys(packageJson.scripts).filter((name) => name.startsWith("certify:")).length,
  domains: domains.map(([priority, title, disposition]) => ({ priority, title, disposition })),
  generatedAt: new Date().toISOString(),
};

await mkdir(resolve("certification-reports"), { recursive: true });
await writeFile(
  resolve("certification-reports/remaining-system-discovery-v5.118A.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
await writeFile(
  resolve("certification-reports/remaining-system-discovery-v5.118A.md"),
  [
    "# Remaining System Discovery v5.118A",
    "",
    `- Status: ${report.status}`,
    `- Version: ${report.version}`,
    `- Domains: ${report.domains.length}`,
    `- Certification commands: ${report.certificationCommands}`,
    `- Selected next closure: ${report.selectedDomain}`,
    `- Next package: ${report.nextPackage}`,
    "",
    "## Priority map",
    "",
    ...report.domains.map((domain) => `- ${domain.priority} · ${domain.title} · ${domain.disposition}`),
    "",
  ].join("\n"),
);

console.log(`v5.118A discovery: ${report.domains.length} domains, ${report.certificationCommands} certification commands.`);
console.log("Selected v5.118B target: Full Character Sheet Derived Stats Closure.");
