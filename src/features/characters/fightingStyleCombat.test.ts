import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import type { DndItemData } from "../../core/rulesets/ruleset.types";
import { calculateSuggestedArmorClass, getWeaponAttackBonus, getWeaponDamageSummary } from "./characterShared";

const longbow = { id: "longbow", category: "weapon", damage: "1d8", damageType: "piercing", properties: ["Ammunition", "Two-Handed"], range: "150/600" } as DndItemData;
const longsword = { id: "longsword", category: "weapon", damage: "1d8", damageType: "slashing", properties: ["Versatile 1d10"] } as DndItemData;

describe("fighting style combat integration", () => {
  it("adds Archery to ranged weapon attacks", () => expect(getWeaponAttackBonus(makeCharacter({ fightingStyleIds: ["archery"] }), longbow) - getWeaponAttackBonus(makeCharacter(), longbow)).toBe(2));
  it("adds Dueling to a single one-handed weapon's damage", () => expect(getWeaponDamageSummary(makeCharacter({ fightingStyleIds: ["dueling"], equippedWeaponIds: ["longsword"] }), longsword)).toContain("+2"));
  it("adds Defense AC only while armor is equipped", () => {
    const armor = { id: "chain-mail", category: "armor", armorClass: 16, armorType: "heavy" } as DndItemData;
    expect(calculateSuggestedArmorClass(makeCharacter({ fightingStyleIds: ["defense"], equippedArmorId: armor.id }), [armor])).toBe(17);
  });
});
