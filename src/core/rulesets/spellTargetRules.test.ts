import { describe, expect, it } from "vitest";
import { getDefaultSaveDamageRule, resolveSaveDamage, resolveTargetSave } from "./spellTargetRules";

describe("spell target rules", () => {
  it("resolves target saves", () => {
    expect(resolveTargetSave([12], 3, 15, "normal")).toMatchObject({ total: 15, success: true });
    expect(resolveTargetSave([4, 17], 2, 15, "advantage")).toMatchObject({ naturalRoll: 17, success: true });
  });

  it("resolves half or no damage on a successful save", () => {
    expect(resolveSaveDamage(17, true, "half")).toBe(8);
    expect(resolveSaveDamage(17, true, "none")).toBe(0);
    expect(resolveSaveDamage(17, false, "none")).toBe(17);
  });

  it("infers save damage only from explicit spell rules", () => {
    expect(getDefaultSaveDamageRule({ description: "On a successful save, the creature takes half as much damage." })).toBe("half");
    expect(getDefaultSaveDamageRule({ description: "On a failed save, the creature takes damage." })).toBe("none");
    expect(getDefaultSaveDamageRule({ description: "Damage", saveDamageRule: "half" })).toBe("half");
  });
});
