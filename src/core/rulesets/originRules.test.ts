import { describe, expect, it } from "vitest";
import { applyAbilityBonuses, getOriginAbilityBonuses } from "./originRules";

const base = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

describe("origin rules", () => {
  it("combines 2014 race and subrace bonuses", () => {
    const result = getOriginAbilityBonuses("dnd_2014", { id:"elf", name:"Elf", speed:30, size:"Medium", abilityBonuses:{dex:2}, traits:[], description:"" }, { id:"high", name:"High", abilityBonuses:{int:1}, traits:[], description:"" }, null);
    expect(result).toEqual({ dex: 2, int: 1 });
  });
  it("applies 2024 background plus two and plus one", () => {
    const result = getOriginAbilityBonuses("dnd_2024", null, null, { id:"sage", name:"Sage", description:"", skillProficiencies:[], abilityOptions:["con","int","wis"], abilityBonusMode:"2024-plus2-plus1" }, "int", "wis");
    expect(result).toEqual({ int: 2, wis: 1 });
  });
  it("applies bonuses without mutating base scores", () => {
    expect(applyAbilityBonuses(base, { dex: 2 }).dex).toBe(16);
    expect(base.dex).toBe(14);
  });
});
