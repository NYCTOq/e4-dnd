import type { RecoveryRecord } from "../storage/safeStorage";
import type { E4FullBackup } from "../../features/backup/fullBackup";
import { FULL_BACKUP_VERSION, parseFullBackup } from "../../features/backup/fullBackup";

export type HardeningStatus = "pass" | "warning" | "fail";
export type HardeningCheck = {
  id: string;
  label: string;
  status: HardeningStatus;
  detail: string;
};

export type StableReleaseHardeningReport = {
  version: string;
  ready: boolean;
  score: number;
  checks: HardeningCheck[];
  blockers: string[];
  warnings: string[];
};

export type ReleaseGateInput = {
  appVersion: string;
  recoveryRecords?: RecoveryRecord[];
  backupCandidate?: unknown;
  migrationFailures?: string[];
  crashCount?: number;
  unitTestsPassed?: boolean;
  productionBuildPassed?: boolean;
  browserE2ePassed?: boolean | null;
};

export function inspectBackupCandidate(candidate: unknown): HardeningCheck {
  if (candidate === undefined) {
    return { id: "backup", label: "Backup restore", status: "warning", detail: "Doğrulanacak yedek örneği sağlanmadı." };
  }
  try {
    const parsed = parseFullBackup(candidate);
    const migration = parsed.version < FULL_BACKUP_VERSION ? `v${parsed.version} → v${FULL_BACKUP_VERSION} migration` : `v${parsed.version} current format`;
    return { id: "backup", label: "Backup restore", status: "pass", detail: `${migration}; ${parsed.data.characters.length} karakter hydrate edildi.` };
  } catch (error) {
    return { id: "backup", label: "Backup restore", status: "fail", detail: error instanceof Error ? error.message : "Yedek doğrulanamadı." };
  }
}

export function createRollbackBackup(backup: E4FullBackup): E4FullBackup {
  return {
    ...backup,
    exportedAt: new Date().toISOString(),
    data: {
      ...backup.data,
      characters: backup.data.characters.map((character) => ({ ...character })),
      campaigns: backup.data.campaigns.map((campaign) => ({ ...campaign })),
      homebrewSpells: backup.data.homebrewSpells.map((spell) => ({ ...spell })),
      homebrewItems: backup.data.homebrewItems.map((item) => ({ ...item })),
      homebrewMonsters: backup.data.homebrewMonsters.map((monster) => ({ ...monster })),
      favoriteMonsterIds: [...backup.data.favoriteMonsterIds],
      appSettings: { ...backup.data.appSettings },
    },
  };
}

export function buildStableReleaseHardeningReport(input: ReleaseGateInput): StableReleaseHardeningReport {
  const recoveryCount = input.recoveryRecords?.length ?? 0;
  const migrations = input.migrationFailures ?? [];
  const crashes = Math.max(0, input.crashCount ?? 0);
  const checks: HardeningCheck[] = [
    {
      id: "unit-tests",
      label: "Unit/integration test gate",
      status: input.unitTestsPassed === false ? "fail" : input.unitTestsPassed ? "pass" : "warning",
      detail: input.unitTestsPassed === false ? "Test zinciri başarısız." : input.unitTestsPassed ? "Test zinciri başarılı." : "Test sonucu bildirilmedi.",
    },
    {
      id: "production-build",
      label: "Production build gate",
      status: input.productionBuildPassed === false ? "fail" : input.productionBuildPassed ? "pass" : "warning",
      detail: input.productionBuildPassed === false ? "Production/PWA build başarısız." : input.productionBuildPassed ? "Production/PWA build başarılı." : "Build sonucu bildirilmedi.",
    },
    {
      id: "browser-e2e",
      label: "Browser E2E gate",
      status: input.browserE2ePassed === false ? "fail" : input.browserE2ePassed ? "pass" : "warning",
      detail: input.browserE2ePassed === false ? "Browser yolculuğu başarısız." : input.browserE2ePassed ? "Browser yolculuğu başarılı." : "Yerel browser koşusu bekleniyor.",
    },
    inspectBackupCandidate(input.backupCandidate),
    {
      id: "migration",
      label: "Migration gate",
      status: migrations.length ? "fail" : "pass",
      detail: migrations.length ? `${migrations.length} migration hatası: ${migrations.slice(0, 3).join("; ")}` : "Bilinen migration blocker'ı yok.",
    },
    {
      id: "crash-recovery",
      label: "Crash recovery",
      status: crashes > 0 ? "fail" : recoveryCount > 0 ? "warning" : "pass",
      detail: crashes > 0 ? `${crashes} çözülmemiş crash kaydı var.` : recoveryCount > 0 ? `${recoveryCount} karantina kaydı incelenmeli.` : "Çözülmemiş crash veya recovery kaydı yok.",
    },
  ];
  const points = checks.reduce((sum, check) => sum + (check.status === "pass" ? 1 : check.status === "warning" ? 0.5 : 0), 0);
  const blockers = checks.filter((check) => check.status === "fail").map((check) => `${check.label}: ${check.detail}`);
  const warnings = checks.filter((check) => check.status === "warning").map((check) => `${check.label}: ${check.detail}`);
  return { version: input.appVersion, ready: blockers.length === 0, score: Math.round((points / checks.length) * 100), checks, blockers, warnings };
}
