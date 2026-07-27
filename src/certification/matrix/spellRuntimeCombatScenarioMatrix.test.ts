import { describe, expect, it } from "vitest";
import {
  resolveSpellDamagePipeline,
  runtimeApplyHealing,
  runtimeCanCastWithSlot,
  runtimeCantripScalingDice,
  runtimeConcentrationAfterDamage,
  runtimeConsumeSpellSlot,
  runtimeResolveTargetCount,
  runtimeSpellAttackBonus,
  runtimeSpellSaveDc,
  runtimeUpcastDiceCount,
} from "../../core/rulesets/spellRuntimeCombatRules";

describe("v5.113B spell runtime combat scenario matrix", () => {
  for (const level of [1, 5, 9, 13, 17, 20]) {
    for (const score of [8, 10, 14, 18, 20]) {
      it(`caster stats L${level} score${score}`, () => {
        expect(runtimeSpellSaveDc(level, score)).toBeGreaterThanOrEqual(5);
        expect(runtimeSpellAttackBonus(level, score)).toBeGreaterThanOrEqual(-3);
      });
    }
  }

  for (const damage of [0, 1, 3, 10, 25, 100]) {
    for (const success of [false, true]) {
      for (const saveMode of ["none", "half", "full"] as const) {
        for (const relation of [
          "normal",
          "resistant",
          "immune",
          "vulnerable",
        ] as const) {
          it(`pipeline ${damage}/${success}/${saveMode}/${relation}`, () => {
            const result = resolveSpellDamagePipeline({
              rolledDamage: damage,
              saveSucceeded: success,
              onSuccessfulSave: saveMode,
              relation,
            });

            expect(result).toBeGreaterThanOrEqual(0);
          });
        }
      }
    }
  }

  for (const currentHp of [0, 1, 5, 10, 20]) {
    for (const maxHp of [1, 10, 20, 50]) {
      for (const healing of [0, 1, 5, 20, 100]) {
        it(`healing ${currentHp}/${maxHp}/${healing}`, () => {
          const result = runtimeApplyHealing(
            currentHp,
            maxHp,
            healing,
          );

          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(maxHp);
        });
      }
    }
  }

  for (const level of [1, 4, 5, 10, 11, 16, 17, 20]) {
    it(`cantrip progression L${level}`, () => {
      expect(runtimeCantripScalingDice(level)).toBeGreaterThanOrEqual(1);
      expect(runtimeCantripScalingDice(level)).toBeLessThanOrEqual(4);
    });
  }

  for (const baseLevel of [1, 3, 5]) {
    for (const castLevel of [1, 3, 5, 7, 9]) {
      it(`upcast ${baseLevel}->${castLevel}`, () => {
        const result = runtimeUpcastDiceCount(
          3,
          baseLevel,
          castLevel,
          1,
        );

        expect(result).toBeGreaterThanOrEqual(3);
      });
    }
  }

  for (const spellLevel of [0, 1, 3, 5, 9]) {
    for (const castLevel of [0, 1, 3, 5, 9]) {
      it(`slot availability ${spellLevel}/${castLevel}`, () => {
        const canCast = runtimeCanCastWithSlot(
          spellLevel,
          castLevel,
          0,
          1,
        );

        expect(typeof canCast).toBe("boolean");
      });
    }
  }

  for (const used of [0, 1, 2, 3]) {
    for (const maximum of [0, 1, 2, 3]) {
      it(`slot clamp ${used}/${maximum}`, () => {
        const next = runtimeConsumeSpellSlot(used, maximum);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThanOrEqual(maximum);
      });
    }
  }

  for (const damage of [1, 10, 20, 21, 40, 100]) {
    for (const save of [0, 9, 10, 15, 20, 50]) {
      it(`concentration ${damage}/${save}`, () => {
        const result = runtimeConcentrationAfterDamage(damage, save);
        expect(result.dc).toBeGreaterThanOrEqual(10);
        expect(typeof result.maintained).toBe("boolean");
      });
    }
  }

  for (const requested of [0, 1, 2, 5, 10]) {
    for (const maximum of [null, 0, 1, 3, 8] as const) {
      it(`target clamp ${requested}/${String(maximum)}`, () => {
        const result = runtimeResolveTargetCount(requested, maximum);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    }
  }
});
