import { describe, expect, it } from "vitest";
import type { Character } from "../../core/character/character.types";
import { getCharacterJourneySnapshot } from "../../core/character/playerJourneyConsistency";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { buildCharacterDerivedStatsOracle } from "../oracle/characterDerivedStatsOracle";

const editions = ["dnd_2014", "dnd_2024"] as const;
const levels = [1, 2, 4, 5, 8, 9, 12, 13, 16, 17, 19, 20];
const abilities = [
  { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
  { str: 8, dex: 16, con: 14, int: 18, wis: 12, cha: 10 },
  { str: 10, dex: 14, con: 12, int: 8, wis: 16, cha: 18 },
] as const;

function scenario(index: number, edition: typeof editions[number]) {
  const level = levels[index % levels.length];
  const className = ["Fighter", "Wizard", "Bard"][index % 3];
  const score = abilities[(index * 5) % abilities.length];
  const featIds = [
    ...(index % 4 === 0 ? ["alert"] : []),
    ...(index % 5 === 0 ? ["observant"] : []),
    ...(index % 6 === 0 ? ["mobile"] : []),
  ];
  const data = {
    classes: [
      { name: "Fighter", spellcastingAbility: null, savingThrows: ["str", "con"] },
      { name: "Wizard", spellcastingAbility: "int", savingThrows: ["int", "wis"] },
      { name: "Bard", spellcastingAbility: "cha", savingThrows: ["dex", "cha"] },
    ],
    races: [{ name: "Human", speed: 30 }],
    backgrounds: [],
    feats: [
      { id: "alert", name: "Alert" },
      { id: "observant", name: "Observant" },
      { id: "mobile", name: "Mobile" },
    ],
    items: [
      { id: "leather", category: "armor", armorClass: 11, armorType: "light" },
      { id: "scale", category: "armor", armorClass: 14, armorType: "medium", dexBonusMax: 2 },
      { id: "chain", category: "armor", armorClass: 16, armorType: "heavy" },
      { id: "shield", category: "shield", armorClassBonus: 2 },
      { id: "luck", category: "gear", armorBonus: 1 },
    ],
  } as unknown as RulesetData;
  const armor = ["leather", "scale", "chain"][index % 3];
  const character = {
    id: `${edition}-${index}`, name: "Matrix", playerName: "QA", ruleset: edition,
    race: "Human", className, classLevels: [{ className, level }], subclass: "",
    background: "", featIds, skillProficiencies: index % 2 ? ["Perception", "Arcana"] : ["Stealth"],
    expertiseSkills: index % 7 === 0 ? ["Arcana"] : [], toolProficiencies: [], languages: [],
    level, abilities: { ...score }, maxHp: 10 + level, currentHp: 10 + level, tempHp: 0,
    armorClass: 12, armorClassMode: index % 8 === 0 ? "manual" : "auto",
    knownSpellIds: [], preparedSpellIds: [], spellSlots: [],
    inventory: index % 3 === 0 ? [{ itemId: "luck", quantity: 1, attuned: true }] : [],
    equippedArmorId: armor, equippedShieldId: index % 2 === 0 ? "shield" : null,
    equippedWeaponIds: [], fightingStyleIds: index % 9 === 0 ? ["defense"] : [],
    gold: 0, deathSaves: { successes: 0, failures: 0 }, hitDice: [], resources: [],
    exhaustion: 0, conditionDurations: {}, conditions: [], notes: "",
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  } as Character;
  return { character, data };
}

describe("v5.118B character derived stats 480-scenario matrix", () => {
  it("matches the independent oracle in both editions", () => {
    let checked = 0;
    for (const edition of editions) {
      for (let index = 0; index < 240; index += 1) {
        const { character, data } = scenario(index, edition);
        const expected = buildCharacterDerivedStatsOracle(character, data);
        const actual = getCharacterJourneySnapshot(character, data);
        for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
          expect(actual[key], `${edition} scenario ${index + 1} ${String(key)}`).toEqual(expected[key]);
        }
        checked += 1;
      }
    }
    expect(checked).toBe(480);
  });
});
