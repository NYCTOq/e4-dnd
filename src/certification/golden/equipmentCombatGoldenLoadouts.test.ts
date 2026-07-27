import { describe, expect, it } from "vitest";
import type { Character, CharacterDraft } from "../../core/character/character.types";
import type {
  DndItemData,
  DndSpellData,
  RulesetData,
} from "../../core/rulesets/ruleset.types";
import {
  calculateEffectiveArmorClass,
  getInventoryWeight,
  getWeaponAttackBonus,
  getWeaponDamageSummary,
} from "../../features/characters/characterShared";
import { getWeaponMastery } from "../../core/rulesets/equipmentRules";
import { getLevelOneCombatReadiness } from "../../core/rulesets/levelOneCombatReadiness";
import {
  REFERENCE_ITEMS,
  REFERENCE_SPELLS,
  type ReferenceItem,
} from "../reference/equipmentCombat.reference";

type RulesetId = "dnd_2014" | "dnd_2024";

type GoldenLoadout = {
  id: string;
  name: string;
  className: string;
  ruleset: RulesetId;
  level: number;
  str: number;
  dex: number;
  maxHp: number;
  armorClassMode: "manual" | "auto";
  manualArmorClass?: number;
  inventory: Array<{ itemId: string; quantity: number }>;
  equippedArmorId: string | null;
  equippedShieldId: string | null;
  equippedWeaponIds: string[];
  fightingStyleIds: string[];
  knownSpellIds: string[];
  preparedSpellIds: string[];
  alwaysPreparedSpellIds?: string[];
  gold: number;
  expected: {
    ready: boolean;
    armorClass: number;
    weight: number;
    primaryOption: string;
    weaponId?: string;
    attackBonus?: number;
    damage?: string;
    mastery?: string | null;
    blockerCount?: number;
    noticeCount?: number;
  };
};

function toActualItem(item: ReferenceItem): DndItemData {
  const properties = [...(item.properties ?? [])];

  if (item.versatileDamage) {
    const filtered = properties.filter(
      (property) => property.toLowerCase() !== "versatile",
    );
    properties.length = 0;
    properties.push(...filtered, `versatile (${item.versatileDamage})`);
  }

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    cost: "0 gp",
    weight: item.weight,
    damage: item.damage,
    damageType: item.damageType,
    properties,
    range: item.range,
    attackBonus: item.attackBonus,
    damageBonus: item.damageBonus,
    armorClass: item.armorClass,
    armorClassBonus: item.armorClassBonus,
    armorType: item.armorType,
    dexBonusMax: item.dexBonusMax,
    mastery: item.mastery,
    description: "",
    tags: [],
  } as unknown as DndItemData;
}

const ITEMS = REFERENCE_ITEMS.map(toActualItem);

const RULESET_DATA = {
  id: "golden-certification",
  name: "Golden Certification Ruleset",
  version: "1",
  classes: [],
  races: [],
  backgrounds: [],
  feats: [],
  spells: REFERENCE_SPELLS as DndSpellData[],
  items: ITEMS,
} as unknown as RulesetData;

