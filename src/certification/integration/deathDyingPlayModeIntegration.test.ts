import { describe, expect, it } from "vitest";
import {
  applyDamage,
  applyHealing,
  resolveDeathSave,
  stabilizeCharacter,
  type SurvivalState,
} from "../../core/character/survivalRules";
import { getDeathSaveStatus } from "../../core/rulesets/combatStatusRules";

const base = (): SurvivalState => ({
  currentHp: 10,
  maxHp: 10,
  tempHp: 0,
  deathSaves: { successes: 0, failures: 0 },
});

describe("v5.115D Play Mode death & dying integration", () => {
  it("knocks a conscious character unconscious without failed save", () => {
    const result = applyDamage(base(), 10);
    expect(result.currentHp).toBe(0);
    expect(result.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(getDeathSaveStatus(0, result.deathSaves, result)).toBe("dying");
  });
  it("applies failed saves on later zero-HP damage", () => {
    const result = applyDamage({ ...base(), currentHp: 0 }, 1);
    expect(result.deathSaves.failures).toBe(1);
  });
  it("applies two failures for a critical zero-HP hit", () => {
    const result = applyDamage({ ...base(), currentHp: 0 }, 1, true);
    expect(result.deathSaves.failures).toBe(2);
  });
  it("recognizes immediate death after three failures", () => {
    const result = applyDamage({
      ...base(), currentHp: 0,
      deathSaves: { successes: 0, failures: 2 },
    }, 1);
    expect(getDeathSaveStatus(0, result.deathSaves, result)).toBe("dead");
  });
  it("persists explicit stabilization", () => {
    const result = stabilizeCharacter({
      ...base(), currentHp: 0,
      deathSaves: { successes: 2, failures: 1 },
    });
    expect(result.deathSaveStable).toBe(true);
    expect(result.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(getDeathSaveStatus(0, result.deathSaves, {
      stable: result.deathSaveStable,
      dead: result.dead,
    })).toBe("stable");
  });
  it("healing clears stable and dead flags", () => {
    const result = applyHealing({
      ...base(), currentHp: 0, deathSaveStable: true,
    }, 4);
    expect(result.currentHp).toBe(4);
    expect(result.deathSaveStable).toBe(false);
    expect(result.dead).toBe(false);
  });
  it("natural 20 restores one HP", () => {
    expect(resolveDeathSave({ ...base(), currentHp: 0 }, 20).currentHp).toBe(1);
  });
  it("natural 1 adds two failures", () => {
    expect(resolveDeathSave({ ...base(), currentHp: 0 }, 1)
      .deathSaves.failures).toBe(2);
  });
  it("history is generated for every mutation", () => {
    const damaged = applyDamage(base(), 2);
    const healed = applyHealing(damaged, 1);
    expect(healed.deathDyingHistory?.length).toBe(2);
  });
  it("massive damage state reports dead", () => {
    const result = applyDamage(base(), 20);
    expect(result.massiveDamage).toBe(true);
    expect(result.dead).toBe(true);
  });
});
