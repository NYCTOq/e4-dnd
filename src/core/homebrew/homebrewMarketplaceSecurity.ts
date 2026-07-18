import type { HomebrewMarketplaceEnvelope, HomebrewMarketplaceSource, HomebrewMarketplaceVerification } from "./homebrewMarketplaceTrust";

export type HomebrewRevokedPackage = {
  packageId: string;
  version?: string;
  reason: string;
  revokedAt: string;
};

export type HomebrewMarketplaceRevocationList = {
  format: "e4-dnd-homebrew-revocations";
  schemaVersion: 1;
  sourceId: string;
  updatedAt: string;
  expiresAt?: string;
  revokedSignerIds: string[];
  revokedPackages: HomebrewRevokedPackage[];
};

export type HomebrewMarketplaceSecurityEvent = {
  id: string;
  occurredAt: string;
  sourceId?: string;
  action: "sync" | "verify" | "install" | "block" | "revoke" | "rollback";
  severity: "info" | "warning" | "critical";
  message: string;
};

export type HomebrewMarketplaceSyncStatus = {
  state: "current" | "due" | "overdue" | "never" | "failed";
  dueAt?: string;
  blockers: string[];
  warnings: string[];
};

export type HomebrewMarketplaceSecurityReport = {
  valid: boolean;
  revoked: boolean;
  blockers: string[];
  warnings: string[];
};

function parseTime(value?: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function evaluateHomebrewMarketplaceSync(
  source: HomebrewMarketplaceSource,
  now = new Date(),
): HomebrewMarketplaceSyncStatus {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (source.lastSyncError) {
    blockers.push(`${source.name} kaynak senkronizasyonu başarısız: ${source.lastSyncError}`);
    return { state: "failed", blockers, warnings };
  }
  const lastSync = parseTime(source.lastSyncedAt);
  if (lastSync === null) {
    warnings.push(`${source.name} kaynağı henüz senkronize edilmedi.`);
    return { state: "never", blockers, warnings };
  }
  const intervalHours = Math.max(1, source.syncIntervalHours ?? 24);
  const dueAt = new Date(lastSync + intervalHours * 60 * 60 * 1000);
  const overdueAt = new Date(dueAt.getTime() + intervalHours * 60 * 60 * 1000);
  if (now >= overdueAt) {
    blockers.push(`${source.name} kaynak kaydı uzun süredir yenilenmedi.`);
    return { state: "overdue", dueAt: dueAt.toISOString(), blockers, warnings };
  }
  if (now >= dueAt) {
    warnings.push(`${source.name} kaynak senkronizasyonu zamanı geldi.`);
    return { state: "due", dueAt: dueAt.toISOString(), blockers, warnings };
  }
  return { state: "current", dueAt: dueAt.toISOString(), blockers, warnings };
}

export function markHomebrewMarketplaceSourceSynced(
  source: HomebrewMarketplaceSource,
  syncedAt = new Date().toISOString(),
): HomebrewMarketplaceSource {
  return { ...source, lastSyncedAt: syncedAt, lastSyncError: undefined };
}

export function markHomebrewMarketplaceSourceSyncFailed(
  source: HomebrewMarketplaceSource,
  error: string,
): HomebrewMarketplaceSource {
  return { ...source, lastSyncError: error.trim() || "Bilinmeyen senkronizasyon hatası" };
}

export function validateHomebrewRevocationList(
  list: HomebrewMarketplaceRevocationList,
  source?: HomebrewMarketplaceSource,
  now = new Date(),
): HomebrewMarketplaceSecurityReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (list.format !== "e4-dnd-homebrew-revocations") blockers.push("Geçersiz Homebrew geri çağırma listesi formatı.");
  if (list.schemaVersion !== 1) blockers.push("Desteklenmeyen geri çağırma listesi şema sürümü.");
  if (!list.sourceId.trim()) blockers.push("Geri çağırma listesi sourceId içermiyor.");
  if (source && source.id !== list.sourceId) blockers.push("Geri çağırma listesi kayıtlı marketplace kaynağıyla uyuşmuyor.");
  if (parseTime(list.updatedAt) === null) blockers.push("Geri çağırma listesi updatedAt değeri geçersiz.");
  const expiresAt = parseTime(list.expiresAt);
  if (expiresAt !== null && now.getTime() > expiresAt) blockers.push("Geri çağırma listesi süresi dolmuş.");
  if (!list.expiresAt) warnings.push("Geri çağırma listesinde expiresAt bulunmuyor.");
  const signerIds = new Set<string>();
  for (const signerId of list.revokedSignerIds) {
    if (!signerId.trim()) blockers.push("Boş signer ID geri çağrılamaz.");
    if (signerIds.has(signerId)) blockers.push(`Tekrarlanan revoked signer ID: ${signerId}`);
    signerIds.add(signerId);
  }
  const packages = new Set<string>();
  for (const item of list.revokedPackages) {
    const key = `${item.packageId}@${item.version ?? "*"}`;
    if (!item.packageId.trim() || !item.reason.trim()) blockers.push("Geri çağrılan paket ID ve gerekçe içermelidir.");
    if (packages.has(key)) blockers.push(`Tekrarlanan paket geri çağırma kaydı: ${key}`);
    packages.add(key);
  }
  return { valid: blockers.length === 0, revoked: false, blockers, warnings };
}

