export type DiscoveryPriority = "P0" | "P1" | "P2";
export type DiscoveryStatus = "selected" | "queued" | "monitor";

export type RemainingSystemDomain = {
  id: string;
  title: string;
  priority: DiscoveryPriority;
  status: DiscoveryStatus;
  evidence: readonly string[];
  gaps: readonly string[];
  exitCriteria: readonly string[];
};

export const REMAINING_SYSTEM_DOMAINS: readonly RemainingSystemDomain[] = [
  {
    id: "character-sheet-derived-stats",
    title: "Full Character Sheet Derived Stats Closure",
    priority: "P0",
    status: "selected",
    evidence: [
      "src/core/rulesets/characterSheetCertification.ts",
      "src/core/character/sheetPlayModeConsistency.ts",
      "src/certification/matrix/derivedStatsScenarioMatrix.ts",
      "src/features/characters/CharacterDetail.tsx",
    ],
    gaps: [
      "Tek bir canonical snapshot bütün derived stat formüllerini sahiplenmiyor.",
      "Sheet sertifikası bölüm varlığını ölçüyor; formül kaynağını ve UI görünürlüğünü birlikte kanıtlamıyor.",
      "Multiclass, equipment, ancestry ve effect birleşimleri golden karakterlerle kapanmalı.",
    ],
    exitCriteria: [
      "2014 ve 2024 canonical derived-stat oracle",
      "Multiclass ve equipment differential matrix",
      "Golden character persistence",
      "Character Detail ve Play Mode aynı değerleri gösterir",
      "Desktop/mobile fiziksel E2E",
    ],
  },
  {
    id: "runtime-coverage",
    title: "Feat, Spell, Item and Subclass Runtime Coverage",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/rulesets/runtimeCoverageCertification.ts",
      "src/core/rulesets/runtimeCoverageClosure.ts",
      "src/core/rulesets/spellCertificationExpansion.ts",
    ],
    gaps: [
      "Guided ve table-ruling girdileri sürüm bazında yeniden ölçülmeli.",
      "Missing girdiler release blocker olarak kalmalı.",
    ],
    exitCriteria: ["Sıfır missing runtime", "Guided/manual policy görünür ve testli"],
  },
  {
    id: "class-subclass-catalog",
    title: "Class and Subclass Catalog Integrity",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/rulesets/fullCharacterCertification.ts",
      "src/core/rulesets/subclassExpansion.ts",
      "src/core/rulesets/classSubclassRuntimeClosure.ts",
    ],
    gaps: ["Bütün katalog girdileri progression, runtime ve source policy üzerinden tekrar çaprazlanmalı."],
    exitCriteria: ["12 class iki edition'da eksiksiz", "Subclass checkpoint ve runtime referansları geçerli"],
  },
  {
    id: "level-one-to-twenty-journey",
    title: "Level 1–20 Player Journey",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/rulesets/playerJourneyIntegration.ts",
      "src/core/character/playerJourneyConsistency.ts",
      "e2e/level-one-to-twenty-advancement.spec.ts",
    ],
    gaps: ["Creation, advancement, rest, combat ve edit zinciri golden karakterler üzerinde tek closure kapısında birleşmeli."],
    exitCriteria: ["2014/2024 single ve multiclass journey GREEN", "Kayıtlar reload sonrası aynı"],
  },
  {
    id: "backup-migration",
    title: "Backup, Restore and Migration Safety",
    priority: "P1",
    status: "queued",
    evidence: [
      "src/core/character/characterIntegrity.ts",
      "e2e/save-migration-data-safety.spec.ts",
      "src/features/backup",
    ],
    gaps: ["Eski sürüm fixture'ları ile son character schema arasında final migration matrisi gerekli."],
    exitCriteria: ["Legacy fixture kayıpsız hydrate olur", "Selective/full restore atomik kalır"],
  },
  {
    id: "mobile-pwa-accessibility",
    title: "Mobile, PWA and Accessibility",
    priority: "P2",
    status: "monitor",
    evidence: [
      "e2e/mobile-accessibility-performance.spec.ts",
      "src/shared/pwa/PwaInstallGuide.tsx",
      "src/shared/navigation/RouteAccessibility.tsx",
    ],
    gaps: ["Yeni closure UI'ları mobil pointer, focus ve offline koşullarında tekrar sertifikalanmalı."],
    exitCriteria: ["Mobile Chromium GREEN", "Focus/pointer/offline smoke GREEN"],
  },
  {
    id: "performance",
    title: "Bundle and Runtime Performance",
    priority: "P2",
    status: "monitor",
    evidence: ["vite.config.ts", "src/core/rulesets/rulesetLoader.ts", "src/main.tsx"],
    gaps: ["Ana bundle 500 kB eşiğini aşıyor; closure sonrasında route/data split yeniden ölçülmeli."],
    exitCriteria: ["Ana chunk bütçesi tanımlı", "Cold-load ve PWA cache raporu üretilir"],
  },
  {
    id: "campaign-dm-tools",
    title: "Campaign and DM Tools",
    priority: "P2",
    status: "monitor",
    evidence: [
      "src/features/campaigns",
      "src/features/session-planner",
      "src/features/combat-tracker",
    ],
    gaps: ["Çekirdek oyuncu closure'ları tamamlanmadan genişletilmemeli."],
    exitCriteria: ["Player core final gate GREEN olduktan sonra yeniden önceliklendirilir"],
  },
] as const;

export function buildRemainingSystemDiscovery(version = "5.118.0") {
  const selected = REMAINING_SYSTEM_DOMAINS.filter((domain) => domain.status === "selected");
  const counts = {
    P0: REMAINING_SYSTEM_DOMAINS.filter((domain) => domain.priority === "P0").length,
    P1: REMAINING_SYSTEM_DOMAINS.filter((domain) => domain.priority === "P1").length,
    P2: REMAINING_SYSTEM_DOMAINS.filter((domain) => domain.priority === "P2").length,
  };
  const blockers = REMAINING_SYSTEM_DOMAINS
    .filter((domain) => domain.priority === "P0")
    .flatMap((domain) => domain.gaps.map((gap) => `${domain.title}: ${gap}`));

  return {
    package: "v5.118A",
    version,
    status: selected.length === 1 && blockers.length > 0 ? "READY_FOR_CLOSURE" : "BLOCKED",
    selectedDomain: selected[0]?.id ?? null,
    nextPackage: "v5.118B",
    counts,
    blockers,
    domains: REMAINING_SYSTEM_DOMAINS,
  } as const;
}
