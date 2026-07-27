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
import {
  runtimeAsiLevel,
  runtimeCanLevelUp,
  runtimeCantripTier,
  runtimeClampLevel,
  runtimeGainsSubclass,
  runtimeLevelUpHpGain,
  runtimeNextLevel,
  runtimeProgressionPb,
  runtimeSpellTier,
  runtimeSubclassUnlockLevel,
  runtimeTotalLevel,
} from "../../core/rulesets/levelUpProgressionRules";

const classes = [
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
];

describe("v5.114B level-up progression differential", () => {
  for (const level of [-20, -1, 0, 1, 2, 4, 5, 8, 9, 13, 17, 20, 25]) {
    it(`clamp ${level}`, () => {
      expect(runtimeClampLevel(level)).toBe(
        clampCharacterLevel(level),
      );
    });

    it(`PB ${level}`, () => {
      expect(runtimeProgressionPb(level)).toBe(
        progressionProficiencyBonus(level),
      );
    });

    it(`next ${level}`, () => {
      expect(runtimeNextLevel(level)).toBe(
        nextCharacterLevel(level),
      );
    });

    it(`can-level ${level}`, () => {
      expect(runtimeCanLevelUp(level)).toBe(
        canLevelUp(level),
      );
    });

    it(`cantrip ${level}`, () => {
      expect(runtimeCantripTier(level)).toBe(
        cantripScalingTier(level),
      );
    });
  }

  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const classId of classes) {
      it(`${ruleset}/${classId}/unlock`, () => {
        expect(
          runtimeSubclassUnlockLevel(classId, ruleset),
        ).toBe(
          subclassUnlockLevel(classId, ruleset),
        );
      });

      for (let level = 1; level <= 20; level += 1) {
        it(`${ruleset}/${classId}/ASI/${level}`, () => {
          expect(runtimeAsiLevel(classId, level)).toBe(
            canTakeAbilityScoreImprovement(classId, level),
          );
        });

        it(`${ruleset}/${classId}/subclass/${level}`, () => {
          expect(
            runtimeGainsSubclass(
              classId,
              ruleset,
              level - 1,
              level,
            ),
          ).toBe(
            gainsSubclassAtLevel(
              classId,
              ruleset,
              level - 1,
              level,
            ),
          );
        });
      }
    }
  }

  for (const hitDie of [4, 6, 8, 10, 12, 20]) {
    for (const constitution of [1, 6, 8, 10, 12, 14, 16, 18, 20, 30]) {
      for (const fixed of [false, true]) {
        it(`HP/${hitDie}/${constitution}/${fixed}`, () => {
          expect(
            runtimeLevelUpHpGain(
              hitDie,
              constitution,
              fixed,
            ),
          ).toBe(
            hitPointsGainedOnLevelUp(
              hitDie,
              constitution,
              fixed,
            ),
          );
        });
      }
    }
  }

  const multiclassCases: Array<Record<string, number>> = [
    {},
    { fighter: 1 },
    { fighter: 5, wizard: 3 },
    { rogue: 10, ranger: 5, cleric: 5 },
    { wizard: -2, cleric: 4 },
    { fighter: 20, wizard: 20 },
  ];

  for (const levels of multiclassCases) {
    it(`total/${JSON.stringify(levels)}`, () => {
      expect(runtimeTotalLevel(levels)).toBe(
        totalCharacterLevel(levels),
      );
    });
  }

  for (const level of [-5, 0, 1, 2, 5, 9, 10, 17, 20, 30]) {
    it(`spell-tier/${level}`, () => {
      expect(runtimeSpellTier(level)).toBe(
        spellSlotProgressionTier(level),
      );
    });
  }
});
