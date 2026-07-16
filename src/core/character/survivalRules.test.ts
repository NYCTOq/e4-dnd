import { describe, expect, it } from "vitest";
import { applyDamage, applyHealing, getConcentrationDc, resolveDeathSave } from "./survivalRules";

const state = { currentHp: 20, maxHp: 20, tempHp: 5, deathSaves: { successes: 0, failures: 0 } };

describe("survival rules", () => {
  it("consumes temporary HP before current HP and calculates concentration DC", () => {
    const result = applyDamage(state, 12);
    expect(result).toMatchObject({ currentHp: 13, tempHp: 0, absorbedByTempHp: 5, hpDamage: 7, concentrationDc: 10 });
    expect(getConcentrationDc(30)).toBe(15);
  });

  it("handles damage at zero and massive damage", () => {
    expect(applyDamage({ ...state, currentHp: 0, tempHp: 0 }, 4, true).deathSaves.failures).toBe(2);
    expect(applyDamage({ ...state, currentHp: 3, tempHp: 0 }, 23).massiveDamage).toBe(true);
  });

  it("applies natural death-save rules and healing recovery", () => {
    const down = { ...state, currentHp: 0, tempHp: 0 };
    expect(resolveDeathSave(down, 1).deathSaves.failures).toBe(2);
    expect(resolveDeathSave(down, 20).currentHp).toBe(1);
    expect(applyHealing({ ...down, deathSaves: { successes: 1, failures: 2 } }, 5).deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});
