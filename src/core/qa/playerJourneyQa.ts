export type PlayerJourneyQaScenarioId = "dashboard-smoke" | "route-smoke" | "keyboard-navigation" | "mobile-navigation" | "storage-refresh" | "offline-shell" | "backup-round-trip";
export type PlayerJourneyQaScenario = { id: PlayerJourneyQaScenarioId; title: string; layer: "browser" | "mobile" | "pwa" | "data"; critical: boolean };
export const PLAYER_JOURNEY_QA_SCENARIOS: readonly PlayerJourneyQaScenario[] = [
  { id: "dashboard-smoke", title: "Dashboard opens without an application error", layer: "browser", critical: true },
  { id: "route-smoke", title: "Core player routes render through direct navigation", layer: "browser", critical: true },
  { id: "keyboard-navigation", title: "Skip link and primary navigation work with keyboard only", layer: "browser", critical: true },
  { id: "mobile-navigation", title: "Mobile bottom navigation remains reachable and usable", layer: "mobile", critical: true },
  { id: "storage-refresh", title: "Local character data survives a browser refresh", layer: "data", critical: true },
  { id: "offline-shell", title: "Built PWA shell remains available after network loss", layer: "pwa", critical: true },
  { id: "backup-round-trip", title: "Backup export and import preserve player data", layer: "data", critical: true },
] as const;
export function getQaScenario(id: PlayerJourneyQaScenarioId) { const scenario = PLAYER_JOURNEY_QA_SCENARIOS.find((item) => item.id === id); if (!scenario) throw new Error(`Unknown player journey QA scenario: ${id}`); return scenario; }
export function summarizeQaCoverage(completed: readonly PlayerJourneyQaScenarioId[]) { const done = new Set(completed); const missing = PLAYER_JOURNEY_QA_SCENARIOS.filter((item) => !done.has(item.id)); return { total: PLAYER_JOURNEY_QA_SCENARIOS.length, completed: PLAYER_JOURNEY_QA_SCENARIOS.length - missing.length, missing, ready: missing.filter((item) => item.critical).length === 0 }; }
