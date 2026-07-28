export type PlayerExperiencePriority = "P0" | "P1" | "P2";
export type PlayerExperienceStatus = "selected" | "queued" | "monitor";

export type PlayerExperienceDomain = {
  id: string;
  title: string;
  priority: PlayerExperiencePriority;
  status: PlayerExperienceStatus;
  playerQuestion: string;
  evidence: readonly string[];
  strengths: readonly string[];
  gaps: readonly string[];
  exitCriteria: readonly string[];
};

export const REMAINING_PLAYER_EXPERIENCE_DOMAINS: readonly PlayerExperienceDomain[] = [
  {
    id: "character-hub-actionability",
    title: "Character Hub Actionability and Return Journey",
    priority: "P0",
    status: "selected",
    playerQuestion: "Can I find the right character, understand its state and continue playing without hunting through the app?",
    evidence: [
      "src/features/dashboard/Dashboard.tsx",
      "src/features/characters/Characters.tsx",
      "src/features/characters/CharacterDetail.tsx",
      "src/shared/navigation/navItems.ts",
      "e2e/player-journey-integration.spec.ts",
    ],
    strengths: ["Character list, detail, play and level-up routes exist.", "Character sheet already exposes a table-ready command center."],
    gaps: [
      "Dashboard, character list and character detail do not share one canonical continue-playing decision model.",
      "Empty, damaged, level-ready and active-play characters are not ranked by one deterministic actionability contract.",
      "Desktop/mobile return journey has no single differential and E2E release gate.",
    ],
    exitCriteria: [
      "Canonical player actionability oracle",
      "Dashboard/list/detail differential matrix",
      "Golden character hub states",
      "Desktop/mobile physical continue journey",
    ],
  },
  {
    id: "navigation-search-discoverability",
    title: "Navigation and Search Discoverability",
    priority: "P1",
    status: "queued",
    playerQuestion: "Can I reach a rule, character or tool from the language I naturally use?",
    evidence: ["src/features/search/GlobalSearchPage.tsx", "src/features/search/globalSearchEngine.ts", "src/shared/navigation/navItems.ts", "src/shared/layout/AppFrame.tsx"],
    strengths: ["Global search and centralized navigation registry exist."],
    gaps: ["Aliases, empty-result recovery, route parity and keyboard/mobile discovery are not certified together."],
    exitCriteria: ["Search alias matrix", "Zero orphan player routes", "Keyboard/mobile navigation E2E"],
  },
  {
    id: "play-feedback-recovery",
    title: "Play Feedback, Undo and Recovery",
    priority: "P1",
    status: "queued",
    playerQuestion: "When I spend HP, slots or resources, can I see what changed and recover from a mistaken action?",
    evidence: ["src/features/play-mode/PlayMode.tsx", "src/features/rest/RestCenterPage.tsx", "src/core/rulesets/playerJourneyIntegration.ts", "src/core/storage/safeStorage.ts"],
    strengths: ["Play and rest mutations persist across reload."],
    gaps: ["Mutation feedback, destructive confirmation and undo/recovery policy are fragmented across panels."],
    exitCriteria: ["Canonical mutation receipt", "Undo/confirmation policy", "Reload-safe recovery matrix"],
  },
  {
    id: "builder-guidance-errors",
    title: "Builder Guidance and Error Recovery",
    priority: "P1",
    status: "queued",
    playerQuestion: "When character creation is incomplete, does the app tell me exactly what to fix and take me there?",
    evidence: ["src/features/builder/Builder.tsx", "src/core/rulesets/fullCharacterCertification.ts", "src/core/rulesets/playerJourneyIntegration.ts", "e2e/full-character-creation.spec.ts"],
    strengths: ["Builder has step validation and a review stage."],
    gaps: ["Cross-step error ordering, focus movement and resume-after-reload behavior lack one player-facing contract."],
    exitCriteria: ["Deterministic error priority", "Focus-to-first-error", "Draft resume matrix", "Desktop/mobile E2E"],
  },
  {
    id: "empty-error-offline-states",
    title: "Empty, Error and Offline States",
    priority: "P1",
    status: "queued",
    playerQuestion: "Does the app explain what happened and provide a useful next action when data is absent or unavailable?",
    evidence: ["src/shared/pwa/PwaInstallGuide.tsx", "src/core/storage/safeStorage.ts", "src/features/characters/Characters.tsx", "src/features/backup/DataBackup.tsx"],
    strengths: ["PWA, safe storage and backup tools exist."],
    gaps: ["Empty collections, corrupt storage, failed lazy loads and offline navigation do not share a certified recovery language."],
    exitCriteria: ["State taxonomy", "Recovery action contract", "Offline/corrupt-storage E2E"],
  },
  {
    id: "accessibility-language-consistency",
    title: "Accessibility and Language Consistency",
    priority: "P1",
    status: "queued",
    playerQuestion: "Can I operate the app with keyboard, mobile touch and assistive labels without mixed or unclear language?",
    evidence: ["src/shared/navigation/RouteAccessibility.tsx", "e2e/mobile-accessibility-performance.spec.ts", "src/features/help/HelpCenter.tsx", "src/shared/release/releaseNotes.ts"],
    strengths: ["Route focus handling and mobile accessibility tests exist."],
    gaps: ["Turkish/English copy, accessible names, focus order and reduced-motion behavior are not measured as one system."],
    exitCriteria: ["Language consistency audit", "Accessible-name inventory", "Focus/reduced-motion E2E"],
  },
  {
    id: "preferences-continuity",
    title: "Preferences and Session Continuity",
    priority: "P2",
    status: "monitor",
    playerQuestion: "Do my display, ruleset and table preferences survive reload, update and device-sized layouts?",
    evidence: ["src/features/settings/Settings.tsx", "src/core/storage/safeStorage.ts", "src/shared/pwa/PwaInstallGuide.tsx"],
    strengths: ["Settings and persistent storage foundations exist."],
    gaps: ["Preference schema, migration defaults and route-level application are not certified end to end."],
    exitCriteria: ["Versioned preference schema", "Migration/default matrix", "Reload continuity E2E"],
  },
  {
    id: "performance-perceived-speed",
    title: "Perceived Performance and Loading Feedback",
    priority: "P2",
    status: "monitor",
    playerQuestion: "Does every route feel responsive and explain loading instead of appearing broken?",
    evidence: ["vite.config.ts", "src/core/rulesets/rulesetLoader.ts", "src/main.tsx", "e2e/mobile-accessibility-performance.spec.ts"],
    strengths: ["Most feature routes are code split and PWA precache is generated."],
    gaps: ["The main chunk exceeds the warning budget and loading/error feedback is not measured by route."],
    exitCriteria: ["Route loading budget", "Main chunk budget", "Cold-load and cached-load report"],
  },
] as const;

