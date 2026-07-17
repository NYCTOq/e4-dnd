import {
  validateHomebrewPackage,
  type HomebrewEntity,
  type HomebrewPackage,
} from "./homebrewFoundation";

export type HomebrewPackageDependency = {
  packageId: string;
  versionRange: string;
  optional?: boolean;
};

export type SharedHomebrewPackage = {
  package: HomebrewPackage;
  dependencies: HomebrewPackageDependency[];
};

export type HomebrewShareManifest = {
  format: "e4-dnd-homebrew-share";
  schemaVersion: 1;
  createdAt: string;
  appCompatibility: {
    minimumVersion: string;
    maximumVersion?: string;
  };
  packages: SharedHomebrewPackage[];
};

export type HomebrewMigrationResult = {
  package: HomebrewPackage;
  migrated: boolean;
  notes: string[];
};

export type HomebrewShareValidation = {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  installOrder: string[];
};

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

function parseVersion(value: string): [number, number, number] | null {
  const match = SEMVER.exec(value.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export function compareHomebrewVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return left.localeCompare(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

export function satisfiesHomebrewVersion(version: string, range: string): boolean {
  const normalized = range.trim();
  if (!normalized || normalized === "*") return true;
  if (normalized.startsWith("^")) {
    const base = normalized.slice(1);
    const current = parseVersion(version);
    const expected = parseVersion(base);
    if (!current || !expected) return version === base;
    return current[0] === expected[0] && compareHomebrewVersions(version, base) >= 0;
  }
  if (normalized.startsWith(">=")) return compareHomebrewVersions(version, normalized.slice(2).trim()) >= 0;
  if (normalized.startsWith("<=")) return compareHomebrewVersions(version, normalized.slice(2).trim()) <= 0;
  if (normalized.startsWith(">")) return compareHomebrewVersions(version, normalized.slice(1).trim()) > 0;
  if (normalized.startsWith("<")) return compareHomebrewVersions(version, normalized.slice(1).trim()) < 0;
  return compareHomebrewVersions(version, normalized) === 0;
}

function normalizeEntity(raw: Record<string, unknown>, now: string): HomebrewEntity {
  const payload = (raw.payload && typeof raw.payload === "object" ? raw.payload : {}) as Record<string, unknown>;
  const id = String(raw.id ?? payload.id ?? "").trim();
  const name = String(raw.name ?? payload.name ?? id).trim();
  return {
    ...raw,
    schemaVersion: 1,
    id,
    name,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === "string") : [],
    payload: { ...payload, id, name } as HomebrewEntity["payload"],
    resources: Array.isArray(raw.resources) ? raw.resources as HomebrewEntity["resources"] : [],
    actions: Array.isArray(raw.actions) ? raw.actions as HomebrewEntity["actions"] : [],
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  } as HomebrewEntity;
}

export function migrateHomebrewPackage(input: unknown, now = new Date().toISOString()): HomebrewMigrationResult {
  if (!input || typeof input !== "object") throw new Error("Homebrew paketi nesne olmalıdır.");
  const raw = input as Record<string, unknown>;
  const notes: string[] = [];
  const rawEntities = Array.isArray(raw.entities) ? raw.entities : [];
  const entities = rawEntities.map((entity) => normalizeEntity(entity as Record<string, unknown>, now));
  if (raw.format !== "e4-dnd-homebrew") notes.push("Legacy paket formatı güncel formata taşındı.");
  if (raw.schemaVersion !== 1) notes.push("Paket şema sürümü 1 olarak normalize edildi.");
  if (rawEntities.some((entity) => (entity as Record<string, unknown>).schemaVersion !== 1)) notes.push("Entity şema sürümleri normalize edildi.");
  const pkg: HomebrewPackage = {
    format: "e4-dnd-homebrew",
    schemaVersion: 1,
    id: String(raw.id ?? "").trim(),
    name: String(raw.name ?? raw.id ?? "").trim(),
    version: String(raw.version ?? "1.0.0").trim(),
    author: typeof raw.author === "string" ? raw.author : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    entities,
  };
  const report = validateHomebrewPackage(pkg);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  return { package: pkg, migrated: notes.length > 0, notes };
}

function resolveInstallOrder(entries: SharedHomebrewPackage[]): { order: string[]; cycles: string[] } {
  const byId = new Map(entries.map((entry) => [entry.package.id, entry]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: string[] = [];
  const cycles = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) { cycles.add(id); return; }
    visiting.add(id);
    const entry = byId.get(id);
    for (const dependency of entry?.dependencies ?? []) {
      if (byId.has(dependency.packageId)) visit(dependency.packageId);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };
  entries.forEach((entry) => visit(entry.package.id));
  return { order, cycles: [...cycles] };
}

export function validateHomebrewShareManifest(manifest: HomebrewShareManifest, appVersion = "5.14.0"): HomebrewShareValidation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (manifest.format !== "e4-dnd-homebrew-share") blockers.push("Geçersiz paylaşım manifesti formatı.");
  if (manifest.schemaVersion !== 1) blockers.push("Desteklenmeyen paylaşım manifesti şema sürümü.");
  if (!satisfiesHomebrewVersion(appVersion, `>=${manifest.appCompatibility.minimumVersion}`)) blockers.push("Uygulama sürümü manifest minimumunun altında.");
  if (manifest.appCompatibility.maximumVersion && compareHomebrewVersions(appVersion, manifest.appCompatibility.maximumVersion) > 0) warnings.push("Manifest daha eski bir E4 D&D sürümü için hazırlanmış.");
  const ids = new Set<string>();
  const byId = new Map(manifest.packages.map((entry) => [entry.package.id, entry]));
  for (const entry of manifest.packages) {
    if (ids.has(entry.package.id)) blockers.push(`Tekrarlanan paket ID: ${entry.package.id}`);
    ids.add(entry.package.id);
    const packageReport = validateHomebrewPackage(entry.package);
    blockers.push(...packageReport.blockers.map((message) => `${entry.package.name}: ${message}`));
    warnings.push(...packageReport.warnings.map((message) => `${entry.package.name}: ${message}`));
    const dependencyIds = new Set<string>();
    for (const dependency of entry.dependencies) {
      if (dependencyIds.has(dependency.packageId)) blockers.push(`${entry.package.name}: Tekrarlanan dependency ${dependency.packageId}`);
      dependencyIds.add(dependency.packageId);
      const installed = byId.get(dependency.packageId);
      if (!installed) {
        (dependency.optional ? warnings : blockers).push(`${entry.package.name}: Dependency bulunamadı: ${dependency.packageId}`);
      } else if (!satisfiesHomebrewVersion(installed.package.version, dependency.versionRange)) {
        blockers.push(`${entry.package.name}: ${dependency.packageId} sürümü ${dependency.versionRange} aralığını karşılamıyor.`);
      }
    }
  }
  const resolved = resolveInstallOrder(manifest.packages);
  if (resolved.cycles.length) blockers.push(`Döngüsel paket bağımlılığı: ${resolved.cycles.join(", ")}`);
  return { valid: blockers.length === 0, blockers, warnings, installOrder: resolved.order };
}

export function createHomebrewShareManifest(
  packages: SharedHomebrewPackage[],
  minimumVersion = "5.14.0",
): HomebrewShareManifest {
  return {
    format: "e4-dnd-homebrew-share",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    appCompatibility: { minimumVersion },
    packages: structuredClone(packages),
  };
}

export function exportHomebrewShareManifest(manifest: HomebrewShareManifest): string {
  const report = validateHomebrewShareManifest(manifest);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  return JSON.stringify(manifest, null, 2);
}

export function importHomebrewShareManifest(raw: string, appVersion = "5.14.0"): HomebrewShareManifest {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Homebrew paylaşım manifesti geçerli JSON değil."); }
  if (!parsed || typeof parsed !== "object") throw new Error("Homebrew paylaşım manifesti nesne olmalıdır.");
  const source = parsed as Record<string, unknown>;
  const rawPackages = Array.isArray(source.packages) ? source.packages : [];
  const packages = rawPackages.map((entry) => {
    const record = entry as Record<string, unknown>;
    const migrated = migrateHomebrewPackage(record.package ?? record);
    return {
      package: migrated.package,
      dependencies: Array.isArray(record.dependencies) ? record.dependencies as HomebrewPackageDependency[] : [],
    };
  });
  const manifest: HomebrewShareManifest = {
    format: "e4-dnd-homebrew-share",
    schemaVersion: 1,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : new Date().toISOString(),
    appCompatibility: source.appCompatibility && typeof source.appCompatibility === "object"
      ? source.appCompatibility as HomebrewShareManifest["appCompatibility"]
      : { minimumVersion: "5.9.0" },
    packages,
  };
  const report = validateHomebrewShareManifest(manifest, appVersion);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  return manifest;
}

export function mergeSharedHomebrewPackages(
  current: HomebrewPackage[],
  manifest: HomebrewShareManifest,
  appVersion = "5.14.0",
): HomebrewPackage[] {
  const report = validateHomebrewShareManifest(manifest, appVersion);
  if (!report.valid) throw new Error(report.blockers.join(" "));
  const byId = new Map(current.map((pkg) => [pkg.id, pkg]));
  for (const packageId of report.installOrder) {
    const incoming = manifest.packages.find((entry) => entry.package.id === packageId)!.package;
    const existing = byId.get(packageId);
    if (!existing || compareHomebrewVersions(incoming.version, existing.version) >= 0) byId.set(packageId, structuredClone(incoming));
  }
  return [...byId.values()];
}
