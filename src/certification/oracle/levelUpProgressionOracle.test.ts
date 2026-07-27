import { describe, expect, it } from "vitest";
import {
  canLevelUp,
  canTakeAbilityScoreImprovement,
  cantripScalingTier,
  clampCharacterLevel,
  gainsSubclassAtLevel,
  hitPointsGainedOnLevelUp,
  nextCharacterLevel,
  progressionProficiencyBonus,
  spellSlotProgressionTier,
  subclassUnlockLevel,
  totalCharacterLevel,
} from "../reference/levelUpProgression.reference";

describe("v5.114A level-up progression oracle", () => {
  for (const [input, expected] of [
    [-10, 1],
    [0, 1],
    [1, 1],
    [5, 5],
    [20, 20],
    [30, 20],
  ] as const) {
    it(`clamps level ${input}`, () => {
      expect(clampCharacterLevel(input)).toBe(expected);
    });
  }

  for (let level = 1; level <= 20; level += 1) {
    it(`PB level ${level}`, () => {
      expect(progressionProficiencyBonus(level)).toBe(
        2 + Math.floor((level - 1) / 4),
      );
    });

    it(`next level ${level}`, () => {
      expect(nextCharacterLevel(level)).toBe(
        Math.min(20, level + 1),
      );
    });

    it(`can level ${level}`, () => {
      expect(canLevelUp(level)).toBe(level < 20);
    });

    it(`cantrip tier ${level}`, () => {
      expect(cantripScalingTier(level)).toBeGreaterThanOrEqual(1);
      expect(cantripScalingTier(level)).toBeLessThanOrEqual(4);
    });
  }

  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const classId of [
      "fighter",
      "rogue",
      "cleric",
      "wizard",
      "druid",
      "sorcerer",
      "warlock",
      "paladin",
      "ranger",
      "bard",
      "monk",
      "barbarian",
    ]) {
      it(`${ruleset} ${classId} subclass unlock`, () => {
        const unlock = subclassUnlockLevel(classId, ruleset);
        expect(unlock).toBeGreaterThanOrEqual(1);
        expect(unlock).toBeLessThanOrEqual(3);
      });

      for (let level = 1; level <= 20; level += 1) {
        it(`${ruleset} ${classId} ASI L${level}`, () => {
          expect(
            typeof canTakeAbilityScoreImprovement(classId, level),
          ).toBe("boolean");
        });

        it(`${ruleset} ${classId} subclass transition L${level}`, () => {
          expect(
            typeof gainsSubclassAtLevel(
              classId,
              ruleset,
              level - 1,
              level,
            ),
          ).toBe("boolean");
        });
      }
    }
  }

  for (const hitDie of [6, 8, 10, 12]) {
    for (const constitution of [6, 8, 10, 12, 14, 16, 18, 20]) {
      it(`HP d${hitDie} CON${constitution}`, () => {
        expect(
          hitPointsGainedOnLevelUp(
            hitDie,
            constitution,
          ),
        ).toBeGreaterThanOrEqual(1);
      });
    }
  }

  const multiclassLevelCases: Array<Record<string, number>> = [
    { fighter: 1 },
    { fighter: 5, wizard: 3 },
    { rogue: 10, ranger: 5, cleric: 5 },
    { wizard: -2, cleric: 4 },
  ];

  for (const levels of multiclassLevelCases) {
    it(`multiclass total ${JSON.stringify(levels)}`, () => {
      expect(totalCharacterLevel(levels)).toBeGreaterThanOrEqual(0);
    });
  }

  for (let casterLevel = 0; casterLevel <= 20; casterLevel += 1) {
    it(`caster tier ${casterLevel}`, () => {
      const tier = spellSlotProgressionTier(casterLevel);
      expect(tier).toBeGreaterThanOrEqual(0);
      expect(tier).toBeLessThanOrEqual(9);
    });
  }
});
