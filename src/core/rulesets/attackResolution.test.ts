import { describe, expect, it } from "vitest";
import { chooseD20, getCriticalDamageFormula, resolveAttack } from "./attackResolution";

describe("attack resolution", () => {
  it("selects the correct d20 for advantage and disadvantage", () => {
    expect(chooseD20([4, 17], "advantage")).toBe(17);
    expect(chooseD20([4, 17], "disadvantage")).toBe(4);
  });

  it("honors natural 1 and natural 20 regardless of armor class", () => {
    expect(resolveAttack([20], -5, 30, "normal")).toMatchObject({ hit: true, critical: true });
    expect(resolveAttack([1], 50, 10, "normal")).toMatchObject({ hit: false, fumble: true });
  });

  it("doubles only damage dice on a critical hit", () => {
    expect(getCriticalDamageFormula("2d6+4 slashing", true)).toEqual({ count: 4, sides: 6, modifier: 4 });
    expect(getCriticalDamageFormula("1d8-1 piercing", false)).toEqual({ count: 1, sides: 8, modifier: -1 });
  });
});
