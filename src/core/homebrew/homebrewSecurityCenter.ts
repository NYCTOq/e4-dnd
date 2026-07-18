import type { HomebrewPackage } from "./homebrewFoundation";
import type { HomebrewLibraryPreference } from "./homebrewMarketplaceLibrary";
import {
  createHomebrewSecurityEvent,
  evaluateHomebrewMarketplaceSync,
  markHomebrewMarketplaceSourceSyncFailed,
  markHomebrewMarketplaceSourceSynced,
  type HomebrewMarketplaceRevocationList,
  type HomebrewMarketplaceSecurityEvent,
} from "./homebrewMarketplaceSecurity";
import type { HomebrewMarketplaceSource } from "./homebrewMarketplaceTrust";

export type HomebrewQuarantineRecord = {
  id: string;
  packageId: string;
  packageName: string;
  version: string;
  sourceId: string;
  reason: string;
  quarantinedAt: string;
  package: HomebrewPackage;
};

export type HomebrewSecurityCenterReport = {
  safePackages: HomebrewPackage[];
  preferences: HomebrewLibraryPreference[];
  quarantines: HomebrewQuarantineRecord[];
  blockers: string[];
  warnings: string[];
  readinessScore: number;
};

export type HomebrewAutomaticSyncResult = {
  sources: HomebrewMarketplaceSource[];
  downloaded: Array<{ sourceId: string; raw: string }>;
  events: HomebrewMarketplaceSecurityEvent[];
  blockers: string[];
  warnings: string[];
};

function revokedMatch(pkg: HomebrewPackage, lists: HomebrewMarketplaceRevocationList[]) {
  for (const list of lists) {
    const entry = list.revokedPackages.find((item) => item.packageId === pkg.id && (!item.version || item.version === pkg.version));
    if (entry) return { sourceId: list.sourceId, reason: entry.reason };
  }
  return null;
}

export function scanAndQuarantineHomebrewPackages(
  packages: HomebrewPackage[],
  preferences: HomebrewLibraryPreference[],
  revocations: HomebrewMarketplaceRevocationList[],
  existing: HomebrewQuarantineRecord[] = [],
  now = new Date().toISOString(),
): HomebrewSecurityCenterReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const quarantines = [...existing];
  const safePackages: HomebrewPackage[] = [];
  const quarantinedIds = new Set(existing.map((item) => `${item.packageId}@${item.version}`));

  for (const pkg of packages) {
    const match = revokedMatch(pkg, revocations);
    if (!match) {
      safePackages.push(pkg);
      continue;
    }
    const key = `${pkg.id}@${pkg.version}`;
    if (!quarantinedIds.has(key)) {
      quarantines.push({
        id: `${pkg.id}@${pkg.version}:${now}`,
        packageId: pkg.id,
        packageName: pkg.name,
        version: pkg.version,
        sourceId: match.sourceId,
        reason: match.reason,
        quarantinedAt: now,
        package: structuredClone(pkg),
      });
      quarantinedIds.add(key);
    }
    blockers.push(`${pkg.name} v${pkg.version} geri çağrıldığı için karantinaya alındı: ${match.reason}`);
  }

  const removed = new Set(packages.filter((pkg) => !safePackages.some((safe) => safe.id === pkg.id)).map((pkg) => pkg.id));
  const nextPreferences = preferences.map((preference) => removed.has(preference.packageId) ? { ...preference, enabled: false } : preference);
  if (quarantines.length) warnings.push(`${quarantines.length} Homebrew paket sürümü güvenlik karantinasında.`);
  const readinessScore = Math.max(0, 100 - blockers.length * 25 - warnings.length * 5);
  return { safePackages, preferences: nextPreferences, quarantines, blockers, warnings, readinessScore };
}

export function canRestoreHomebrewQuarantine(
  record: HomebrewQuarantineRecord,
  revocations: HomebrewMarketplaceRevocationList[],
): { allowed: boolean; reason?: string } {
  const match = revokedMatch(record.package, revocations);
  return match ? { allowed: false, reason: match.reason } : { allowed: true };
}

export function restoreHomebrewQuarantine(
  packages: HomebrewPackage[],
  quarantines: HomebrewQuarantineRecord[],
  recordId: string,
  revocations: HomebrewMarketplaceRevocationList[],
) {
  const record = quarantines.find((item) => item.id === recordId);
  if (!record) return { packages, quarantines, blockers: ["Karantina kaydı bulunamadı."] };
  const restore = canRestoreHomebrewQuarantine(record, revocations);
  if (!restore.allowed) return { packages, quarantines, blockers: [`Paket hâlâ geri çağrılmış durumda: ${restore.reason}`] };
  return {
    packages: [...packages.filter((pkg) => pkg.id !== record.packageId), structuredClone(record.package)],
    quarantines: quarantines.filter((item) => item.id !== recordId),
    blockers: [] as string[],
  };
}

export function getAutomaticSyncSources(sources: HomebrewMarketplaceSource[], now = new Date()) {
  return sources.filter((source) => source.enabled && Boolean(source.baseUrl) && ["due", "overdue", "never", "failed"].includes(evaluateHomebrewMarketplaceSync(source, now).state));
}

export async function runAutomaticHomebrewSourceSync(
  sources: HomebrewMarketplaceSource[],
  fetchSource: (source: HomebrewMarketplaceSource) => Promise<string>,
  now = new Date(),
): Promise<HomebrewAutomaticSyncResult> {
  const due = getAutomaticSyncSources(sources, now);
  const updated = [...sources];
  const downloaded: Array<{ sourceId: string; raw: string }> = [];
  const events: HomebrewMarketplaceSecurityEvent[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const source of due) {
    try {
      const raw = await fetchSource(source);
      if (!raw.trim()) throw new Error("Kaynak boş yanıt verdi.");
      downloaded.push({ sourceId: source.id, raw });
      const index = updated.findIndex((item) => item.id === source.id);
      updated[index] = markHomebrewMarketplaceSourceSynced(source, now.toISOString());
      events.push(createHomebrewSecurityEvent("sync", "info", "Marketplace kaynağı otomatik senkronize edildi.", source.id, now.toISOString()));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen senkronizasyon hatası";
      const index = updated.findIndex((item) => item.id === source.id);
      updated[index] = markHomebrewMarketplaceSourceSyncFailed(source, message);
      blockers.push(`${source.name}: ${message}`);
      events.push(createHomebrewSecurityEvent("sync", "critical", `Otomatik senkronizasyon başarısız: ${message}`, source.id, now.toISOString()));
    }
  }
  if (!due.length) warnings.push("Senkronizasyon zamanı gelmiş etkin marketplace kaynağı yok.");
  return { sources: updated, downloaded, events, blockers, warnings };
}