export function buildRemainingPlayerExperienceDiscovery(version = "5.122.0") {
  const selected = REMAINING_PLAYER_EXPERIENCE_DOMAINS.filter((domain) => domain.status === "selected");
  const counts = {
    P0: REMAINING_PLAYER_EXPERIENCE_DOMAINS.filter((domain) => domain.priority === "P0").length,
    P1: REMAINING_PLAYER_EXPERIENCE_DOMAINS.filter((domain) => domain.priority === "P1").length,
    P2: REMAINING_PLAYER_EXPERIENCE_DOMAINS.filter((domain) => domain.priority === "P2").length,
  };
  const evidenceCount = new Set(REMAINING_PLAYER_EXPERIENCE_DOMAINS.flatMap((domain) => domain.evidence)).size;
  const blockers = REMAINING_PLAYER_EXPERIENCE_DOMAINS
    .filter((domain) => domain.priority !== "P2")
    .flatMap((domain) => domain.gaps.map((gap) => `${domain.id}: ${gap}`));

  return {
    package: "v5.122A",
    version,
    status: selected.length === 1 && blockers.length > 0 ? "READY_FOR_EXPERIENCE_MATRIX" : "BLOCKED",
    selectedDomain: selected[0]?.id ?? null,
    nextPackage: "v5.122B",
    domainCount: REMAINING_PLAYER_EXPERIENCE_DOMAINS.length,
    evidenceCount,
    counts,
    blockers,
    domains: REMAINING_PLAYER_EXPERIENCE_DOMAINS,
  } as const;
}
