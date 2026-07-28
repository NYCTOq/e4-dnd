export type CrossDomainPriority = "P0" | "P1" | "P2";
export type CrossDomainStatus = "selected" | "queued" | "monitor";

export type CrossDomainEdge = {
  id: string;
  title: string;
  from: string;
  to: string;
  priority: CrossDomainPriority;
  status: CrossDomainStatus;
  evidence: readonly string[];
  verifiedFields: readonly string[];
  gaps: readonly string[];
  exitCriteria: readonly string[];
};

export const CROSS_DOMAIN_EDGES: readonly CrossDomainEdge[] = [
  {
    id: "builder-record-sheet",
    title: "Character Builder to Record to Sheet",
    from: "Character Builder",
    to: "Character Record / Character Sheet",
    priority: "P0",
    status: "selected",
    evidence: [
      "src/core/rulesets/playerJourneyIntegration.ts",
      "src/core/character/playerJourneyConsistency.ts",
      "src/features/characters/CharacterDetail.tsx",
      "e2e/full-character-creation.spec.ts",
    ],
    verifiedFields: ["ruleset", "class/subclass", "ancestry", "background", "abilities", "proficiencies", "spells", "inventory"],
    gaps: [
      "Builder output and hydrated Character record are not compared by one edition-aware canonical snapshot.",
      "Character Sheet derived values are certified separately from the complete builder payload.",
    ],
    exitCriteria: ["2014/2024 independent oracle", "Builder-record-sheet differential matrix", "zero lost-field blockers"],
  },
  {
    id: "sheet-play-mode",
    title: "Character Sheet to Play Mode",
    from: "Character Sheet",
    to: "Play Mode",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/character/sheetPlayModeConsistency.ts",
      "src/core/rulesets/playerJourneyIntegration.ts",
      "src/features/play-mode/PlayMode.tsx",
      "e2e/player-journey-integration.spec.ts",
    ],
    verifiedFields: ["HP", "AC", "weapons", "resources", "spell slots", "conditions", "concentration", "active effects"],
    gaps: ["Sheet and Play Mode snapshots need one cross-domain blocker matrix across martial, caster and multiclass profiles."],
    exitCriteria: ["Golden sheet/play equality", "action/resource mutations remain persistent"],
  },
  {
    id: "play-rest",
    title: "Play Mode to Rest Recovery",
    from: "Play Mode",
    to: "Rest Runtime",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/rulesets/restRecoveryCharacterAdapter.ts",
      "src/core/rulesets/restRecoveryPersistenceBridge.ts",
      "src/features/rest/restAutomation.ts",
      "e2e/rest-recovery-ui-v5.111D3.spec.ts",
    ],
    verifiedFields: ["HP", "Hit Dice", "spell slots", "Pact Magic", "resources", "death saves", "exhaustion", "temporary effects"],
    gaps: ["Combat-spent state and post-rest hydrated state are not covered by one player-lifecycle scenario matrix."],
    exitCriteria: ["Short/long rest differential", "reload-safe post-rest state"],
  },
  {
    id: "level-up-edit",
    title: "Level-Up to Character Edit",
    from: "Level-Up Runtime",
    to: "Character Edit / Hydration",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/rulesets/levelUpCharacterAdapter.ts",
      "src/core/rulesets/levelUpPersistenceBridge.ts",
      "src/features/characters/LevelUpAssistant.tsx",
      "e2e/level-up-runtime-ui-v5.114D3.spec.ts",
    ],
    verifiedFields: ["levels", "multiclass", "subclass", "ASI/feat", "skills/tools", "spells", "resources", "HP/Hit Dice"],
    gaps: ["Pre-spent runtime resources must remain stable while new level-derived maxima and choices are introduced."],
    exitCriteria: ["Level-up/edit differential", "spent-state preservation", "JSON/storage equality"],
  },
  {
    id: "catalog-runtime",
    title: "Catalog to Runtime",
    from: "Class/Subclass/Feat/Spell/Item Catalogs",
    to: "Shared Runtime Engines",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/rulesets/runtimeCoverageCertification.ts",
      "src/core/rulesets/classSubclassRuntimeClosure.ts",
      "src/certification/integration/runtimeEntityPersistenceBridge.test.ts",
      "src/certification/integration/runtimeCoverageMissingClosure.test.ts",
    ],
    verifiedFields: ["class progression", "subclass features", "feat effects", "spell metadata", "item metadata", "granted spells"],
    gaps: ["Catalog closure and player lifecycle closure have not yet been asserted in the same scenarios."],
    exitCriteria: ["zero unresolved runtime references", "catalog selection reaches runtime and persistence"],
  },
  {
    id: "storage-backup-restore",
    title: "Storage to Backup and Restore",
    from: "Character Storage",
    to: "Backup / Restore / Migration",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/storage/characterHydration.test.ts",
      "src/features/backup/backupSafetyRuntime.ts",
      "src/features/backup/fullBackup.ts",
      "e2e/save-migration-data-safety.spec.ts",
    ],
    verifiedFields: ["identity", "ruleset", "multiclass", "resources", "slots", "conditions", "effects", "inventory"],
    gaps: ["Full player-runtime snapshots need versioned legacy and current-schema restore comparison."],
    exitCriteria: ["legacy/current round-trip matrix", "selective/full restore atomicity", "ID collision safety"],
  },
  {
    id: "ui-persistence",
    title: "UI Mutation to Persistence",
    from: "Desktop / Mobile UI",
    to: "Storage / Reloaded Runtime",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/storage/safeStorage.ts",
      "e2e/mobile-and-storage.spec.ts",
      "e2e/global-shell-overlay-safety-v5.116.spec.ts",
      "e2e/class-subclass-catalog-ui-v5.120D.spec.ts",
    ],
    verifiedFields: ["physical pointer", "keyboard", "local storage", "reload", "overlay", "mobile overflow"],
    gaps: ["A single E2E journey does not yet prove create, play, rest and reload across desktop and mobile projects."],
    exitCriteria: ["desktop/mobile lifecycle E2E", "physical interaction", "reload equality", "overlay/overflow safety"],
  },
  {
    id: "release-ci",
    title: "Certification to Release and CI",
    from: "Certification Commands",
    to: "Build / PWA / GitHub CI",
    priority: "P2",
    status: "monitor",
    evidence: ["package.json", ".github/workflows/ci.yml", "vite.config.ts", "playwright.config.ts"],
    verifiedFields: ["Vitest", "production build", "PWA", "Playwright", "reports"],
    gaps: ["Cross-domain commands and reports must be added to a deterministic release gate before final closure."],
    exitCriteria: ["repeatable CI command", "machine-readable report", "final release audit"],
  },
] as const;

