import type { HomebrewPackage } from "./homebrewFoundation";
import { compareHomebrewVersions, validateHomebrewShareManifest, type HomebrewShareManifest } from "./homebrewPackageSharing";

export type HomebrewPackageSnapshot = {
  id: string;
  packageId: string;
  packageName: string;
  version: string;
  createdAt: string;
  reason: "update" | "manual" | "rollback";
  package: HomebrewPackage;
};

export type HomebrewUpdateResult = {
  packages: HomebrewPackage[];
  snapshots: HomebrewPackageSnapshot[];
  updatedPackageIds: string[];
  skippedPackageIds: string[];
  blockers: string[];
  warnings: string[];
};

function snapshotId(packageId: string, version: string, createdAt: string) {
  return `${packageId}:${version}:${createdAt}`;
}

export function createHomebrewPackageSnapshot(
  pkg: HomebrewPackage,
  reason: HomebrewPackageSnapshot["reason"] = "manual",
  createdAt = new Date().toISOString(),
): HomebrewPackageSnapshot {
  return {
    id: snapshotId(pkg.id, pkg.version, createdAt),
    packageId: pkg.id,
    packageName: pkg.name,
    version: pkg.version,
    createdAt,
    reason,
    package: structuredClone(pkg),
  };
}

export function applyHomebrewMarketplaceManifest(
  installedPackages: HomebrewPackage[],
  manifest: HomebrewShareManifest,
  existingSnapshots: HomebrewPackageSnapshot[] = [],
  appVersion = "5.16.0",
): HomebrewUpdateResult {
  const validation = validateHomebrewShareManifest(manifest, appVersion);
  if (!validation.valid) {
    return {
      packages: structuredClone(installedPackages),
      snapshots: structuredClone(existingSnapshots),
      updatedPackageIds: [],
      skippedPackageIds: [],
      blockers: validation.blockers,
      warnings: validation.warnings,
    };
  }

  const next = new Map(installedPackages.map((pkg) => [pkg.id, structuredClone(pkg)]));
  const snapshots = [...existingSnapshots.map((snapshot) => structuredClone(snapshot))];
  const updatedPackageIds: string[] = [];
  const skippedPackageIds: string[] = [];
  const warnings = [...validation.warnings];

  for (const packageId of validation.installOrder) {
    const incoming = manifest.packages.find((entry) => entry.package.id === packageId)?.package;
    if (!incoming) continue;
    const current = next.get(packageId);
    if (current && compareHomebrewVersions(incoming.version, current.version) < 0) {
      skippedPackageIds.push(packageId);
      warnings.push(`${incoming.name}: ${incoming.version} sürümü kurulu ${current.version} sürümünden eski olduğu için atlandı.`);
      continue;
    }
    if (current && compareHomebrewVersions(incoming.version, current.version) === 0) {
      skippedPackageIds.push(packageId);
      continue;
    }
    if (current) snapshots.push(createHomebrewPackageSnapshot(current, "update"));
    next.set(packageId, structuredClone(incoming));
    updatedPackageIds.push(packageId);
  }

  return {
    packages: [...next.values()],
    snapshots,
    updatedPackageIds,
    skippedPackageIds,
    blockers: [],
    warnings,
  };
}

export function rollbackHomebrewPackage(
  installedPackages: HomebrewPackage[],
  snapshots: HomebrewPackageSnapshot[],
  snapshotIdToRestore: string,
): HomebrewUpdateResult {
  const snapshot = snapshots.find((item) => item.id === snapshotIdToRestore);
  if (!snapshot) {
    return {
      packages: structuredClone(installedPackages),
      snapshots: structuredClone(snapshots),
      updatedPackageIds: [],
      skippedPackageIds: [],
      blockers: ["Geri yüklenecek Homebrew snapshot bulunamadı."],
      warnings: [],
    };
  }
  const current = installedPackages.find((pkg) => pkg.id === snapshot.packageId);
  const nextSnapshots = [...snapshots];
  if (current) nextSnapshots.push(createHomebrewPackageSnapshot(current, "rollback"));
  const nextPackages = [
    ...installedPackages.filter((pkg) => pkg.id !== snapshot.packageId),
    structuredClone(snapshot.package),
  ];
  return {
    packages: nextPackages,
    snapshots: nextSnapshots,
    updatedPackageIds: [snapshot.packageId],
    skippedPackageIds: [],
    blockers: [],
    warnings: [`${snapshot.packageName} ${snapshot.version} sürümüne geri alındı.`],
  };
}

export function pruneHomebrewSnapshots(
  snapshots: HomebrewPackageSnapshot[],
  maximumPerPackage = 5,
): HomebrewPackageSnapshot[] {
  const grouped = new Map<string, HomebrewPackageSnapshot[]>();
  for (const snapshot of snapshots) {
    const list = grouped.get(snapshot.packageId) ?? [];
    list.push(snapshot);
    grouped.set(snapshot.packageId, list);
  }
  return [...grouped.values()].flatMap((items) => items
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, Math.max(0, maximumPerPackage)));
}
