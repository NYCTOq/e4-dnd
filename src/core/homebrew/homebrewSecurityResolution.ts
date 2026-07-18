import type { HomebrewPackage } from "./homebrewFoundation";
import type { HomebrewMarketplaceSource } from "./homebrewMarketplaceTrust";
import type { HomebrewMarketplaceSecurityEvent, HomebrewMarketplaceRevocationList } from "./homebrewMarketplaceSecurity";
import type { HomebrewQuarantineRecord } from "./homebrewSecurityCenter";

export type HomebrewQuarantinePolicy = {
  autoQuarantineRevoked: boolean;
  autoDisableAffectedPackages: boolean;
  requireTrustedReplacement: boolean;
  maxSourceAgeHours: number;
  maxFailedSyncs: number;
};

export const DEFAULT_HOMEBREW_QUARANTINE_POLICY: HomebrewQuarantinePolicy = {
  autoQuarantineRevoked: true,
  autoDisableAffectedPackages: true,
  requireTrustedReplacement: true,
  maxSourceAgeHours: 72,
  maxFailedSyncs: 3,
};

export type HomebrewSourceHealthPoint = {
  sourceId: string;
  checkedAt: string;
  state: "healthy" | "warning" | "critical";
  score: number;
  latencyMs?: number;
  message: string;
};

export type HomebrewSourceHealthSummary = {
  sourceId: string;
  sourceName: string;
  score: number;
  state: HomebrewSourceHealthPoint["state"];
  consecutiveFailures: number;
  lastCheckedAt?: string;
  trend: "improving" | "stable" | "declining";
  blockers: string[];
  warnings: string[];
};

export type HomebrewTrustedReplacement = {
  packageId: string;
  replacement: HomebrewPackage;
  sourceId: string;
  verifiedAt: string;
  checksumVerified: boolean;
  signatureVerified: boolean;
};

export type HomebrewSecurityResolutionResult = {
  packages: HomebrewPackage[];
  quarantines: HomebrewQuarantineRecord[];
  resolvedRecordIds: string[];
  blockers: string[];
  warnings: string[];
};

