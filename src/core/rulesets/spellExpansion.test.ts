import { describe, expect, it } from "vitest";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";

describe("spell database v2 expansion", () => {
  it("fills cleric spell levels four through nine", () => {
    for (const level of [4,5,6,7,8,9]) expect(SPELL_EXPANSION_2014.some((spell) => spell.level === level && spell.classes.includes("Cleric"))).toBe(true);
  });
  it("keeps edition ids separate and unique", () => {
    expect(new Set(SPELL_EXPANSION_2014.map((spell) => spell.id)).size).toBe(SPELL_EXPANSION_2014.length);
    expect(SPELL_EXPANSION_2024.every((spell) => spell.id.endsWith("-2024"))).toBe(true);
  });
  it("includes costly and consumed material metadata", () => {
    expect(SPELL_EXPANSION_2014.find((spell) => spell.name === "True Resurrection")).toMatchObject({ materialCost: "25,000 gp", materialConsumed: true });
  });
});
