import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const edges = [
  ["P0", "selected", "builder-record-sheet", "Character Builder", "Character Record / Character Sheet", 4],
  ["P1", "queued", "sheet-play-mode", "Character Sheet", "Play Mode", 4],
  ["P1", "queued", "play-rest", "Play Mode", "Rest Runtime", 4],
  ["P1", "queued", "level-up-edit", "Level-Up Runtime", "Character Edit / Hydration", 4],
  ["P1", "queued", "catalog-runtime", "Catalogs", "Shared Runtime Engines", 4],
  ["P1", "queued", "storage-backup-restore", "Character Storage", "Backup / Restore / Migration", 4],
  ["P1", "queued", "ui-persistence", "Desktop / Mobile UI", "Storage / Reloaded Runtime", 4],
  ["P2", "monitor", "release-ci", "Certification", "Build / PWA / GitHub CI", 4],
].map(([priority, status, id, from, to, evidenceCount]) => ({ priority, status, id, from, to, evidenceCount }));

const evidencePaths = [
  "src/core/rulesets/playerJourneyIntegration.ts",
  "src/core/character/playerJourneyConsistency.ts",
  "src/core/character/sheetPlayModeConsistency.ts",
  "src/core/rulesets/restRecoveryCharacterAdapter.ts",
  "src/core/rulesets/levelUpCharacterAdapter.ts",
  "src/core/rulesets/runtimeCoverageCertification.ts",
  "src/core/storage/characterHydration.test.ts",
  "src/core/storage/safeStorage.ts",
  "src/features/backup/fullBackup.ts",
  "e2e/full-character-creation.spec.ts",
  "e2e/player-journey-integration.spec.ts",
  "e2e/rest-recovery-ui-v5.111D3.spec.ts",
  "e2e/level-up-runtime-ui-v5.114D3.spec.ts",
  "e2e/save-migration-data-safety.spec.ts",
  "e2e/mobile-and-storage.spec.ts",
  ".github/workflows/ci.yml",
];
const missingEvidence = [];
for (const path of evidencePaths) {
  try { await access(resolve(path)); } catch { missingEvidence.push(path); }
}
const certificationCommands = Object.keys(packageJson.scripts).filter((name) => name.startsWith("certify:"));
const report = {
  package: "v5.121A",
  version: packageJson.version,
  status: missingEvidence.length === 0 ? "READY_FOR_DIFFERENTIAL" : "BLOCKED",
  selectedEdge: "builder-record-sheet",
  nextPackage: "v5.121B",
  edgeCount: edges.length,
  priorities: { P0: 1, P1: 6, P2: 1 },
  evidencePathsChecked: evidencePaths.length,
  missingEvidence,
  certificationCommandCount: certificationCommands.length,
  edges,
  generatedAt: new Date().toISOString(),
};

await mkdir(resolve("certification-reports"), { recursive: true });
await writeFile(resolve("certification-reports/cross-domain-integrity-discovery-v5.121A.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(resolve("certification-reports/cross-domain-integrity-discovery-v5.121A.md"), [
  "# Cross-Domain Integrity Discovery v5.121A",
  "",
  `- Status: ${report.status}`,
  `- Version: ${report.version}`,
  `- Cross-domain edges: ${report.edgeCount}`,
  `- Evidence paths checked: ${report.evidencePathsChecked}`,
  `- Missing evidence: ${report.missingEvidence.length}`,
  `- Certification commands: ${report.certificationCommandCount}`,
  `- Selected P0 edge: ${report.selectedEdge}`,
  `- Next package: ${report.nextPackage}`,
  "",
  "## Edge map",
  "",
  ...report.edges.map((edge) => `- ${edge.priority} · ${edge.id} · ${edge.from} -> ${edge.to} · ${edge.status}`),
  "",
  "## v5.121B lock",
  "",
  "Build an independent edition-aware oracle and differential matrix for Builder -> Character Record -> Character Sheet, then expand the same snapshot contract across Play, Rest, Level-Up and persistence.",
  "",
].join("\n"));

console.log(`v5.121A discovery: ${report.edgeCount} edges, ${report.evidencePathsChecked} evidence paths, ${report.missingEvidence.length} missing.`);
console.log("Selected v5.121B target: Cross-Domain Differential and Reference Matrix.");
if (missingEvidence.length > 0) process.exitCode = 1;
