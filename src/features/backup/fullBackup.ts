import type { Character } from "../../core/character/character.types";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../campaigns/campaignTypes";
import { DEFAULT_APP_SETTINGS, sanitizeAppSettings, type AppSettings } from "../../shared/settings/appSettings";
import { hydrateCharacterRecord } from "../../core/storage/characterStorage";

export const FULL_BACKUP_VERSION = 3;

export type E4FullBackup = {
  format: "e4-dnd-full-backup";
  version: number;
  exportedAt: string;
  appVersion?: string;
  data: {
    characters: Character[];
    campaigns: Campaign[];
    homebrewSpells: DndSpellData[];
    homebrewItems: DndItemData[];
    homebrewMonsters: DndMonsterData[];
    favoriteMonsterIds: string[];
    appSettings: AppSettings;
  };
};

export type FullBackupData = E4FullBackup["data"];

export type BackupImportMode = "replace" | "merge";

export type BackupImportSections = {
  characters: boolean;
  campaigns: boolean;
  homebrewSpells: boolean;
  homebrewItems: boolean;
  homebrewMonsters: boolean;
  favoriteMonsterIds: boolean;
  appSettings: boolean;
};

export type BackupImportOptions = {
  mode: BackupImportMode;
  sections: BackupImportSections;
};

export const DEFAULT_BACKUP_IMPORT_SECTIONS: BackupImportSections = {
  characters: true,
  campaigns: true,
  homebrewSpells: true,
  homebrewItems: true,
  homebrewMonsters: true,
  favoriteMonsterIds: true,
  appSettings: true,
};

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function createFullBackup(data: FullBackupData): E4FullBackup {
  return {
    format: "e4-dnd-full-backup",
    version: FULL_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : undefined,
    data,
  };
}

export function exportFullBackup(data: FullBackupData) {
  const date = new Date().toISOString().slice(0, 10);
  downloadJson(`e4-dnd-full-backup-${date}.json`, createFullBackup(data));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCharacterLike(value: unknown): value is Character {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.className === "string" &&
    typeof value.level === "number" &&
    typeof value.maxHp === "number" &&
    typeof value.armorClass === "number" &&
    isRecord(value.abilities)
  );
}

function isCampaignLike(value: unknown): value is Campaign {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.characterIds) &&
    Array.isArray(value.encounters)
  );
}

function isNamedData(value: unknown): value is DndSpellData | DndItemData | DndMonsterData {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}

export function parseFullBackup(value: unknown): E4FullBackup {
  if (!isRecord(value)) {
    throw new Error("Yedek dosyasının kök yapısı geçersiz.");
  }

  if (value.format !== "e4-dnd-full-backup") {
    throw new Error("Bu dosya E4 D&D tam yedek formatında değil.");
  }

  if (!Number.isInteger(value.version) || (value.version as number) < 1) {
    throw new Error("Yedek sürüm bilgisi geçersiz.");
  }
  if ((value.version as number) > FULL_BACKUP_VERSION) {
    throw new Error("Yedek sürümü bu uygulama sürümünden daha yeni.");
  }
  const version = value.version as number;

  if (!isRecord(value.data)) {
    throw new Error("Yedek veri bölümü bulunamadı.");
  }

  const data = value.data;
  const characters = Array.isArray(data.characters) ? data.characters : null;
  const campaigns = Array.isArray(data.campaigns) ? data.campaigns : null;
  const homebrewSpells = Array.isArray(data.homebrewSpells) ? data.homebrewSpells : null;
  const homebrewItems = Array.isArray(data.homebrewItems) ? data.homebrewItems : null;
  const homebrewMonsters = Array.isArray(data.homebrewMonsters) ? data.homebrewMonsters : null;
  const favoriteMonsterIds = Array.isArray(data.favoriteMonsterIds)
    ? data.favoriteMonsterIds
    : null;
  const appSettings =
    version >= 2
      ? sanitizeAppSettings(data.appSettings)
      : DEFAULT_APP_SETTINGS;

  if (
    !characters ||
    !campaigns ||
    !homebrewSpells ||
    !homebrewItems ||
    !homebrewMonsters ||
    !favoriteMonsterIds
  ) {
    throw new Error("Yedekte gerekli veri listelerinden biri eksik.");
  }

  if (!characters.every(isCharacterLike)) {
    throw new Error("Yedekte geçersiz karakter kaydı var.");
  }

  const characterIds = new Set<string>();
  for (const character of characters as Character[]) {
    if (characterIds.has(character.id)) {
      throw new Error("Yedekte aynı ID ile birden fazla karakter var.");
    }
    characterIds.add(character.id);
  }

  if (!campaigns.every(isCampaignLike)) {
    throw new Error("Yedekte geçersiz campaign kaydı var.");
  }

  if (
    !homebrewSpells.every(isNamedData) ||
    !homebrewItems.every(isNamedData) ||
    !homebrewMonsters.every(isNamedData)
  ) {
    throw new Error("Yedekte geçersiz homebrew kaydı var.");
  }

  if (!favoriteMonsterIds.every((id) => typeof id === "string")) {
    throw new Error("Yedekte geçersiz favori canavar kaydı var.");
  }

  return {
    format: "e4-dnd-full-backup",
    version,
    exportedAt:
      typeof value.exportedAt === "string" && !Number.isNaN(Date.parse(value.exportedAt))
        ? value.exportedAt
        : new Date().toISOString(),
    appVersion: typeof value.appVersion === "string" ? value.appVersion : undefined,
    data: {
      characters: (characters as Character[]).map(hydrateCharacterRecord),
      campaigns: campaigns as Campaign[],
      homebrewSpells: homebrewSpells as DndSpellData[],
      homebrewItems: homebrewItems as DndItemData[],
      homebrewMonsters: homebrewMonsters as DndMonsterData[],
      favoriteMonsterIds: favoriteMonsterIds as string[],
      appSettings,
    },
  };
}