function toCharacter(loadout: GoldenLoadout): Character {
  const armorClass =
    loadout.armorClassMode === "manual"
      ? loadout.manualArmorClass ?? 10
      : 10;

  return {
    id: loadout.id,
    name: loadout.name,
    playerName: "Certification",
    ruleset: loadout.ruleset,
    race: "Human",
    subrace: "",
    className: loadout.className,
    subclass: "",
    background: "Soldier",
    level: loadout.level,
    abilities: {
      str: loadout.str,
      dex: loadout.dex,
      con: 14,
      int: 10,
      wis: 14,
      cha: 12,
    },
    featIds: [],
    fightingStyleIds: loadout.fightingStyleIds,
    masteredWeaponIds: [],
    skillProficiencies: [],
    expertiseSkills: [],
    toolProficiencies: [],
    languages: [],
    maxHp: loadout.maxHp,
    currentHp: loadout.maxHp,
    tempHp: 0,
    armorClass,
    armorClassMode: loadout.armorClassMode,
    knownSpellIds: loadout.knownSpellIds,
    preparedSpellIds: loadout.preparedSpellIds,
    spellSources: {},
    classKnownSpellIds: {},
    classPreparedSpellIds: {},
    spellSlots: [],
    inventory: loadout.inventory,
    equippedArmorId: loadout.equippedArmorId,
    equippedShieldId: loadout.equippedShieldId,
    equippedWeaponIds: loadout.equippedWeaponIds,
    gold: loadout.gold,
    deathSaves: { successes: 0, failures: 0 },
    hitDice: [{ die: 10, max: loadout.level, used: 0 }],
    exhaustion: 0,
    conditionDurations: {},
    notes: "",
    resources: [],
    conditions: [],
    activeSpellEffects: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as Character;
}

function itemById(id: string) {
  const found = ITEMS.find((item) => item.id === id);
  if (!found) throw new Error(`Golden item missing: ${id}`);
  return found;
}

const GOLDEN_LOADOUTS: GoldenLoadout[] = [
  {
    id: "fighter-sword-shield-2014",
    name: "2014 Sword & Shield Fighter",
    className: "Fighter",
    ruleset: "dnd_2014",
    level: 1,
    str: 16,
    dex: 12,
    maxHp: 12,
    armorClassMode: "auto",
    inventory: [
      { itemId: "longsword", quantity: 1 },
      { itemId: "chain-mail", quantity: 1 },
      { itemId: "shield", quantity: 1 },
    ],
    equippedArmorId: "chain-mail",
    equippedShieldId: "shield",
    equippedWeaponIds: ["longsword"],
    fightingStyleIds: ["defense"],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 10,
    expected: {
      ready: true,
      armorClass: 19,
      weight: 64,
      primaryOption: "Longsword",
      weaponId: "longsword",
      attackBonus: 5,
      damage: "1d8 +3 slashing",
      mastery: null,
    },
  },
  {
    id: "fighter-sword-shield-2024",
    name: "2024 Sword & Shield Fighter",
    className: "Fighter",
    ruleset: "dnd_2024",
    level: 1,
    str: 16,
    dex: 12,
    maxHp: 12,
    armorClassMode: "auto",
    inventory: [
      { itemId: "longsword", quantity: 1 },
      { itemId: "chain-mail", quantity: 1 },
      { itemId: "shield", quantity: 1 },
    ],
    equippedArmorId: "chain-mail",
    equippedShieldId: "shield",
    equippedWeaponIds: ["longsword"],
    fightingStyleIds: ["dueling"],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 10,
    expected: {
      ready: true,
      armorClass: 18,
      weight: 64,
      primaryOption: "Longsword",
      weaponId: "longsword",
      attackBonus: 5,
      damage: "1d8 +5 slashing",
      mastery: "Sap",
    },
  },
  {
    id: "archer-fighter-2024",
    name: "2024 Archer Fighter",
    className: "Fighter",
    ruleset: "dnd_2024",
    level: 5,
    str: 10,
    dex: 18,
    maxHp: 44,
    armorClassMode: "auto",
    inventory: [
      { itemId: "longbow", quantity: 1 },
      { itemId: "leather", quantity: 1 },
    ],
    equippedArmorId: "leather",
    equippedShieldId: null,
    equippedWeaponIds: ["longbow"],
    fightingStyleIds: ["archery"],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 25,
    expected: {
      ready: true,
      armorClass: 15,
      weight: 12,
      primaryOption: "Longbow",
      weaponId: "longbow",
      attackBonus: 9,
      damage: "1d8 +4 piercing",
      mastery: "Slow",
    },
  },
  {
    id: "rogue-rapier-2014",
    name: "2014 Rapier Rogue",
    className: "Rogue",
    ruleset: "dnd_2014",
    level: 3,
    str: 10,
    dex: 18,
    maxHp: 24,
    armorClassMode: "auto",
    inventory: [
      { itemId: "rapier", quantity: 1 },
      { itemId: "leather", quantity: 1 },
    ],
    equippedArmorId: "leather",
    equippedShieldId: null,
    equippedWeaponIds: ["rapier"],
    fightingStyleIds: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 18,
    expected: {
      ready: true,
      armorClass: 15,
      weight: 12,
      primaryOption: "Rapier",
      weaponId: "rapier",
      attackBonus: 6,
      damage: "1d8 +4 piercing",
      mastery: null,
    },
  },
  {
    id: "barbarian-greatsword-2024",
    name: "2024 Greatsword Barbarian",
    className: "Barbarian",
    ruleset: "dnd_2024",
    level: 5,
    str: 18,
    dex: 14,
    maxHp: 55,
    armorClassMode: "manual",
    manualArmorClass: 15,
    inventory: [{ itemId: "greatsword", quantity: 1 }],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: ["greatsword"],
    fightingStyleIds: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 7,
    expected: {
      ready: true,
      armorClass: 15,
      weight: 6,
      primaryOption: "Greatsword",
      weaponId: "greatsword",
      attackBonus: 7,
      damage: "2d6 +4 slashing",
      mastery: "Graze",
    },
  },
  {
    id: "monk-unarmed-2014",
    name: "2014 Unarmed Monk",
    className: "Monk",
    ruleset: "dnd_2014",
    level: 1,
    str: 10,
    dex: 16,
    maxHp: 10,
    armorClassMode: "manual",
    manualArmorClass: 15,
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: [],
    fightingStyleIds: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 0,
    expected: {
      ready: true,
      armorClass: 15,
      weight: 0,
      primaryOption: "Martial Arts / Unarmed Strike",
      noticeCount: 1,
    },
  },
  {
    id: "wizard-fire-bolt-2014",
    name: "2014 Fire Bolt Wizard",
    className: "Wizard",
    ruleset: "dnd_2014",
    level: 1,
    str: 8,
    dex: 14,
    maxHp: 8,
    armorClassMode: "manual",
    manualArmorClass: 12,
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: [],
    fightingStyleIds: [],
    knownSpellIds: ["fire-bolt"],
    preparedSpellIds: [],
    gold: 5,
    expected: {
      ready: true,
      armorClass: 12,
      weight: 0,
      primaryOption: "Fire Bolt",
    },
  },
  {
    id: "cleric-sacred-flame-2024",
    name: "2024 Sacred Flame Cleric",
    className: "Cleric",
    ruleset: "dnd_2024",
    level: 1,
    str: 12,
    dex: 10,
    maxHp: 10,
    armorClassMode: "auto",
    inventory: [
      { itemId: "scale-mail", quantity: 1 },
      { itemId: "shield", quantity: 1 },
    ],
    equippedArmorId: "scale-mail",
    equippedShieldId: "shield",
    equippedWeaponIds: [],
    fightingStyleIds: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    alwaysPreparedSpellIds: ["sacred-flame"],
    gold: 10,
    expected: {
      ready: true,
      armorClass: 16,
      weight: 51,
      primaryOption: "Sacred Flame",
    },
  },
  {
    id: "invalid-missing-weapon",
    name: "Invalid Missing Weapon",
    className: "Fighter",
    ruleset: "dnd_2024",
    level: 1,
    str: 16,
    dex: 12,
    maxHp: 12,
    armorClassMode: "manual",
    manualArmorClass: 16,
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: ["longsword"],
    fightingStyleIds: [],
    knownSpellIds: [],
    preparedSpellIds: [],
    gold: 0,
    expected: {
      ready: false,
      armorClass: 16,
      weight: 0,
      primaryOption: "",
      blockerCount: 1,
      noticeCount: 2,
    },
  },
  {
    id: "invalid-zero-hp",
    name: "Invalid Zero HP",
    className: "Wizard",
    ruleset: "dnd_2014",
    level: 1,
    str: 8,
    dex: 14,
    maxHp: 0,
    armorClassMode: "manual",
    manualArmorClass: 12,
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    equippedWeaponIds: [],
    fightingStyleIds: [],
    knownSpellIds: ["fire-bolt"],
    preparedSpellIds: [],
    gold: 5,
    expected: {
      ready: false,
      armorClass: 12,
      weight: 0,
      primaryOption: "Fire Bolt",
      blockerCount: 1,
    },
  },
];

describe("v5.110C golden loadout & combat readiness certification", () => {
  it("contains broad golden character coverage", () => {
    expect(GOLDEN_LOADOUTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(GOLDEN_LOADOUTS.map((loadout) => loadout.id)).size).toBe(
      GOLDEN_LOADOUTS.length,
    );
  });

  for (const loadout of GOLDEN_LOADOUTS) {
    describe(`${loadout.name} [${loadout.ruleset}]`, () => {
      const character = toCharacter(loadout);

      it("certifies effective armor class", () => {
        expect(calculateEffectiveArmorClass(character, ITEMS)).toBe(
          loadout.expected.armorClass,
        );
      });

      it("certifies total inventory weight", () => {
        expect(getInventoryWeight(character.inventory, ITEMS)).toBe(
          loadout.expected.weight,
        );
      });

      it("certifies combat readiness", () => {
        const readiness = getLevelOneCombatReadiness(
          character as unknown as CharacterDraft,
          RULESET_DATA,
          loadout.alwaysPreparedSpellIds ?? [],
        );

        expect(readiness.ready).toBe(loadout.expected.ready);

        if (loadout.expected.primaryOption) {
          expect(readiness.primaryOptions).toContain(
            loadout.expected.primaryOption,
          );
        } else {
          expect(readiness.primaryOptions).toHaveLength(0);
        }

        if (loadout.expected.blockerCount !== undefined) {
          expect(readiness.blockers).toHaveLength(
            loadout.expected.blockerCount,
          );
        }

        if (loadout.expected.noticeCount !== undefined) {
          expect(readiness.notices).toHaveLength(
            loadout.expected.noticeCount,
          );
        }
      });

      if (loadout.expected.weaponId) {
        it("certifies weapon attack, damage and mastery", () => {
          const weapon = itemById(loadout.expected.weaponId!);

          expect(getWeaponAttackBonus(character, weapon)).toBe(
            loadout.expected.attackBonus,
          );

          expect(getWeaponDamageSummary(character, weapon)).toBe(
            loadout.expected.damage,
          );

          expect(getWeaponMastery(weapon, loadout.ruleset)).toBe(
            loadout.expected.mastery,
          );
        });
      }
    });
  }
});
