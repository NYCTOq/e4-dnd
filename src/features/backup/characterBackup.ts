import type { Character } from "../../core/character/character.types";
import { hydrateCharacterRecord } from "../../core/storage/characterStorage";

export const CHARACTER_BACKUP_VERSION = 2;

export type E4CharacterBackup = {
  format: "e4-dnd-character-backup";
  version: number;
  exportedAt: string;
  characters: Character[];
};

export type CharacterImportResult = {
  characters: Character[];
  sourceVersion: number;
  migrated: boolean;
  legacyArray: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isAbilityBlock(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["str", "dex", "con", "int", "wis", "cha"].every((key) =>
    hasFiniteNumber(value[key]),
  );
}

export function getCharacterValidationError(value: unknown, index?: number): string | null {
  const prefix = typeof index === "number" ? `${index + 1}. karakter: ` : "";
  if (!isRecord(value)) return `${prefix}kayıt bir nesne değil.`;
  if (typeof value.id !== "string" || !value.id.trim()) return `${prefix}ID eksik.`;
  if (typeof value.name !== "string" || !value.name.trim()) return `${prefix}isim eksik.`;
  if (typeof value.className !== "string" || !value.className.trim()) return `${prefix}sınıf eksik.`;
  if (!hasFiniteNumber(value.level)) return `${prefix}level geçersiz.`;
  if (!hasFiniteNumber(value.maxHp)) return `${prefix}maksimum HP geçersiz.`;
  if (!hasFiniteNumber(value.armorClass)) return `${prefix}Armor Class geçersiz.`;
  if (!isAbilityBlock(value.abilities)) return `${prefix}ability skorları eksik veya geçersiz.`;
  return null;
}

function validateCharacterList(value: unknown): Character[] {
  if (!Array.isArray(value)) {
    throw new Error("Karakter yedeğinde karakter listesi bulunamadı.");
  }
  if (value.length > 500) {
    throw new Error("Karakter yedeği 500 kayıt sınırını aşıyor.");
  }

  const ids = new Set<string>();
  const hydrated = value.map((candidate, index) => {
    const error = getCharacterValidationError(candidate, index);
    if (error) throw new Error(error);
    const character = hydrateCharacterRecord(candidate as Character);
    if (ids.has(character.id)) {
      throw new Error(`${index + 1}. karakter: aynı ID yedekte birden fazla kez bulunuyor.`);
    }
    ids.add(character.id);
    return character;
  });

  return hydrated;
}

export function createCharacterBackup(characters: Character[]): E4CharacterBackup {
  return {
    format: "e4-dnd-character-backup",
    version: CHARACTER_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    characters: characters.map(hydrateCharacterRecord),
  };
}

export function parseCharacterBackup(value: unknown): CharacterImportResult {
  if (Array.isArray(value)) {
    return {
      characters: validateCharacterList(value),
      sourceVersion: 0,
      migrated: true,
      legacyArray: true,
    };
  }

  if (!isRecord(value) || value.format !== "e4-dnd-character-backup") {
    throw new Error("Bu dosya E4 D&D karakter yedeği formatında değil.");
  }
  if (!Number.isInteger(value.version) || (value.version as number) < 1) {
    throw new Error("Karakter yedeğinin sürüm bilgisi geçersiz.");
  }
  if ((value.version as number) > CHARACTER_BACKUP_VERSION) {
    throw new Error("Karakter yedeği bu uygulama sürümünden daha yeni.");
  }

  return {
    characters: validateCharacterList(value.characters),
    sourceVersion: value.version as number,
    migrated: value.version !== CHARACTER_BACKUP_VERSION,
    legacyArray: false,
  };
}