export function verifyHomebrewMarketplaceRevocations(
  envelope: HomebrewMarketplaceEnvelope,
  verification: HomebrewMarketplaceVerification,
  lists: HomebrewMarketplaceRevocationList[],
  now = new Date(),
): HomebrewMarketplaceSecurityReport {
  const blockers = [...verification.blockers];
  const warnings = [...verification.warnings];
  const list = lists.find((entry) => entry.sourceId === envelope.sourceId);
  if (!list) {
    warnings.push("Marketplace kaynağı için geri çağırma listesi bulunamadı.");
    return { valid: blockers.length === 0, revoked: false, blockers, warnings };
  }
  const validation = validateHomebrewRevocationList(list, verification.source, now);
  blockers.push(...validation.blockers);
  warnings.push(...validation.warnings);
  let revoked = false;
  const signerId = envelope.integrity.signerId;
  if (signerId && list.revokedSignerIds.includes(signerId)) {
    revoked = true;
    blockers.push(`Marketplace imza anahtarı geri çağrılmış: ${signerId}`);
  }
  for (const entry of envelope.manifest.packages) {
    const pkg = entry.package;
    const match = list.revokedPackages.find((item) => item.packageId === pkg.id && (!item.version || item.version === pkg.version));
    if (match) {
      revoked = true;
      blockers.push(`${pkg.name} v${pkg.version} geri çağrılmış: ${match.reason}`);
    }
  }
  return { valid: blockers.length === 0, revoked, blockers, warnings };
}

export function createHomebrewSecurityEvent(
  action: HomebrewMarketplaceSecurityEvent["action"],
  severity: HomebrewMarketplaceSecurityEvent["severity"],
  message: string,
  sourceId?: string,
  occurredAt = new Date().toISOString(),
): HomebrewMarketplaceSecurityEvent {
  return { id: `${occurredAt}:${action}:${sourceId ?? "local"}`, occurredAt, sourceId, action, severity, message };
}

export function pruneHomebrewSecurityEvents(events: HomebrewMarketplaceSecurityEvent[], limit = 100) {
  return [...events]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .filter((event, index, all) => all.findIndex((item) => item.id === event.id) === index)
    .slice(0, Math.max(1, limit));
}

export function importHomebrewRevocationList(raw: string): HomebrewMarketplaceRevocationList {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Geri çağırma listesi geçerli JSON değil."); }
  if (!parsed || typeof parsed !== "object") throw new Error("Geri çağırma listesi nesne olmalıdır.");
  return parsed as HomebrewMarketplaceRevocationList;
}
