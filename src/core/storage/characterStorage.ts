import type {
  Character,
  CharacterConditionDurations,
  CharacterHitDiePool,
  CharacterInventoryItem,
  CharacterSpellSlot,
  CharacterResource,
} from "../character/character.types";
import { readJsonSafely, writeJsonSafely } from "./safeStorage";
import { normalizeRulesetId } from "../rulesets/rulesetMigration";
import { getClassResources, mergeClassResources } from "../rulesets/classFeatureEngine";

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

const HIT_DIE_BY_CLASS: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.floor(value)))
    : fallback;
}

function inferHitDie(className: string) {
  return HIT_DIE_BY_CLASS[className.trim().toLowerCase()] ?? 8;
}

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

function hydrateInventory(character: Character): CharacterInventoryItem[] {
  if (!Array.isArray(character.inventory)) {
    return [];
  }

  return character.inventory
    .filter(
      (item) =>
        typeof item.itemId === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    )
    .map((item) => ({
      itemId: item.itemId,
      quantity: Math.max(1, Math.floor(item.quantity)),
      notes: item.notes ?? "",
    }));
}

function hydrateHitDice(character: Character): CharacterHitDiePool[] {
  const die = inferHitDie(character.className);
  const level = clampNumber(character.level, 1, 20, 1);
  const existing = Array.isArray(character.hitDice) ? character.hitDice : [];
  const existingPool = existing.find((pool) => pool.die === die) ?? existing[0];

  return [
    {
      die,
      max: level,
      used: Math.min(level, Math.max(0, existingPool?.used ?? 0)),
    },
  ];
}


function hydrateResources(character: Character): CharacterResource[] {
  if (!Array.isArray(character.resources)) return [];
  return character.resources
    .filter((resource) => resource && typeof resource.id === "string" && typeof resource.name === "string")
    .map((resource) => ({
      id: resource.id,
      name: resource.name.trim() || "Adsız kaynak",
      max: clampNumber(resource.max, 1, 999, 1),
      used: clampNumber(resource.used, 0, clampNumber(resource.max, 1, 999, 1), 0),
      recovery: resource.recovery === "short" || resource.recovery === "long" ? resource.recovery : "manual",
    }));
}

function hydrateConditionDurations(character: Character): CharacterConditionDurations {
  const durations = character.conditionDurations ?? {};
  const activeConditions = new Set(character.conditions ?? []);

  return Object.fromEntries(
    Object.entries(durations)
      .filter(([condition]) => activeConditions.has(condition as Character["conditions"][number]))
      .map(([condition, rounds]) => [
        condition,
        clampNumber(rounds, 0, 999, 0),
      ]),
  ) as CharacterConditionDurations;
}

function hydrateCharacter(character: Character): Character {
  const inventory = hydrateInventory(character);
  const inventoryItemIds = new Set(inventory.map((item) => item.itemId));

  return {
    ...character,
    ruleset: normalizeRulesetId(character.ruleset),
    knownSpellIds: character.knownSpellIds ?? [],
    preparedSpellIds: character.preparedSpellIds ?? [],
    featIds: Array.isArray(character.featIds) ? character.featIds.filter((id): id is string => typeof id === "string") : [],
    fightingStyleIds: Array.isArray(character.fightingStyleIds) ? [...new Set(character.fightingStyleIds.filter((id): id is string => typeof id === "string"))] : [],
    masteredWeaponIds: Array.isArray(character.masteredWeaponIds) ? [...new Set(character.masteredWeaponIds.filter((id): id is string => typeof id === "string"))] : [],
    metamagicIds: Array.isArray(character.metamagicIds) ? [...new Set(character.metamagicIds.filter((id): id is string => typeof id === "string"))] : [],
    invocationIds: Array.isArray(character.invocationIds) ? [...new Set(character.invocationIds.filter((id): id is string => typeof id === "string"))] : [],
    wildShapeFormIds: Array.isArray(character.wildShapeFormIds) ? [...new Set(character.wildShapeFormIds.filter((id): id is string => typeof id === "string"))] : [],
    skillProficiencies: Array.isArray(character.skillProficiencies) ? [...new Set(character.skillProficiencies.filter((value): value is string => typeof value === "string"))] : [],
    expertiseSkills: Array.isArray(character.expertiseSkills) ? [...new Set(character.expertiseSkills.filter((value): value is string => typeof value === "string"))] : [],
    toolProficiencies: Array.isArray(character.toolProficiencies) ? [...new Set(character.toolProficiencies.filter((value): value is string => typeof value === "string"))] : [],
    languages: Array.isArray(character.languages) ? [...new Set(character.languages.filter((value): value is string => typeof value === "string"))] : [],
    spellSlots: hydrateSpellSlots(character),
    inventory,
    equippedArmorId:
      character.equippedArmorId && inventoryItemIds.has(character.equippedArmorId)
        ? character.equippedArmorId
        : null,
    equippedShieldId:
      character.equippedShieldId && inventoryItemIds.has(character.equippedShieldId)
        ? character.equippedShieldId
        : null,
    equippedWeaponIds: Array.isArray(character.equippedWeaponIds)
      ? character.equippedWeaponIds.filter((itemId) => inventoryItemIds.has(itemId))
      : [],
    gold: typeof character.gold === "number" ? Math.max(0, character.gold) : 0,
    armorClassMode: character.armorClassMode === "auto" ? "auto" : "manual",
    deathSaves: {
      successes: clampNumber(character.deathSaves?.successes, 0, 3, 0),
      failures: clampNumber(character.deathSaves?.failures, 0, 3, 0),
    },
    hitDice: hydrateHitDice(character),
    resources: mergeClassResources(hydrateResources(character), getClassResources(character.className, character.level, character.abilities, normalizeRulesetId(character.ruleset))),
    exhaustion: clampNumber(character.exhaustion, 0, 6, 0),
    conditionDurations: hydrateConditionDurations(character),
  };
}

export function loadCharacters(): Character[] {
  const parsed = readJsonSafely<unknown[]>(
    STORAGE_KEY,
    [],
    (value): value is unknown[] => Array.isArray(value),
  );

  return parsed
    .filter((character) => Boolean(character) && typeof character === "object")
    .map((character) => hydrateCharacter(character as Character));
}

export function saveCharacters(characters: Character[]): void {
  writeJsonSafely(
    STORAGE_KEY,
    characters.map((character) => hydrateCharacter(character)),
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