export function buildCrossDomainIntegrityDiscovery(version = "5.121.0") {
  const selected = CROSS_DOMAIN_EDGES.filter((edge) => edge.status === "selected");
  const counts = {
    P0: CROSS_DOMAIN_EDGES.filter((edge) => edge.priority === "P0").length,
    P1: CROSS_DOMAIN_EDGES.filter((edge) => edge.priority === "P1").length,
    P2: CROSS_DOMAIN_EDGES.filter((edge) => edge.priority === "P2").length,
  };
  const evidenceCount = new Set(CROSS_DOMAIN_EDGES.flatMap((edge) => edge.evidence)).size;
  const blockers = CROSS_DOMAIN_EDGES
    .filter((edge) => edge.priority !== "P2")
    .flatMap((edge) => edge.gaps.map((gap) => `${edge.id}: ${gap}`));

  return {
    package: "v5.121A",
    version,
    status: selected.length === 1 && blockers.length > 0 ? "READY_FOR_DIFFERENTIAL" : "BLOCKED",
    selectedEdge: selected[0]?.id ?? null,
    nextPackage: "v5.121B",
    counts,
    edgeCount: CROSS_DOMAIN_EDGES.length,
    evidenceCount,
    blockers,
    edges: CROSS_DOMAIN_EDGES,
  } as const;
}
