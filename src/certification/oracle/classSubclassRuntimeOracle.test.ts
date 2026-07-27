import { describe, expect, it } from "vitest";
import {
  abilityModifier,
  classLevel,
  isFeatureUnlocked,
  normalizeActivation,
  proficiencyBonus,
  recoverFeatureUses,
  resolveLimitedUses,
  subclassFeatureLevels,
  totalCharacterLevel,
  unlockedFeatures,
  type ClassFeatureReference,
} from "../reference/classSubclassRuntime.reference";

describe("v5.112A class/subclass independent oracle", () => {
  for (const [level, expected] of [
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ] as const) {
    it(`PB level ${level}`, () => {
      expect(proficiencyBonus(level)).toBe(expected);
    });
  }

  for (const [score, expected] of [
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [14, 2],
    [16, 3],
    [18, 4],
    [20, 5],
    [30, 10],
  ] as const) {
    it(`ability modifier ${score}`, () => {
      expect(abilityModifier(score)).toBe(expected);
    });
  }

  const class2014 = {
    cleric: [1, 2, 6, 8, 17],
    sorcerer: [1, 6, 14, 18],
    warlock: [1, 6, 10, 14],
    wizard: [2, 6, 10, 14],
    druid: [2, 6, 10, 14],
    fighter: [3, 7, 10, 15, 18],
    rogue: [3, 9, 13, 17],
    barbarian: [3, 6, 11, 17],
  };

  for (const [classId, levels] of Object.entries(class2014)) {
    it(`2014 ${classId} subclass schedule`, () => {
      expect(subclassFeatureLevels("dnd_2014", classId)).toEqual(levels);
    });
  }

  for (const classId of [
    "barbarian",
    "bard",
    "cleric",
    "druid",
    "fighter",
    "monk",
    "paladin",
    "ranger",
    "rogue",
    "sorcerer",
    "warlock",
    "wizard",
  ]) {
    it(`2024 ${classId} subclass schedule`, () => {
      expect(subclassFeatureLevels("dnd_2024", classId)).toEqual([
        3, 6, 10, 14,
      ]);
    });
  }

  for (const featureLevel of [1, 2, 3, 5, 10, 17, 20]) {
    for (const classLvl of [0, 1, 2, 3, 5, 10, 17, 20]) {
      it(`unlock feature ${featureLevel} at class ${classLvl}`, () => {
        expect(isFeatureUnlocked(featureLevel, classLvl)).toBe(
          classLvl >= featureLevel,
        );
      });
    }
  }

  for (const characterLevel of [1, 5, 9, 13, 17, 20]) {
    it(`PB limited uses at ${characterLevel}`, () => {
      expect(
        resolveLimitedUses(
          { type: "proficiency-bonus" },
          { characterLevel, classLevel: characterLevel },
        ),
      ).toBe(proficiencyBonus(characterLevel));
    });
  }

  for (const score of [1, 8, 10, 12, 16, 20]) {
    it(`ability limited uses score ${score}`, () => {
      expect(
        resolveLimitedUses(
          {
            type: "ability-modifier",
            abilityScore: score,
            minimum: 1,
          },
          { characterLevel: 5, classLevel: 5 },
        ),
      ).toBe(Math.max(1, abilityModifier(score)));
    });
  }

  for (const level of [0, 1, 2, 3, 4, 5, 10, 20]) {
    it(`class divisor uses level ${level}`, () => {
      expect(
        resolveLimitedUses(
          {
            type: "class-level-divisor",
            divisor: 2,
            minimum: 1,
          },
          { characterLevel: level, classLevel: level },
        ),
      ).toBe(Math.max(1, Math.floor(level / 2)));
    });
  }

  for (const recovery of ["short", "long", "both", "manual"] as const) {
    for (const rest of ["short", "long"] as const) {
      it(`${recovery} recovery on ${rest}`, () => {
        const result = recoverFeatureUses(1, 4, recovery, rest);
        const expected =
          recovery === "both" ||
          recovery === rest ||
          (rest === "long" && recovery === "short")
            ? 4
            : 1;
        expect(result).toBe(expected);
      });
    }
  }

  for (const [input, expected] of [
    ["action", "action"],
    ["bonus action", "bonus-action"],
    ["bonus-action", "bonus-action"],
    ["bonus_action", "bonus-action"],
    ["reaction", "reaction"],
    ["passive", "passive"],
    ["none", "passive"],
    ["ritual", "special"],
    [undefined, "special"],
  ] as const) {
    it(`activation ${String(input)}`, () => {
      expect(normalizeActivation(input)).toBe(expected);
    });
  }

  it("multiclass totals use character level", () => {
    const levels = { fighter: 5, wizard: 3, rogue: 2 };
    expect(totalCharacterLevel(levels)).toBe(10);
    expect(classLevel(levels, "wizard")).toBe(3);
    expect(proficiencyBonus(totalCharacterLevel(levels))).toBe(4);
  });

  it("feature filtering uses class level, not total level", () => {
    const features: ClassFeatureReference[] = [
      {
        id: "fighter-5",
        classId: "fighter",
        level: 5,
        activation: "passive",
      },
      {
        id: "wizard-4",
        classId: "wizard",
        level: 4,
        activation: "passive",
      },
      {
        id: "wizard-3",
        classId: "wizard",
        level: 3,
        activation: "passive",
      },
    ];

    expect(
      unlockedFeatures(features, { fighter: 5, wizard: 3 }).map(
        (feature) => feature.id,
      ),
    ).toEqual(["fighter-5", "wizard-3"]);
  });
});
