import type { Character } from "../core/character/character.types";
import type { CampaignEncounter } from "../features/campaigns/campaignTypes";
import type { DndMonsterData } from "../core/rulesets/ruleset.types";

export function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "character-1",
    name: "Test Hero",
    playerName: "Tester",
    ruleset: "dnd_2014",
    race: "Human",
    className: "Cleric",
    subclass: "Life",
    background: "Acolyte",
    featIds: [],
    level: 5,
    abilities: { str: 10, dex: 14, con: 14, int: 10, wis: 18, cha: 10 },
    maxHp: 38,
    currentHp: 20,
    tempHp: 0,
    armorClass: 18,
    armorClassMode: "manual",
    knownSpellIds: [],
    preparedSpellIds: [],
    spellSlots: [
      { level: 1, max: 4, used: 2 },
      { level: 2, max: 3, used: 1 },
      { level: 3, max: 2, used: 0 },
    ],
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: [],
    gold: 0,
    deathSaves: { successes: 0, failures: 0 },
    hitDice: [{ die: 8, max: 5, used: 2 }],
    resources: [],
    exhaustion: 0,
    conditionDurations: {},
    conditions: [],
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeEncounter(participants: CampaignEncounter["participants"]): CampaignEncounter {
  return {
    id: "encounter-1",
    name: "Test Encounter",
    round: 1,
    activeTurnIndex: 0,
    isActive: true,
    participants,
    rewards: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export function makeMonster(overrides: Partial<DndMonsterData> = {}): DndMonsterData {
  return {
    id: "monster-1",
    name: "Ogre",
    size: "Large",
    type: "giant",
    alignment: "chaotic evil",
    armorClass: 11,
    hitPoints: 59,
    hitDice: "7d10+21",
    speed: "40 ft.",
    challengeRating: "2",
    proficiencyBonus: 2,
    abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
    senses: "darkvision 60 ft.",
    languages: "Common, Giant",
    description: "",
    traits: [],
    actions: [],
    ...overrides,
  };
}
