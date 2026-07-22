import { FULL_BACKUP_VERSION } from "./fullBackup";

export type BackupSafetyIssue = {
  code: string;
  severity: "blocker" | "warning" | "notice";
  message: string;
};

export type BackupSafetyReport = {
  safeToImport: boolean;
  repaired: boolean;
  sourceVersion: number | null;
  issues: BackupSafetyIssue[];
  repairedValue: unknown;
  duplicateCounts: Record<string, number>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dedupeById(values: unknown[]): { values: unknown[]; duplicates: number } {
  const seen = new Set<string>();
  const output: unknown[] = [];
  let duplicates = 0;

  for (const value of values) {
    if (!isRecord(value) || typeof value.id !== "string" || value.id.trim() === "") {
      output.push(value);
      continue;
    }
    const id = value.id.trim();
    if (seen.has(id)) {
      duplicates += 1;
      continue;
    }
    seen.add(id);
    output.push({ ...value, id });
  }

  return { values: output, duplicates };
}

function dedupeStrings(values: unknown[]): { values: unknown[]; duplicates: number } {
  const seen = new Set<string>();
  const output: string[] = [];
  let duplicates = 0;

  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = value.trim();
    if (!normalized) continue;
    if (seen.has(normalized)) {
      duplicates += 1;
      continue;
    }
    seen.add(normalized);
    output.push(normalized);
  }

  return { values: output, duplicates };
}

const RECORD_LISTS = [
  "characters",
  "campaigns",
  "homebrewSpells",
  "homebrewItems",
  "homebrewMonsters",
] as const;

export function inspectAndRepairFullBackup(value: unknown): BackupSafetyReport {
  const issues: BackupSafetyIssue[] = [];
  const duplicateCounts: Record<string, number> = {};

  if (!isRecord(value)) {
    return {
      safeToImport: false,
      repaired: false,
      sourceVersion: null,
      issues: [{ code: "invalid-root", severity: "blocker", message: "Yedek kökü bir JSON nesnesi değil." }],
      repairedValue: value,
      duplicateCounts,
    };
  }

  if (value.format !== "e4-dnd-full-backup") {
    issues.push({ code: "invalid-format", severity: "blocker", message: "Dosya E4 D&D tam yedek biçiminde değil." });
  }

  const sourceVersion = Number.isInteger(value.version) ? (value.version as number) : null;
  if (sourceVersion === null || sourceVersion < 1) {
    issues.push({ code: "invalid-version", severity: "blocker", message: "Yedek sürüm bilgisi geçersiz." });
  } else if (sourceVersion > FULL_BACKUP_VERSION) {
    issues.push({ code: "future-version", severity: "blocker", message: `Yedek sürümü (${sourceVersion}) uygulamanın desteklediği sürümden (${FULL_BACKUP_VERSION}) daha yeni.` });
  } else if (sourceVersion < FULL_BACKUP_VERSION) {
    issues.push({ code: "migration-needed", severity: "notice", message: `Eski yedek sürümü ${sourceVersion}, içe aktarılırken v${FULL_BACKUP_VERSION} yapısına taşınacak.` });
  }

  if (!isRecord(value.data)) {
    issues.push({ code: "missing-data", severity: "blocker", message: "Yedek veri bölümü bulunamadı." });
    return {
      safeToImport: false,
      repaired: false,
      sourceVersion,
      issues,
      repairedValue: value,
      duplicateCounts,
    };
  }

  const nextData: Record<string, unknown> = { ...value.data };
  let repaired = false;

  for (const key of RECORD_LISTS) {
    const current = nextData[key];
    if (!Array.isArray(current)) {
      issues.push({ code: `missing-${key}`, severity: "blocker", message: `${key} listesi eksik veya geçersiz.` });
      continue;
    }
    const result = dedupeById(current);
    nextData[key] = result.values;
    duplicateCounts[key] = result.duplicates;
    if (result.duplicates > 0) {
      repaired = true;
      issues.push({ code: `duplicate-${key}`, severity: "warning", message: `${key} içinde ${result.duplicates} yinelenen ID güvenli biçimde temizlendi.` });
    }
  }

  const favoriteIds = nextData.favoriteMonsterIds;
  if (!Array.isArray(favoriteIds)) {
    issues.push({ code: "missing-favorites", severity: "blocker", message: "favoriteMonsterIds listesi eksik veya geçersiz." });
  } else {
    const result = dedupeStrings(favoriteIds);
    nextData.favoriteMonsterIds = result.values;
    duplicateCounts.favoriteMonsterIds = result.duplicates;
    if (result.duplicates > 0 || result.values.length !== favoriteIds.length) {
      repaired = true;
      issues.push({ code: "duplicate-favorites", severity: "warning", message: "Favori canavar listesi temizlendi ve yinelenen kayıtlar kaldırıldı." });
    }
  }

  if (!isRecord(nextData.appSettings)) {
    nextData.appSettings = {};
    repaired = true;
    issues.push({ code: "settings-defaulted", severity: "notice", message: "Eksik uygulama ayarları güvenli varsayılanlarla tamamlanacak." });
  }

  const repairedValue = { ...value, data: nextData };
  const safeToImport = !issues.some((issue) => issue.severity === "blocker");

  if (safeToImport && issues.length === 0) {
    issues.push({ code: "clean", severity: "notice", message: "Yedek yapısı temiz ve doğrudan içe aktarılabilir." });
  }

  return { safeToImport, repaired, sourceVersion, issues, repairedValue, duplicateCounts };
}
