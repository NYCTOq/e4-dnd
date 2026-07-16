import { describe, expect, it } from "vitest";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "./itemExpansion";
import { getWeaponMastery } from "./equipmentRules";

describe("core equipment expansion", () => {
  it("adds the missing simple and martial weapon families", () => {
    const names = new Set(ITEM_EXPANSION_2014.map((item) => item.name));
    for (const name of ["Spear", "Javelin", "Greataxe", "Maul", "Scimitar", "Warhammer", "Whip", "Heavy Crossbow"]) expect(names.has(name)).toBe(true);
    expect(ITEM_EXPANSION_2014.filter((item) => item.category === "weapon" && !item.magical)).toHaveLength(24);
  });
  it("includes ammunition, tools and travel gear", () => {
    for (const category of ["ammunition", "tool", "gear"]) expect(ITEM_EXPANSION_2014.some((item) => item.category === category)).toBe(true);
    expect(ITEM_EXPANSION_2014.find((item) => item.id === "arrows-20")?.quantityInBundle).toBe(20);
  });
  it("keeps ids unique and exposes 2024 mastery data", () => {
    expect(new Set(ITEM_EXPANSION_2014.map((item) => item.id)).size).toBe(ITEM_EXPANSION_2014.length);
    expect(ITEM_EXPANSION_2024).toHaveLength(ITEM_EXPANSION_2014.length);
    const greataxe = ITEM_EXPANSION_2024.find((item) => item.id === "greataxe");
    expect(greataxe && getWeaponMastery(greataxe, "dnd_2024")).toBe("Cleave");
  });
});
