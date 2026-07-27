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

describe("v5.113A spell runtime combat oracle", () => {
  for (const [score, expected] of [
    [1, -5], [8, -1], [10, 0], [12, 1],
    [14, 2], [16, 3], [18, 4], [20, 5], [30, 10],
  ] as const) {
    it(`ability modifier ${score}`, () => {
      expect(spellAbilityModifier(score)).toBe(expected);
    });
  }

  for (const [level, expected] of [
    [1, 2], [4, 2], [5, 3], [8, 3],
    [9, 4], [13, 5], [17, 6], [20, 6],
  ] as const) {
    it(`PB ${level}`, () => {
      expect(spellProficiencyBonus(level)).toBe(expected);
    });
  }

  for (const level of [1, 5, 9, 13, 17, 20]) {
    for (const score of [8, 10, 14, 18, 20]) {
      it(`DC L${level} score${score}`, () => {
        expect(spellSaveDc(level, score)).toBe(
          8 + spellProficiencyBonus(level) + spellAbilityModifier(score),
        );
      });

      it(`attack L${level} score${score}`, () => {
        expect(spellAttackBonus(level, score)).toBe(
          spellProficiencyBonus(level) + spellAbilityModifier(score),
        );
      });
    }
  }

  for (const [level, expected] of [
    [1, 1], [4, 1], [5, 2], [10, 2],
    [11, 3], [16, 3], [17, 4], [20, 4],
  ] as const) {
    it(`cantrip scaling L${level}`, () => {
      expect(cantripScalingDice(level)).toBe(expected);
    });
  }

  for (const castLevel of [1, 2, 3, 5, 9]) {
    it(`upcast level ${castLevel}`, () => {
      expect(upcastDiceCount(3, 1, castLevel)).toBe(
        3 + Math.max(0, castLevel - 1),
      );
    });
  }

  for (const maximum of [0, 1, 2, 4, 9]) {
    for (const used of [-2, 0, 1, 3, 10]) {
      it(`consume ${used}/${maximum}`, () => {
        const result = consumeSpellSlot(used, maximum);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(maximum);
      });

      it(`restore ${used}/${maximum}`, () => {
        const result = restoreSpellSlot(used, maximum);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(maximum);
      });
    }
  }

  for (const damage of [0, 1, 2, 3, 10, 25]) {
    for (const relation of [
      "normal", "resistant", "immune", "vulnerable",
    ] as const) {
      it(`${damage} ${relation}`, () => {
        const result = applyDamageRelation(damage, relation);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    }
  }

  for (const damage of [0, 1, 2, 3, 10, 25]) {
    for (const success of [false, true]) {
      for (const mode of ["none", "half", "full"] as const) {
        it(`save ${damage}/${success}/${mode}`, () => {
          expect(
            applySavingThrowDamage(damage, success, mode),
          ).toBeGreaterThanOrEqual(0);
        });
      }
    }
  }

  for (const current of [0, 1, 5, 10, 20]) {
    for (const healing of [0, 1, 5, 10, 50]) {
      it(`heal ${current}+${healing}`, () => {
        const result = applyHealing(current, 20, healing);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(20);
      });
    }
  }

  for (const damage of [1, 10, 20, 21, 40, 100]) {
    for (const save of [0, 9, 10, 15, 20, 50]) {
      it(`concentration ${damage}/${save}`, () => {
        const result = concentrationAfterDamage(damage, save);
        expect(result.dc).toBe(Math.max(10, Math.floor(damage / 2)));
        expect(result.maintained).toBe(save >= result.dc);
      });
    }
  }

  for (const spellLevel of [0, 1, 3, 5, 9]) {
    for (const castLevel of [0, 1, 3, 5, 9]) {
      it(`cast spell${spellLevel} slot${castLevel}`, () => {
        expect(
          canCastWithSlot(spellLevel, castLevel, 0, 1),
        ).toBe(
          spellLevel === 0 || castLevel >= spellLevel,
        );
      });
    }
  }

  for (const requested of [0, 1, 2, 5, 10]) {
    for (const maximum of [null, 0, 1, 3, 8] as const) {
      it(`targets ${requested}/${String(maximum)}`, () => {
        const result = resolveTargetCount(requested, maximum);
        expect(result).toBeGreaterThanOrEqual(0);
      });
    }
  }
});
