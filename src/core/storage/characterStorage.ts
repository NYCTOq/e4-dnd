import type { Character, CharacterSpellSlot } from "../character/character.types";

const STORAGE_KEY = "e4_dnd_characters_v1";

const FULL_CASTER_CLASSES = new Set([
  "bard",
  "cleric",
  "druid",
  "sorcerer",
  "wizard",
]);

const FULL_CASTER_SLOT_TABLE: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

function getDefaultSpellSlots(level: number, className: string): CharacterSpellSlot[] {
  const normalizedClassName = className.trim().toLowerCase();

  if (!FULL_CASTER_CLASSES.has(normalizedClassName)) {
    return [];
  }

  const safeLevel = Math.min(20, Math.max(1, Math.floor(level)));
  const slots = FULL_CASTER_SLOT_TABLE[safeLevel] ?? [];

  return slots.map((max, index) => ({
    level: index + 1,
    max,
    used: 0,
  }));
}

function hydrateSpellSlots(character: Character): CharacterSpellSlot[] {
  const defaults = getDefaultSpellSlots(character.level, character.className);
  const existingSlots = Array.isArray(character.spellSlots)
    ? character.spellSlots
    : [];

  return defaults.map((defaultSlot) => {
    const existingSlot = existingSlots.find(
      (slot) => slot.level === defaultSlot.level,
    );

    return {
      ...defaultSlot,
      used: Math.min(defaultSlot.max, Math.max(0, existingSlot?.used ?? 0)),
    };
  });
}

function hydrateCharacter(character: Character): Character {
  return {
    ...character,
    knownSpellIds: character.knownSpellIds ?? [],
    preparedSpellIds: character.preparedSpellIds ?? [],
    spellSlots: hydrateSpellSlots(character),
  };
}

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((character) => hydrateCharacter(character as Character));
  } catch {
    return [];
  }
}

export function saveCharacters(characters: Character[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(characters.map((character) => hydrateCharacter(character))),
  );
}

export function exportCharacters(characters: Character[]): void {
  const blob = new Blob(
    [
      JSON.stringify(
        characters.map((character) => hydrateCharacter(character)),
        null,
        2,
      ),
    ],
    {
      type: "application/json",
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `e4-dnd-characters-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  link.click();
  URL.revokeObjectURL(url);
}
