import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";
import type { HomebrewLibraryPreference } from "../../core/homebrew/homebrewMarketplaceLibrary";
import type { HomebrewPackageSnapshot } from "../../core/homebrew/homebrewMarketplaceUpdate";
import type { HomebrewMarketplaceSource } from "../../core/homebrew/homebrewMarketplaceTrust";
import type { HomebrewMarketplaceRevocationList, HomebrewMarketplaceSecurityEvent } from "../../core/homebrew/homebrewMarketplaceSecurity";

const HOMEBREW_SPELLS_STORAGE_KEY = "e4_dnd_homebrew_spells_v1";
const HOMEBREW_ITEMS_STORAGE_KEY = "e4_dnd_homebrew_items_v1";
const HOMEBREW_MONSTERS_STORAGE_KEY = "e4_dnd_homebrew_monsters_v1";

function loadArray<T>(key: string): T[] {
  return readJsonSafely<T[]>(
    key,
    [],
    (value): value is T[] => Array.isArray(value),
  );
}

function saveArray<T>(key: string, items: T[]) {
  writeJsonSafely(key, items);
}

export function loadHomebrewSpells(): DndSpellData[] {
  return loadArray<DndSpellData>(HOMEBREW_SPELLS_STORAGE_KEY);
}

export function saveHomebrewSpells(spells: DndSpellData[]) {
  saveArray(HOMEBREW_SPELLS_STORAGE_KEY, spells);
}

export function loadHomebrewItems(): DndItemData[] {
  return loadArray<DndItemData>(HOMEBREW_ITEMS_STORAGE_KEY);
}

export function saveHomebrewItems(items: DndItemData[]) {
  saveArray(HOMEBREW_ITEMS_STORAGE_KEY, items);
}

export function loadHomebrewMonsters(): DndMonsterData[] {
  return loadArray<DndMonsterData>(HOMEBREW_MONSTERS_STORAGE_KEY);
}

export function saveHomebrewMonsters(monsters: DndMonsterData[]) {
  saveArray(HOMEBREW_MONSTERS_STORAGE_KEY, monsters);
}

import type { HomebrewPackage } from "../../core/homebrew/homebrewFoundation";
import { importHomebrewPackage, validateHomebrewPackage } from "../../core/homebrew/homebrewFoundation";
import {
  importHomebrewShareManifest,
  mergeSharedHomebrewPackages,
  migrateHomebrewPackage,
  type HomebrewShareManifest,
} from "../../core/homebrew/homebrewPackageSharing";

export const HOMEBREW_PACKAGES_STORAGE_KEY = "e4_dnd_homebrew_packages_v1";
export const HOMEBREW_PACKAGES_CHANGED_EVENT = "e4-dnd-homebrew-packages-changed";
export const HOMEBREW_LIBRARY_PREFERENCES_STORAGE_KEY = "e4_dnd_homebrew_library_preferences_v1";
export const HOMEBREW_PACKAGE_SNAPSHOTS_STORAGE_KEY = "e4_dnd_homebrew_package_snapshots_v1";
export const HOMEBREW_MARKETPLACE_SOURCES_STORAGE_KEY = "e4_dnd_homebrew_marketplace_sources_v1";
export const HOMEBREW_MARKETPLACE_REVOCATIONS_STORAGE_KEY = "e4_dnd_homebrew_marketplace_revocations_v1";
export const HOMEBREW_MARKETPLACE_SECURITY_EVENTS_STORAGE_KEY = "e4_dnd_homebrew_marketplace_security_events_v1";

export function loadHomebrewPackages(): HomebrewPackage[] {
  return loadArray<unknown>(HOMEBREW_PACKAGES_STORAGE_KEY).flatMap((raw) => {
    try { return [migrateHomebrewPackage(raw).package]; } catch { return []; }
  });
}

export function saveHomebrewPackages(packages: HomebrewPackage[]) {
  const invalid = packages.find((pkg) => !validateHomebrewPackage(pkg).valid);
  if (invalid) throw new Error(`Geçersiz homebrew paketi kaydedilemez: ${invalid.name || invalid.id}`);
  saveArray(HOMEBREW_PACKAGES_STORAGE_KEY, packages);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(HOMEBREW_PACKAGES_CHANGED_EVENT));
}

export function mergeImportedHomebrewPackage(raw: string, packages: HomebrewPackage[]): HomebrewPackage[] {
  const imported = importHomebrewPackage(raw);
  const next = packages.filter((pkg) => pkg.id !== imported.id);
  return [...next, imported];
}


export function mergeImportedHomebrewShareManifest(raw: string, packages: HomebrewPackage[], appVersion = "5.15.0"): HomebrewPackage[] {
  const manifest = importHomebrewShareManifest(raw, appVersion);
  return mergeSharedHomebrewPackages(packages, manifest, appVersion);
}

export function installHomebrewShareManifest(manifest: HomebrewShareManifest, packages: HomebrewPackage[], appVersion = "5.15.0"): HomebrewPackage[] {
  return mergeSharedHomebrewPackages(packages, manifest, appVersion);
}


export function loadHomebrewLibraryPreferences(): HomebrewLibraryPreference[] {
  return loadArray<HomebrewLibraryPreference>(HOMEBREW_LIBRARY_PREFERENCES_STORAGE_KEY);
}

export function saveHomebrewLibraryPreferences(preferences: HomebrewLibraryPreference[]) {
  saveArray(HOMEBREW_LIBRARY_PREFERENCES_STORAGE_KEY, preferences);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(HOMEBREW_PACKAGES_CHANGED_EVENT));
}

export function loadHomebrewPackageSnapshots(): HomebrewPackageSnapshot[] {
  return loadArray<HomebrewPackageSnapshot>(HOMEBREW_PACKAGE_SNAPSHOTS_STORAGE_KEY);
}

export function saveHomebrewPackageSnapshots(snapshots: HomebrewPackageSnapshot[]) {
  saveArray(HOMEBREW_PACKAGE_SNAPSHOTS_STORAGE_KEY, snapshots);
}

export function loadHomebrewMarketplaceSources(): HomebrewMarketplaceSource[] {
  return loadArray<HomebrewMarketplaceSource>(HOMEBREW_MARKETPLACE_SOURCES_STORAGE_KEY);
}

export function saveHomebrewMarketplaceSources(sources: HomebrewMarketplaceSource[]) {
  saveArray(HOMEBREW_MARKETPLACE_SOURCES_STORAGE_KEY, sources);
}

export function loadHomebrewMarketplaceRevocations(): HomebrewMarketplaceRevocationList[] {
  return loadArray<HomebrewMarketplaceRevocationList>(HOMEBREW_MARKETPLACE_REVOCATIONS_STORAGE_KEY);
}

export function saveHomebrewMarketplaceRevocations(items: HomebrewMarketplaceRevocationList[]) {
  saveArray(HOMEBREW_MARKETPLACE_REVOCATIONS_STORAGE_KEY, items);
}

export function loadHomebrewMarketplaceSecurityEvents(): HomebrewMarketplaceSecurityEvent[] {
  return loadArray<HomebrewMarketplaceSecurityEvent>(HOMEBREW_MARKETPLACE_SECURITY_EVENTS_STORAGE_KEY);
}

export function saveHomebrewMarketplaceSecurityEvents(items: HomebrewMarketplaceSecurityEvent[]) {
  saveArray(HOMEBREW_MARKETPLACE_SECURITY_EVENTS_STORAGE_KEY, items);
}
