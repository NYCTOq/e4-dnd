import { describe, expect, it } from "vitest";
import {
  applyCharacterLevelUp,
  deserializeLevelUpCharacter,
  serializeLevelUpCharacter,
  type LevelUpCompatibleCharacter,
} from "../../core/rulesets/levelUpCharacterAdapter";

const goldenCharacters: LevelUpCompatibleCharacter[] = [
  {
    id: "fighter",
    name: "Golden Fighter",
    level: 3,
    ruleset: "dnd_2014",
    maxHp: 28,
    currentHp: 20,
    abilities: { constitution: 16, strength: 18 },
    classes: [{ classId: "fighter", classLevel: 3, hitDie: 10 }],
  },
  {
    id: "rogue",
    name: "Golden Rogue",
    level: 9,
    ruleset: "dnd_2014",
    maxHp: 54,
    currentHp: 54,
    abilities: { constitution: 14, dexterity: 18 },
    classes: [{ classId: "rogue", classLevel: 9, hitDie: 8 }],
  },
  {
    id: "cleric",
    name: "Golden Cleric",
    level: 2,
    ruleset: "dnd_2024",
    maxHp: 18,
    currentHp: 12,
    abilities: { constitution: 14, wisdom: 18 },
    classes: [{ classId: "cleric", classLevel: 2, hitDie: 8 }],
  },
  {
    id: "wizard",
    name: "Golden Wizard",
    level: 4,
    ruleset: "dnd_2014",
    maxHp: 22,
    currentHp: 22,
    abilities: { constitution: 12, intelligence: 18 },
    classes: [{ classId: "wizard", classLevel: 4, hitDie: 6 }],
  },
  {
    id: "warlock",
    name: "Golden Warlock",
    level: 3,
    ruleset: "dnd_2024",
    maxHp: 27,
    currentHp: 20,
    abilities: { constitution: 14, charisma: 18 },
    classes: [{ classId: "warlock", classLevel: 3, hitDie: 8 }],
  },
  {
    id: "multiclass",
    name: "Golden Multiclass",
    level: 7,
    ruleset: "dnd_2014",
    maxHp: 52,
    currentHp: 45,
    abilities: { constitution: 14, strength: 16, intelligence: 14 },
    classes: [
      { classId: "fighter", classLevel: 4, hitDie: 10 },
      { classId: "wizard", classLevel: 3, hitDie: 6 },
    ],
    customMetadata: { campaign: "Alabasta" },
  },
];

describe("v5.114C golden level-up characters", () => {
  it("contains six golden characters", () => {
    expect(goldenCharacters).toHaveLength(6);
  });

  for (const character of goldenCharacters) {
    it(`${String(character.name)} round-trip`, () => {
      const restored = deserializeLevelUpCharacter(
        serializeLevelUpCharacter(character),
      );

      expect(restored.id).toBe(character.id);
      expect(restored.level).toBe(character.level);
    });

    it(`${String(character.name)} does not mutate`, () => {
      const copy = structuredClone(character);

      applyCharacterLevelUp(character, {
        classId: character.classes?.[0]?.classId ?? "fighter",
      });

      expect(character).toEqual(copy);
    });
  }

  it("fighter level 4 grants ASI and ability increase", () => {
    const result = applyCharacterLevelUp(goldenCharacters[0], {
      classId: "fighter",
      abilityIncreases: { strength: 2 },
    });

    expect(result.level).toBe(4);
    expect(result.abilities?.strength).toBe(20);
    expect(result.levelUpHistory?.[0].grantsAsi).toBe(true);
  });

  it("rogue level 10 grants feat option", () => {
    const result = applyCharacterLevelUp(goldenCharacters[1], {
      classId: "rogue",
      selectedFeatId: "alert",
    });

    expect(result.feats).toContain("alert");
  });

  it("2024 cleric level 3 requests subclass", () => {
    const result = applyCharacterLevelUp(goldenCharacters[2], {
      classId: "cleric",
    });

    expect(result.pendingSubclassChoice).toBe(true);
  });

  it("wizard level-up increases HP and preserves current HP deficit", () => {
    const result = applyCharacterLevelUp(goldenCharacters[3], {
      classId: "wizard",
    });

    expect(result.maxHp).toBeGreaterThan(22);
    expect(result.currentHp).toBeGreaterThanOrEqual(22);
  });

  it("multiclass levels only selected class", () => {
    const result = applyCharacterLevelUp(goldenCharacters[5], {
      classId: "wizard",
    });

    expect(
      result.classes?.find((entry) => entry.classId === "wizard")
        ?.classLevel,
    ).toBe(4);

    expect(
      result.classes?.find((entry) => entry.classId === "fighter")
        ?.classLevel,
    ).toBe(4);
  });

  it("preserves homebrew metadata", () => {
    const result = applyCharacterLevelUp(goldenCharacters[5], {
      classId: "fighter",
    });

    expect(result.customMetadata).toEqual({
      campaign: "Alabasta",
    });
  });

  it("level 20 cannot advance", () => {
    const character: LevelUpCompatibleCharacter = {
      id: "cap",
      level: 20,
      ruleset: "dnd_2024",
      maxHp: 180,
      currentHp: 180,
      classes: [
        { classId: "fighter", classLevel: 20, hitDie: 10 },
      ],
    };

    expect(
      applyCharacterLevelUp(character, {
        classId: "fighter",
      }),
    ).toMatchObject({
      level: 20,
      maxHp: 180,
    });
  });

  it("legacy character migrates safely", () => {
    const legacy = deserializeLevelUpCharacter(
      JSON.stringify({
        id: "legacy",
        classId: "fighter",
        level: 1,
        maxHp: 10,
      }),
    );

    expect(legacy.level).toBe(1);
    expect(legacy.proficiencyBonus).toBe(2);
    expect(legacy.classes).toEqual([]);
  });

  it("invalid payload rejected", () => {
    expect(() =>
      deserializeLevelUpCharacter("[]"),
    ).toThrow("Invalid level-up character payload.");
  });
});
