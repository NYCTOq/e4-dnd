import { describe, expect, it } from "vitest";
import { combineRollModes, getConditionEffects } from "./conditionRules";

describe("condition rules", () => {
  it("applies attack disadvantage and zero speed", () => {
    expect(getConditionEffects(["Poisoned", "Grappled"])).toMatchObject({ attackMode: "disadvantage", speedBecomesZero: true });
  });

  it("blocks actions for incapacitating conditions", () => {
    expect(getConditionEffects(["Paralyzed"]).blocksActions).toBe(true);
    expect(getConditionEffects(["Stunned"]).blocksActions).toBe(true);
  });

  it("cancels advantage and disadvantage", () => {
    expect(combineRollModes("advantage", "disadvantage")).toBe("normal");
    expect(getConditionEffects(["Invisible", "Poisoned"]).attackMode).toBe("normal");
  });
});
