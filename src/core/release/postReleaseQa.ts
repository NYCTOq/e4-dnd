export type QaScenarioStatus = "pass" | "warning" | "fail";

export type PlayerQaScenario = {
  id: string;
  label: string;
  status: QaScenarioStatus;
  detail?: string;
  critical?: boolean;
};

export type PostReleaseQaReport = {
  version: string;
  ready: boolean;
  score: number;
  passed: number;
  warnings: number;
  failed: number;
  blockers: string[];
  notes: string[];
  scenarios: PlayerQaScenario[];
};

export const REQUIRED_PLAYER_QA_SCENARIOS = [
  "2014-fighter-journey",
  "2014-cleric-journey",
  "2024-fighter-journey",
  "2024-wizard-journey",
  "multiclass-journey",
  "level-1-to-20",
  "spell-concentration-rest",
  "equipment-attunement",
  "backup-round-trip",
  "refresh-offline",
  "mobile-keyboard",
] as const;

export function buildPostReleaseQaReport(version: string, scenarios: PlayerQaScenario[]): PostReleaseQaReport {
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const normalized = REQUIRED_PLAYER_QA_SCENARIOS.map((id) => byId.get(id) ?? {
    id,
    label: id,
    status: "warning" as const,
    detail: "Senaryo sonucu henüz sağlanmadı.",
    critical: true,
  });
  const extras = scenarios.filter((scenario) => !REQUIRED_PLAYER_QA_SCENARIOS.includes(scenario.id as never));
  const all = [...normalized, ...extras];
  const blockers = all
    .filter((scenario) => scenario.status === "fail" && scenario.critical !== false)
    .map((scenario) => `${scenario.label}: ${scenario.detail ?? "Kritik oyuncu yolculuğu başarısız."}`);
  const notes = all
    .filter((scenario) => scenario.status === "warning" || (scenario.status === "fail" && scenario.critical === false))
    .map((scenario) => `${scenario.label}: ${scenario.detail ?? "İnceleme gerekiyor."}`);
  const passed = all.filter((scenario) => scenario.status === "pass").length;
  const warnings = all.filter((scenario) => scenario.status === "warning").length;
  const failed = all.filter((scenario) => scenario.status === "fail").length;
  const points = all.reduce((sum, scenario) => sum + (scenario.status === "pass" ? 1 : scenario.status === "warning" ? 0.5 : 0), 0);
  return {
    version,
    ready: blockers.length === 0,
    score: all.length ? Math.round((points / all.length) * 100) : 0,
    passed,
    warnings,
    failed,
    blockers,
    notes,
    scenarios: all,
  };
}

export function mergeQaScenarioResults(...groups: PlayerQaScenario[][]): PlayerQaScenario[] {
  const merged = new Map<string, PlayerQaScenario>();
  for (const scenario of groups.flat()) {
    const current = merged.get(scenario.id);
    if (!current || severity(scenario.status) > severity(current.status)) merged.set(scenario.id, scenario);
  }
  return [...merged.values()];
}

function severity(status: QaScenarioStatus): number {
  return status === "fail" ? 3 : status === "warning" ? 2 : 1;
}
