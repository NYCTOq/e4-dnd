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
  type LimitedUseFormula,
} from "../reference/classSubclassRuntime.reference";
import {
  runtimeAbilityModifier,
  runtimeClassLevel,
  runtimeFeatureUnlocked,
  runtimeNormalizeActivation,
  runtimeProficiencyBonus,
  runtimeRecoverUses,
  runtimeResolveLimitedUses,
  runtimeSubclassFeatureLevels,
  runtimeTotalCharacterLevel,
  runtimeUnlockedFeatures,
  type LimitedUseRule,
  type RuntimeFeature,
} from "../../core/rulesets/classSubclassRuntimeRules";

describe("v5.112B class/subclass runtime differential", () => {
  for (const level of [-5, 0, 1, 2, 4, 5, 8, 9, 12, 13, 16, 17, 20, 30]) {
    it(`PB ${level}`, () => {
      expect(runtimeProficiencyBonus(level)).toBe(
        proficiencyBonus(level),
      );
    });
  }

  for (const score of [-5, 0, 1, 8, 9, 10, 11, 12, 16, 18, 20, 30]) {
    it(`ability ${score}`, () => {
      expect(runtimeAbilityModifier(score)).toBe(
        abilityModifier(score),
      );
    });
  }

  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
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
      "unknown",
    ]) {
      it(`${ruleset} ${classId} schedule`, () => {
        expect(
          runtimeSubclassFeatureLevels(ruleset, classId),
        ).toEqual(subclassFeatureLevels(ruleset, classId));
      });
    }
  }

  for (const featureLevel of [0, 1, 2, 3, 5, 10, 17, 20, 25]) {
    for (const current of [-2, 0, 1, 2, 3, 5, 10, 17, 20, 30]) {
      it(`unlock ${featureLevel}/${current}`, () => {
        expect(
          runtimeFeatureUnlocked(featureLevel, current),
        ).toBe(isFeatureUnlocked(featureLevel, current));
      });
    }
  }

  for (const characterLevel of [1, 4, 5, 9, 13, 17, 20]) {
    for (const classLvl of [0, 1, 3, 5, 10, 20]) {
      const rules: LimitedUseFormula[] = [
        { type: "fixed", value: 3 },
        { type: "proficiency-bonus" },
        {
          type: "ability-modifier",
          abilityScore: 16,
          minimum: 1,
        },
        {
          type: "class-level-divisor",
          divisor: 2,
          minimum: 1,
        },
        { type: "class-level" },
      ];

      for (const rule of rules) {
        it(`${rule.type} CL${characterLevel}/class${classLvl}`, () => {
          expect(
            runtimeResolveLimitedUses(
              rule as LimitedUseRule,
              {
                characterLevel,
                classLevel: classLvl,
              },
            ),
          ).toBe(
            resolveLimitedUses(rule, {
              characterLevel,
              classLevel: classLvl,
            }),
          );
        });
      }
    }
  }

  for (const recovery of ["short", "long", "both", "manual"] as const) {
    for (const rest of ["short", "long"] as const) {
      for (const current of [-2, 0, 1, 3, 5, 10]) {
        for (const maximum of [0, 1, 3, 5]) {
          it(`${recovery}/${rest}/${current}/${maximum}`, () => {
            expect(
              runtimeRecoverUses(
                current,
                maximum,
                recovery,
                rest,
              ),
            ).toBe(
              recoverFeatureUses(
                current,
                maximum,
                recovery,
                rest,
              ),
            );
          });
        }
      }
    }
  }

  for (const activation of [
    undefined,
    "",
    "action",
    "bonus action",
    "bonus-action",
    "bonus_action",
    "reaction",
    "passive",
    "none",
    "ritual",
  ]) {
    it(`activation ${String(activation)}`, () => {
      expect(runtimeNormalizeActivation(activation)).toBe(
        normalizeActivation(activation),
      );
    });
  }

  it("multiclass totals and individual class levels", () => {
    const levels = {
      fighter: 5,
      wizard: 3,
      rogue: 2,
      cleric: -4,
    };

    expect(runtimeTotalCharacterLevel(levels)).toBe(
      totalCharacterLevel(levels),
    );
    expect(runtimeClassLevel(levels, "wizard")).toBe(
      classLevel(levels, "wizard"),
    );
  });

  it("unlocked feature filtering matches oracle", () => {
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
        activation: "reaction",
      },
    ];

    expect(
      runtimeUnlockedFeatures(
        features as RuntimeFeature[],
        { fighter: 5, wizard: 3 },
      ).map((feature) => feature.id),
    ).toEqual(
      unlockedFeatures(
        features,
        { fighter: 5, wizard: 3 },
      ).map((feature) => feature.id),
    );
  });
});
