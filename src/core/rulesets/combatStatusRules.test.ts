import { describe, expect, it } from "vitest";
import { advanceConditionDurations, getDeathSaveStatus, shouldRequestConcentrationSave } from "./combatStatusRules";

describe("combat status runtime", () => {
  it("classifies death save states", () => {
    expect(getDeathSaveStatus(4, { successes: 0, failures: 0 })).toBe("conscious");
    expect(getDeathSaveStatus(0, { successes: 1, failures: 1 })).toBe("dying");
    expect(getDeathSaveStatus(0, { successes: 3, failures: 1 })).toBe("stable");
    expect(getDeathSaveStatus(0, { successes: 2, failures: 3 })).toBe("dead");
  });

  it("expires timed conditions without touching untimed conditions", () => {
    const result = advanceConditionDurations(["Prone", "Blessed", "Poisoned"], { Blessed: 1, Poisoned: 2 });
    expect(result.conditions).toEqual(["Prone", "Poisoned"]);
    expect(result.durations).toEqual({ Poisoned: 1 });
    expect(result.expired).toEqual(["Blessed"]);
  });

  it("requests concentration only after positive damage", () => {
    expect(shouldRequestConcentrationSave(true, 12)).toBe(true);
    expect(shouldRequestConcentrationSave(true, 0)).toBe(false);
    expect(shouldRequestConcentrationSave(false, 12)).toBe(false);
  });
});
