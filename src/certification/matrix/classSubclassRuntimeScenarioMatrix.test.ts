import { describe, expect, it } from "vitest";
import {
  normalizeRuntimeFeature,
  runtimeFeatureUnlocked,
  runtimeRecoverFeature,
  runtimeResolveLimitedUses,
  runtimeSubclassFeatureLevels,
  runtimeTotalCharacterLevel,
  runtimeUnlockedFeatures,
  type RuntimeFeature,
} from "../../core/rulesets/classSubclassRuntimeRules";

describe("v5.112B class/subclass runtime scenario matrix", () => {
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
    ]) {
      for (const level of [1, 2, 3, 5, 6, 10, 14, 17, 20]) {
        it(`${ruleset} ${classId} L${level}`, () => {
          const schedule = runtimeSubclassFeatureLevels(
            ruleset,
            classId,
          );

          const unlocked = schedule.filter((featureLevel) =>
            runtimeFeatureUnlocked(featureLevel, level),
          );

          expect(unlocked.every((entry) => entry <= level)).toBe(true);
          expect(schedule).toEqual(
            [...schedule].sort((a, b) => a - b),
          );
        });
      }
    }
  }

  for (const classLevel of [0, 1, 2, 3, 5, 10, 15, 20]) {
    for (const abilityScore of [1, 8, 10, 12, 16, 20, 30]) {
      it(`uses class${classLevel} ability${abilityScore}`, () => {
        expect(
          runtimeResolveLimitedUses(
            {
              type: "ability-modifier",
              abilityScore,
              minimum: 1,
            },
            {
              characterLevel: classLevel,
              classLevel,
            },
          ),
        ).toBeGreaterThanOrEqual(1);
      });
    }
  }

  for (const rest of ["short", "long"] as const) {
    for (const recovery of ["short", "long", "both", "manual"] as const) {
      for (const currentUses of [0, 1, 2, 5, 10]) {
        it(`${rest} ${recovery} current${currentUses}`, () => {
          const result = runtimeRecoverFeature(
            {
              id: "resource",
              classId: "fighter",
              level: 1,
              activation: "bonus-action",
              currentUses,
              maxUses: 5,
              recovery,
            },
            rest,
          );

          expect(result.currentUses).toBeGreaterThanOrEqual(0);
          expect(result.currentUses).toBeLessThanOrEqual(5);
        });
      }
    }
  }

  for (const level of [-10, 0, 1, 3, 5, 20, 30]) {
    it(`normalizes malformed feature level ${level}`, () => {
      const normalized = normalizeRuntimeFeature({
        id: " malformed ",
        classId: " fighter ",
        level,
        activation: "bonus action" as never,
        currentUses: 20,
        maxUses: 3,
      });

      expect(normalized.id).toBe("malformed");
      expect(normalized.classId).toBe("fighter");
      expect(normalized.level).toBeGreaterThanOrEqual(1);
      expect(normalized.activation).toBe("bonus-action");
      expect(normalized.currentUses).toBe(3);
    });
  }

  it("multiclass filtering keeps class-level boundaries", () => {
    const features: RuntimeFeature[] = [
      {
        id: "fighter-5",
        classId: "fighter",
        level: 5,
        activation: "passive",
      },
      {
        id: "wizard-5",
        classId: "wizard",
        level: 5,
        activation: "passive",
      },
      {
        id: "wizard-3",
        classId: "wizard",
        level: 3,
        activation: "passive",
      },
    ];

    const levels = { fighter: 5, wizard: 3 };
    expect(runtimeTotalCharacterLevel(levels)).toBe(8);
    expect(
      runtimeUnlockedFeatures(features, levels).map(
        (feature) => feature.id,
      ),
    ).toEqual(["fighter-5", "wizard-3"]);
  });
});
