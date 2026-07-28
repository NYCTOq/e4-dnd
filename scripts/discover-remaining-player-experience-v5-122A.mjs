import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const domains = [
  ["P0", "selected", "character-hub-actionability", 5],
  ["P1", "queued", "navigation-search-discoverability", 4],
  ["P1", "queued", "play-feedback-recovery", 4],
  ["P1", "queued", "builder-guidance-errors", 4],
  ["P1", "queued", "empty-error-offline-states", 4],
  ["P1", "queued", "accessibility-language-consistency", 4],
  ["P2", "monitor", "preferences-continuity", 3],
  ["P2", "monitor", "performance-perceived-speed", 4],
].map(([priority, status, id, evidenceCount]) => ({ priority, status, id, evidenceCount }));
const evidencePaths = [
  "src/features/dashboard/Dashboard.tsx",
  "src/features/characters/Characters.tsx",
  "src/features/characters/CharacterDetail.tsx",
  "src/shared/navigation/navItems.ts",
  "src/features/search/GlobalSearchPage.tsx",
  "src/features/search/globalSearchEngine.ts",
  "src/shared/layout/AppFrame.tsx",
  "src/features/play-mode/PlayMode.tsx",
  "src/features/rest/RestCenterPage.tsx",
  "src/features/builder/Builder.tsx",
  "src/core/rulesets/fullCharacterCertification.ts",
  "src/shared/pwa/PwaInstallGuide.tsx",
  "src/core/storage/safeStorage.ts",
  "src/features/backup/DataBackup.tsx",
  "src/shared/navigation/RouteAccessibility.tsx",
  "src/features/help/HelpCenter.tsx",
  "src/features/settings/Settings.tsx",
  "src/core/rulesets/rulesetLoader.ts",
  "e2e/player-journey-integration.spec.ts",
  "e2e/full-character-creation.spec.ts",
  "e2e/mobile-accessibility-performance.spec.ts",
  "vite.config.ts",
];
const missingEvidence = [];
for (const path of evidencePaths) { try { await access(resolve(path)); } catch { missingEvidence.push(path); } }
const report = {
  package: "v5.122A",
  version: packageJson.version,
  status: missingEvidence.length === 0 ? "READY_FOR_EXPERIENCE_MATRIX" : "BLOCKED",
  selectedDomain: "character-hub-actionability",
  nextPackage: "v5.122B",
  domainCount: domains.length,
  priorities: { P0: 1, P1: 5, P2: 2 },
  evidencePathsChecked: evidencePaths.length,
  missingEvidence,
  domains,
  generatedAt: new Date().toISOString(),
};
await mkdir(resolve("certification-reports"), { recursive: true });
await writeFile(resolve("certification-reports/remaining-player-experience-discovery-v5.122A.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(resolve("certification-reports/remaining-player-experience-discovery-v5.122A.md"), [
  "# Remaining Player Experience Discovery v5.122A", "",
  `- Status: ${report.status}`,
  `- Version: ${report.version}`,
  `- Player-facing domains: ${report.domainCount}`,
  `- Evidence paths checked: ${report.evidencePathsChecked}`,
  `- Missing evidence: ${report.missingEvidence.length}`,
  `- Selected P0 domain: ${report.selectedDomain}`,
  `- Next package: ${report.nextPackage}`, "",
  "## Priority map", "",
  ...report.domains.map((domain) => `- ${domain.priority} · ${domain.id} · ${domain.status}`), "",
  "## v5.122B lock", "",
  "Build an independent character-actionability oracle and a Dashboard -> Character List -> Character Detail differential/navigation matrix for empty, damaged, level-ready and active-play character states.", "",
].join("\n"));
console.log(`v5.122A discovery: ${report.domainCount} domains, ${report.evidencePathsChecked} evidence paths, ${report.missingEvidence.length} missing.`);
console.log("Selected v5.122B target: Character Hub Actionability Differential and Navigation Matrix.");
if (missingEvidence.length > 0) process.exitCode = 1;
