import type { Character } from "../character/character.types";

const STORAGE_KEY = "e4_dnd_characters_v1";

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as Character[];
  } catch {
    return [];
  }
}

export function saveCharacters(characters: Character[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export function exportCharacters(characters: Character[]): void {
  const blob = new Blob([JSON.stringify(characters, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `e4-dnd-characters-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  link.click();
  URL.revokeObjectURL(url);
}