import { describe, expect, it } from "vitest";
import {
  applyDamageRelation,
  applyHealing,
  applySavingThrowDamage,
  canCastWithSlot,
  cantripScalingDice,
  concentrationAfterDamage,
  consumeSpellSlot,
  resolveTargetCount,
  restoreSpellSlot,
  spellAbilityModifier,
  spellAttackBonus,
  spellProficiencyBonus,
  spellSaveDc,
  upcastDiceCount,
} from "../reference/spellRuntimeCombat.reference";
import {
  runtimeApplyDamageRelation,
  runtimeApplyHealing,
  runtimeApplySavingThrowDamage,
  runtimeCanCastWithSlot,
  runtimeCantripScalingDice,
  runtimeConcentrationAfterDamage,
  runtimeConsumeSpellSlot,
  runtimeResolveTargetCount,
  runtimeRestoreSpellSlot,
  runtimeSpellAbilityModifier,
  runtimeSpellAttackBonus,
  runtimeSpellProficiencyBonus,
  runtimeSpellSaveDc,
  runtimeUpcastDiceCount,
} from "../../core/rulesets/spellRuntimeCombatRules";

describe("v5.113B spell runtime combat differential", () => {
  for (const score of [-10, 0, 1, 8, 10, 12, 16, 20, 30]) {
    it(`ability ${score}`, () => {
      expect(runtimeSpellAbilityModifier(score)).toBe(
        spellAbilityModifier(score),
      );
    });
  }

  for (const level of [-5, 0, 1, 4, 5, 8, 9, 13, 17, 20, 30]) {
    it(`PB ${level}`, () => {
      expect(runtimeSpellProficiencyBonus(level)).toBe(
        spellProficiencyBonus(level),
      );
    });
  }

  for (const level of [1, 5, 9, 13, 17, 20]) {
    for (const score of [8, 10, 14, 18, 20]) {
      for (const bonus of [-2, 0, 1, 3]) {
        it(`DC ${level}/${score}/${bonus}`, () => {
          expect(runtimeSpellSaveDc(level, score, bonus)).toBe(
            spellSaveDc(level, score, bonus),
          );
        });

        it(`attack ${level}/${score}/${bonus}`, () => {
          expect(runtimeSpellAttackBonus(level, score, bonus)).toBe(
            spellAttackBonus(level, score, bonus),
          );
        });
      }
    }
  }

  for (const level of [-5, 0, 1, 4, 5, 10, 11, 16, 17, 20, 30]) {
    it(`cantrip ${level}`, () => {
      expect(runtimeCantripScalingDice(level)).toBe(
        cantripScalingDice(level),
      );
    });
  }

  for (const baseDice of [0, 1, 3, 8]) {
    for (const baseLevel of [0, 1, 3, 5]) {
      for (const castLevel of [0, 1, 3, 5, 9]) {
        for (const perLevel of [0, 1, 2]) {
          it(`upcast ${baseDice}/${baseLevel}/${castLevel}/${perLevel}`, () => {
            expect(
              runtimeUpcastDiceCount(
                baseDice,
                baseLevel,
                castLevel,
                perLevel,
              ),
            ).toBe(
              upcastDiceCount(
                baseDice,
                baseLevel,
                castLevel,
                perLevel,
              ),
            );
          });
        }
      }
    }
  }

  for (const maximum of [0, 1, 2, 4, 9]) {
    for (const used of [-2, 0, 1, 3, 10]) {
      for (const amount of [0, 1, 2, 5]) {
        it(`consume ${used}/${maximum}/${amount}`, () => {
          expect(
            runtimeConsumeSpellSlot(used, maximum, amount),
          ).toBe(
            consumeSpellSlot(used, maximum, amount),
          );
        });

        it(`restore ${used}/${maximum}/${amount}`, () => {
          expect(
            runtimeRestoreSpellSlot(used, maximum, amount),
          ).toBe(
            restoreSpellSlot(used, maximum, amount),
          );
        });
      }
    }
  }

  for (const damage of [-5, 0, 1, 2, 3, 10, 25, 100]) {
    for (const relation of [
      "normal", "resistant", "immune", "vulnerable",
    ] as const) {
      it(`relation ${damage}/${relation}`, () => {
        expect(
          runtimeApplyDamageRelation(damage, relation),
        ).toBe(
          applyDamageRelation(damage, relation),
        );
      });
    }
  }

  for (const damage of [-5, 0, 1, 2, 3, 10, 25]) {
    for (const success of [false, true]) {
      for (const mode of ["none", "half", "full"] as const) {
        it(`save ${damage}/${success}/${mode}`, () => {
          expect(
            runtimeApplySavingThrowDamage(damage, success, mode),
          ).toBe(
            applySavingThrowDamage(damage, success, mode),
          );
        });
      }
    }
  }

  for (const current of [-5, 0, 1, 5, 10, 20, 30]) {
    for (const max of [0, 1, 10, 20]) {
      for (const healing of [-5, 0, 1, 5, 50]) {
        it(`heal ${current}/${max}/${healing}`, () => {
          expect(
            runtimeApplyHealing(current, max, healing),
          ).toBe(
            applyHealing(current, max, healing),
          );
        });
      }
    }
  }

  for (const damage of [-5, 0, 1, 10, 20, 21, 40, 100]) {
    for (const save of [-5, 0, 9, 10, 15, 20, 50]) {
      it(`concentration ${damage}/${save}`, () => {
        expect(
          runtimeConcentrationAfterDamage(damage, save),
        ).toEqual(
          concentrationAfterDamage(damage, save),
        );
      });
    }
  }

  for (const spellLevel of [0, 1, 3, 5, 9]) {
    for (const castLevel of [0, 1, 3, 5, 9]) {
      for (const used of [0, 1, 2]) {
        for (const maximum of [0, 1, 2]) {
          it(`cast ${spellLevel}/${castLevel}/${used}/${maximum}`, () => {
            expect(
              runtimeCanCastWithSlot(
                spellLevel,
                castLevel,
                used,
                maximum,
              ),
            ).toBe(
              canCastWithSlot(
                spellLevel,
                castLevel,
                used,
                maximum,
              ),
            );
          });
        }
      }
    }
  }

  for (const requested of [-5, 0, 1, 2, 5, 10]) {
    for (const maximum of [null, 0, 1, 3, 8] as const) {
      it(`targets ${requested}/${String(maximum)}`, () => {
        expect(
          runtimeResolveTargetCount(requested, maximum),
        ).toBe(
          resolveTargetCount(requested, maximum),
        );
      });
    }
  }
});
