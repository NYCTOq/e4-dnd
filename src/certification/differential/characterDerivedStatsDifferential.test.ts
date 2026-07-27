import { describe, expect, it } from "vitest";
import type { Character } from "../../core/character/character.types";
import { getCharacterJourneySnapshot } from "../../core/character/playerJourneyConsistency";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { buildCharacterDerivedStatsOracle } from "../oracle/characterDerivedStatsOracle";

export function compareDerivedStats(character: Character, data: RulesetData) {
  const expected = buildCharacterDerivedStatsOracle(character, data);
  const actual = getCharacterJourneySnapshot(character, data);
  return {
    expected,
    actual,
    differences: (Object.keys(expected) as Array<keyof typeof expected>)
      .filter((key) => JSON.stringify(expected[key]) !== JSON.stringify(actual[key])),
  };
}

describe("v5.118B derived stats differential", () => {
  it("matches canonical and runtime snapshots for a trained caster", () => {
    const data = {
      classes: [{ name: "Cleric", spellcastingAbility: "wis", savingThrows: ["wis", "cha"] }],
      races: [{ name: "Dwarf", speed: 25 }], backgrounds: [], feats: [], items: [],
    } as unknown as RulesetData;
    const character = {
      className: "Cleric", classLevels: [{ className: "Cleric", level: 8 }], level: 8,
      ruleset: "dnd_2014", race: "Dwarf", background: "", featIds: [],
      abilities: { str: 14, dex: 10, con: 16, int: 8, wis: 18, cha: 12 },
      skillProficiencies: ["Perception"], expertiseSkills: [], armorClass: 18,
      armorClassMode: "manual", equippedArmorId: null, equippedShieldId: null,
      equippedWeaponIds: [], fightingStyleIds: [], inventory: [], resources: [],
    } as unknown as Character;
    expect(compareDerivedStats(character, data).differences).toEqual([]);
  });
});
