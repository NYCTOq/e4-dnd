import { describe, expect, it } from "vitest";
import { getDefaultSaveDamageRule, resolveSaveDamage, resolveTargetSave } from "./spellTargetRules";

describe("spell target rules", () => {
  it("resolves target saves with roll mode and bonus", () => {
    expect(resolveTargetSave([4, 16], 3, 15, "advantage")).toMatchObject({ naturalRoll: 16, total: 19, success: true });
    expect(resolveTargetSave([4, 16], 3, 15, "disadvantage").success).toBe(false);
  });

  it("applies half or zero damage on a successful save", () => {
    expect(resolveSaveDamage(25, true, "half")).toBe(12);
    expect(resolveSaveDamage(25, true, "none")).toBe(0);
    expect(resolveSaveDamage(25, false, "half")).toBe(25);
  });

  it("uses half damage as the leveled damage-spell default", () => {
    expect(getDefaultSaveDamageRule(3, true)).toBe("half");
    expect(getDefaultSaveDamageRule(0, true)).toBe("none");
  });
});
