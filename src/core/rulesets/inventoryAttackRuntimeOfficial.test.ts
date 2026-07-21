import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";
import { getWeaponAttackBonus, getWeaponDamageSummary } from "../../features/characters/characterShared";
import { getAttunedItemCount, toggleItemAttunement } from "./magicItemRules";

const character = {
  level: 5,
  abilities: { str: 16, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
  fightingStyleIds: [],
  equippedWeaponIds: ["longsword"],
} as unknown as Character;

const longsword = {
  id: "longsword", name: "Longsword", category: "weapon", cost: "15 gp", weight: 3,
  description: "", damage: "1d8", damageType: "slashing", weaponCategory: "martial",
  properties: ["Versatile (1d10)"],
} satisfies DndItemData;

describe("inventory, attunement and attack runtime official", () => {
  it("does not add proficiency bonus for a non-proficient weapon", () => {
    expect(getWeaponAttackBonus(character, longsword, true)).toBe(6);
    expect(getWeaponAttackBonus(character, longsword, false)).toBe(3);
  });

  it("uses versatile damage only when the weapon is used with two hands", () => {
    expect(getWeaponDamageSummary(character, longsword, false)).toBe("1d8 +3 slashing");
    expect(getWeaponDamageSummary(character, longsword, true)).toBe("1d10 +3 slashing");
  });

  it("enforces the three-item attunement cap", () => {
    const item = { ...longsword, id: "fourth", requiresAttunement: true };
    const inventory = ["one", "two", "three"].map((itemId) => ({ itemId, quantity: 1, attuned: true })).concat([{ itemId: "fourth", quantity: 1, attuned: false }]);
    const next = toggleItemAttunement(inventory, item);
    expect(getAttunedItemCount(next)).toBe(3);
    expect(next.find((entry) => entry.itemId === "fourth")?.attuned).toBe(false);
  });
});
