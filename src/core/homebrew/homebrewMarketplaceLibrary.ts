import type { HomebrewEntity, HomebrewPackage } from "./homebrewFoundation";
import { compareHomebrewVersions } from "./homebrewPackageSharing";

export type HomebrewLibraryPreference = {
  packageId: string;
  enabled: boolean;
  priority: number;
  pinnedVersion?: string;
};

export type HomebrewMarketplaceEntry = {
  package: HomebrewPackage;
  enabled: boolean;
  priority: number;
  pinnedVersion?: string;
  updateVersion?: string;
  updateAvailable: boolean;
};

export type HomebrewEntityConflict = {
  key: string;
  type: HomebrewEntity["type"];
  entityId: string;
  contenders: Array<{ packageId: string; packageName: string; version: string; priority: number }>;
  winnerPackageId: string;
};

export type HomebrewMarketplaceResolution = {
  entries: HomebrewMarketplaceEntry[];
  activePackages: HomebrewPackage[];
  activeEntities: HomebrewEntity[];
  conflicts: HomebrewEntityConflict[];
  blockers: string[];
  warnings: string[];
  readinessScore: number;
};

export type HomebrewMarketplaceCatalogItem = {
  packageId: string;
  latestVersion: string;
};

function entityKey(entity: HomebrewEntity): string {
  return `${entity.type}:${entity.id}`;
}

export function normalizeHomebrewLibraryPreferences(
  packages: HomebrewPackage[],
  preferences: HomebrewLibraryPreference[],
): HomebrewLibraryPreference[] {
  const known = new Map(preferences.map((preference) => [preference.packageId, preference]));
  return packages
    .map((pkg, index) => {
      const existing = known.get(pkg.id);
      return {
        packageId: pkg.id,
        enabled: existing?.enabled ?? true,
        priority: Number.isFinite(existing?.priority) ? existing!.priority : index,
        pinnedVersion: existing?.pinnedVersion,
      };
    })
    .sort((left, right) => left.priority - right.priority)
    .map((preference, index) => ({ ...preference, priority: index }));
}

export function moveHomebrewPackagePriority(
  preferences: HomebrewLibraryPreference[],
  packageId: string,
  direction: "up" | "down",
): HomebrewLibraryPreference[] {
  const ordered = [...preferences].sort((a, b) => a.priority - b.priority);
  const index = ordered.findIndex((preference) => preference.packageId === packageId);
  if (index < 0) return ordered;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return ordered;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered.map((preference, priority) => ({ ...preference, priority }));
}

export function toggleHomebrewPackage(
  preferences: HomebrewLibraryPreference[],
  packageId: string,
): HomebrewLibraryPreference[] {
  return preferences.map((preference) => preference.packageId === packageId
    ? { ...preference, enabled: !preference.enabled }
    : preference);
}

export function resolveHomebrewMarketplaceLibrary(
  packages: HomebrewPackage[],
  preferences: HomebrewLibraryPreference[] = [],
  catalog: HomebrewMarketplaceCatalogItem[] = [],
): HomebrewMarketplaceResolution {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const packageIds = new Set<string>();
  for (const pkg of packages) {
    if (packageIds.has(pkg.id)) blockers.push(`Tekrarlanan paket ID: ${pkg.id}`);
    packageIds.add(pkg.id);
  }
  const normalized = normalizeHomebrewLibraryPreferences(packages, preferences);
  const preferenceById = new Map(normalized.map((preference) => [preference.packageId, preference]));
  const latestById = new Map(catalog.map((item) => [item.packageId, item.latestVersion]));
  const entries = packages
    .map((pkg) => {
      const preference = preferenceById.get(pkg.id)!;
      const latestVersion = latestById.get(pkg.id);
      const updateAvailable = Boolean(latestVersion && compareHomebrewVersions(latestVersion, pkg.version) > 0);
      if (preference.pinnedVersion && preference.pinnedVersion !== pkg.version) {
        warnings.push(`${pkg.name}: sabitlenen ${preference.pinnedVersion} yerine ${pkg.version} kurulu.`);
      }
      return { package: pkg, ...preference, updateVersion: updateAvailable ? latestVersion : undefined, updateAvailable };
    })
    .sort((left, right) => left.priority - right.priority);

  const activePackages = entries.filter((entry) => entry.enabled).map((entry) => entry.package);
  const contenders = new Map<string, Array<{ entity: HomebrewEntity; entry: HomebrewMarketplaceEntry }>>();
  for (const entry of entries.filter((item) => item.enabled)) {
    for (const entity of entry.package.entities) {
      const key = entityKey(entity);
      const list = contenders.get(key) ?? [];
      list.push({ entity, entry });
      contenders.set(key, list);
    }
  }

  const conflicts: HomebrewEntityConflict[] = [];
  const activeEntities: HomebrewEntity[] = [];
  for (const [key, candidates] of contenders) {
    candidates.sort((left, right) => left.entry.priority - right.entry.priority
      || compareHomebrewVersions(right.entry.package.version, left.entry.package.version));
    const winner = candidates[0];
    activeEntities.push(structuredClone(winner.entity));
    if (candidates.length > 1) {
      conflicts.push({
        key,
        type: winner.entity.type,
        entityId: winner.entity.id,
        winnerPackageId: winner.entry.package.id,
        contenders: candidates.map(({ entry }) => ({
          packageId: entry.package.id,
          packageName: entry.package.name,
          version: entry.package.version,
          priority: entry.priority,
        })),
      });
      warnings.push(`${key} çakışması ${winner.entry.package.name} lehine çözüldü.`);
    }
  }
  const updateCount = entries.filter((entry) => entry.updateAvailable).length;
  if (updateCount) warnings.push(`${updateCount} Homebrew paketi için güncelleme var.`);
  const readinessScore = Math.max(0, 100 - blockers.length * 35 - conflicts.length * 3 - updateCount);
  return { entries, activePackages, activeEntities, conflicts, blockers, warnings, readinessScore };
}

export function getHomebrewConflictWinner(
  resolution: HomebrewMarketplaceResolution,
  type: HomebrewEntity["type"],
  entityId: string,
): HomebrewPackage | undefined {
  const conflict = resolution.conflicts.find((item) => item.type === type && item.entityId === entityId);
  return conflict ? resolution.activePackages.find((pkg) => pkg.id === conflict.winnerPackageId) : undefined;
}
