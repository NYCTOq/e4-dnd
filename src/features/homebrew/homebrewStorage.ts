import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";
import { readJsonSafely, writeJsonSafely } from "../../core/storage/safeStorage";

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

