import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";

const HOMEBREW_SPELLS_STORAGE_KEY = "e4_dnd_homebrew_spells_v1";
const HOMEBREW_ITEMS_STORAGE_KEY = "e4_dnd_homebrew_items_v1";
const HOMEBREW_MONSTERS_STORAGE_KEY = "e4_dnd_homebrew_monsters_v1";

function loadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
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
