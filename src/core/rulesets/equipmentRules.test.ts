import { describe, expect, it } from "vitest";
import type { DndItemData } from "./ruleset.types";
import { canEquipItem, getItemSearchText, getWeaponMastery, getWeaponMasteryChoiceCount } from "./equipmentRules";

const longsword: DndItemData = {
  id: "longsword", name: "Longsword", category: "weapon", cost: "15 gp", weight: 3,
  damage: "1d8", damageType: "slashing", properties: ["Versatile 1d10"], description: "Martial blade.",
};

describe("equipment rules", () => {
  it("returns 2024 mastery only for the 2024 ruleset", () => {
    expect(getWeaponMastery(longsword, "dnd_2024")).toBe("Sap");
    expect(getWeaponMastery(longsword, "dnd_2014")).toBeNull();
  });
  it("prevents equipping missing or utility items", () => {
    expect(canEquipItem(longsword, 1)).toBe(true);
    expect(canEquipItem(longsword, 0)).toBe(false);
    expect(canEquipItem({ ...longsword, category: "gear" }, 1)).toBe(false);
  });
  it("includes mastery and properties in searchable text", () => {
    expect(getItemSearchText(longsword, "dnd_2024")).toContain("sap");
    expect(getItemSearchText(longsword, "dnd_2024")).toContain("versatile");
  });
  it("reads mastery choice count from 2024 class progression", () => expect(getWeaponMasteryChoiceCount({ levels: [{ level: 1, proficiencyBonus: 2, features: [], weaponMasteryCount: 3 }] } as never, 1, "dnd_2024")).toBe(3));
});
