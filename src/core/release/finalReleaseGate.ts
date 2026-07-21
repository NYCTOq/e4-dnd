export type FinalGateStatus = "pass" | "warning" | "fail";

export type FinalGateEvidence = {
  unitTests: FinalGateStatus;
  productionBuild: FinalGateStatus;
  lint: FinalGateStatus;
  browserE2e: FinalGateStatus;
  backupRoundTrip: FinalGateStatus;
  offlineRefresh: FinalGateStatus;
  mobileNavigation: FinalGateStatus;
  characterJourney: FinalGateStatus;
  unresolvedCrashes?: number;
  migrationFailures?: number;
};

export type FinalReleaseGateReport = {
  version: string;
  ready: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  checks: Array<{ id: keyof Omit<FinalGateEvidence, "unresolvedCrashes" | "migrationFailures">; status: FinalGateStatus }>;
};

const LABELS: Record<keyof Omit<FinalGateEvidence, "unresolvedCrashes" | "migrationFailures">, string> = {
  unitTests: "Unit/integration testleri",
  productionBuild: "Production/PWA build",
  lint: "Statik analiz",
  browserE2e: "Browser E2E",
  backupRoundTrip: "Yedek dışa/içe aktarma",
  offlineRefresh: "Yenileme ve offline açılış",
  mobileNavigation: "Mobil navigasyon",
  characterJourney: "Builder → Sheet → Play oyuncu yolculuğu",
};

export function buildFinalReleaseGate(version: string, evidence: FinalGateEvidence): FinalReleaseGateReport {
  const entries = (Object.keys(LABELS) as Array<keyof typeof LABELS>).map((id) => ({ id, status: evidence[id] }));
  const blockers = entries.filter((entry) => entry.status === "fail").map((entry) => `${LABELS[entry.id]} başarısız.`);
  const warnings = entries.filter((entry) => entry.status === "warning").map((entry) => `${LABELS[entry.id]} doğrulanmayı bekliyor.`);

  const crashCount = Math.max(0, evidence.unresolvedCrashes ?? 0);
  const migrationCount = Math.max(0, evidence.migrationFailures ?? 0);
  if (crashCount > 0) blockers.push(`${crashCount} çözülmemiş crash kaydı var.`);
  if (migrationCount > 0) blockers.push(`${migrationCount} migration hatası var.`);

  const points = entries.reduce((sum, entry) => sum + (entry.status === "pass" ? 1 : entry.status === "warning" ? 0.5 : 0), 0);
  return {
    version,
    ready: blockers.length === 0,
    score: Math.round((points / entries.length) * 100),
    blockers,
    warnings,
    checks: entries,
  };
}
