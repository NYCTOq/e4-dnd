import { describe, expect, it } from "vitest";
import {
  runtimeApplySingleClassLevelUp,
  runtimeBuildMilestone,
  runtimeCanLevelUp,
  runtimeTotalLevel,
  type LevelUpCharacterState,
} from "../../core/rulesets/levelUpProgressionRules";

const classes = [
  ["fighter", 10],
  ["rogue", 8],
  ["cleric", 8],
  ["wizard", 6],
  ["druid", 8],
  ["sorcerer", 6],
  ["warlock", 8],
  ["paladin", 10],
  ["ranger", 10],
  ["bard", 8],
  ["monk", 8],
  ["barbarian", 12],
] as const;

describe("v5.114B level-up progression scenario matrix", () => {
  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const [classId, hitDie] of classes) {
      for (const currentLevel of [1, 2, 3, 4, 5, 8, 10, 11, 16, 19, 20]) {
        it(`${ruleset}/${classId}/L${currentLevel}`, () => {
          const character: LevelUpCharacterState = {
            level: currentLevel,
            ruleset,
            constitutionScore: 14,
            maxHp: Math.max(1, currentLevel * 8),
            classes: [
              {
                classId,
                classLevel: currentLevel,
                hitDie,
              },
            ],
          };

          const next = runtimeApplySingleClassLevelUp(
            character,
            classId,
          );

          if (currentLevel < 20) {
            expect(next.level).toBe(currentLevel + 1);
            expect(next.maxHp).toBeGreaterThan(
              character.maxHp,
            );
          } else {
            expect(next).toEqual(character);
          }

          expect(character.level).toBe(currentLevel);
        });
      }
    }
  }

  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const [classId] of classes) {
      for (let nextLevel = 1; nextLevel <= 20; nextLevel += 1) {
        it(`milestone/${ruleset}/${classId}/${nextLevel}`, () => {
          const milestone = runtimeBuildMilestone(
            classId,
            ruleset,
            nextLevel - 1,
            nextLevel,
          );

          expect(milestone.level).toBe(nextLevel);
          expect(milestone.proficiencyBonus).toBeGreaterThanOrEqual(2);
          expect(milestone.proficiencyBonus).toBeLessThanOrEqual(6);
          expect(milestone.cantripTier).toBeGreaterThanOrEqual(1);
          expect(milestone.spellTier).toBeGreaterThanOrEqual(0);
        });
      }
    }
  }

  const multiclassCases: Array<Record<string, number>> = [
    { fighter: 1, wizard: 1 },
    { rogue: 3, ranger: 2 },
    { cleric: 10, fighter: 5 },
    { paladin: 6, warlock: 4, sorcerer: 10 },
    { barbarian: 20 },
  ];

  for (const levels of multiclassCases) {
    it(`multiclass/${JSON.stringify(levels)}`, () => {
      const total = runtimeTotalLevel(levels);
      expect(total).toBeGreaterThanOrEqual(1);
      expect(runtimeCanLevelUp(total)).toBe(total < 20);
    });
  }
});