export type HomebrewSecurityReleaseCertificate = {
  ready: boolean;
  readinessScore: number;
  sourceHealth: HomebrewSourceHealthSummary[];
  unresolvedQuarantines: number;
  criticalEvents: number;
  blockers: string[];
  warnings: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseTime(value?: string) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function appendHomebrewSourceHealthPoint(
  history: HomebrewSourceHealthPoint[],
  point: HomebrewSourceHealthPoint,
  limitPerSource = 30,
): HomebrewSourceHealthPoint[] {
  const next = [...history.filter((item) => !(item.sourceId === point.sourceId && item.checkedAt === point.checkedAt)), point];
  const sourceIds = [...new Set(next.map((item) => item.sourceId))];
  return sourceIds.flatMap((sourceId) => next
    .filter((item) => item.sourceId === sourceId)
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
    .slice(0, Math.max(1, limitPerSource)));
}

export function summarizeHomebrewSourceHealth(
  source: HomebrewMarketplaceSource,
  history: HomebrewSourceHealthPoint[],
  policy: HomebrewQuarantinePolicy = DEFAULT_HOMEBREW_QUARANTINE_POLICY,
  now = new Date(),
): HomebrewSourceHealthSummary {
  const points = history.filter((item) => item.sourceId === source.id).sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  const blockers: string[] = [];
  const warnings: string[] = [];
  let score = points[0]?.score ?? 70;
  let consecutiveFailures = 0;
  for (const point of points) {
    if (point.state !== "critical") break;
    consecutiveFailures += 1;
  }
  if (!source.enabled) warnings.push("Kaynak devre dışı.");
  if (source.trustLevel === "blocked") blockers.push("Kaynak güven politikası tarafından engellenmiş.");
  if (consecutiveFailures >= policy.maxFailedSyncs) blockers.push(`Kaynak ${consecutiveFailures} kez üst üste kritik hata verdi.`);
  const lastSync = parseTime(source.lastSyncedAt);
  if (lastSync === null) warnings.push("Kaynak henüz başarıyla senkronize edilmedi.");
  else {
    const ageHours = (now.getTime() - lastSync) / 3_600_000;
    if (ageHours > policy.maxSourceAgeHours) blockers.push(`Kaynak ${Math.floor(ageHours)} saattir yenilenmedi.`);
    else if (ageHours > policy.maxSourceAgeHours / 2) warnings.push("Kaynak sağlık penceresinin ikinci yarısında.");
  }
  score -= blockers.length * 30 + warnings.length * 8;
  const latest = points[0]?.score;
  const older = points[Math.min(2, points.length - 1)]?.score;
  const trend = latest === undefined || older === undefined || latest === older ? "stable" : latest > older ? "improving" : "declining";
  const finalScore = clampScore(score);
  return {
    sourceId: source.id,
    sourceName: source.name,
    score: finalScore,
    state: blockers.length ? "critical" : warnings.length || finalScore < 80 ? "warning" : "healthy",
    consecutiveFailures,
    lastCheckedAt: points[0]?.checkedAt,
    trend,
    blockers,
    warnings,
  };
}

function packageStillRevoked(pkg: HomebrewPackage, lists: HomebrewMarketplaceRevocationList[]) {
  return lists.some((list) => list.revokedPackages.some((item) => item.packageId === pkg.id && (!item.version || item.version === pkg.version)));
}

export function resolveHomebrewQuarantineWithTrustedReplacement(
  packages: HomebrewPackage[],
  quarantines: HomebrewQuarantineRecord[],
  recordId: string,
  candidate: HomebrewTrustedReplacement,
  revocations: HomebrewMarketplaceRevocationList[],
  sources: HomebrewMarketplaceSource[],
  policy: HomebrewQuarantinePolicy = DEFAULT_HOMEBREW_QUARANTINE_POLICY,
): HomebrewSecurityResolutionResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const record = quarantines.find((item) => item.id === recordId);
  if (!record) return { packages, quarantines, resolvedRecordIds: [], blockers: ["Karantina kaydı bulunamadı."], warnings };
  const source = sources.find((item) => item.id === candidate.sourceId);
  if (!source || !source.enabled || source.trustLevel === "blocked") blockers.push("Temiz sürüm etkin ve kayıtlı bir marketplace kaynağından gelmelidir.");
  if (candidate.packageId !== record.packageId || candidate.replacement.id !== record.packageId) blockers.push("Temiz sürüm karantinadaki paket kimliğiyle uyuşmuyor.");
  if (!candidate.checksumVerified) blockers.push("Temiz sürüm checksum doğrulamasından geçmedi.");
  if (policy.requireTrustedReplacement && source?.trustLevel !== "trusted") blockers.push("Güvenlik politikası yalnızca güvenilir kaynakla çözümlemeye izin veriyor.");
  if (policy.requireTrustedReplacement && !candidate.signatureVerified) blockers.push("Güvenilir temiz sürüm dijital imza doğrulamasından geçmedi.");
  if (packageStillRevoked(candidate.replacement, revocations)) blockers.push("Önerilen temiz sürüm hâlâ geri çağırma listesinde.");
  if (candidate.replacement.version === record.version) warnings.push("Temiz sürüm karantinadaki sürümle aynı sürüm numarasını taşıyor.");
  if (blockers.length) return { packages, quarantines, resolvedRecordIds: [], blockers, warnings };
  return {
    packages: [...packages.filter((item) => item.id !== record.packageId), structuredClone(candidate.replacement)],
    quarantines: quarantines.filter((item) => item.id !== recordId),
    resolvedRecordIds: [recordId],
    blockers,
    warnings,
  };
}

export function buildHomebrewSecurityReleaseCertificate(
  sources: HomebrewMarketplaceSource[],
  history: HomebrewSourceHealthPoint[],
  quarantines: HomebrewQuarantineRecord[],
  events: HomebrewMarketplaceSecurityEvent[],
  revocations: HomebrewMarketplaceRevocationList[],
  policy: HomebrewQuarantinePolicy = DEFAULT_HOMEBREW_QUARANTINE_POLICY,
  now = new Date(),
): HomebrewSecurityReleaseCertificate {
  const sourceHealth = sources.map((source) => summarizeHomebrewSourceHealth(source, history, policy, now));
  const blockers = sourceHealth.flatMap((item) => item.blockers.map((message) => `${item.sourceName}: ${message}`));
  const warnings = sourceHealth.flatMap((item) => item.warnings.map((message) => `${item.sourceName}: ${message}`));
  const criticalEvents = events.filter((event) => event.severity === "critical").length;
  if (quarantines.length) blockers.push(`${quarantines.length} Homebrew paket sürümü hâlâ karantinada.`);
  const expiredLists = revocations.filter((list) => list.expiresAt && Date.parse(list.expiresAt) < now.getTime());
  if (expiredLists.length) blockers.push(`${expiredLists.length} geri çağırma listesinin süresi dolmuş.`);
  if (!sources.length) warnings.push("Marketplace kaynak kaydı bulunmuyor.");
  const averageHealth = sourceHealth.length ? sourceHealth.reduce((sum, item) => sum + item.score, 0) / sourceHealth.length : 80;
  const readinessScore = clampScore(averageHealth - quarantines.length * 20 - expiredLists.length * 20 - Math.min(criticalEvents, 5) * 3 - warnings.length * 2);
  return { ready: blockers.length === 0, readinessScore, sourceHealth, unresolvedQuarantines: quarantines.length, criticalEvents, blockers, warnings };
}
