import type { DndItemData, WeaponMastery } from "./ruleset.types";

const MASTERY_BY_WEAPON_ID: Record<string, WeaponMastery> = {
  club: "Slow", dagger: "Nick", handaxe: "Vex", mace: "Sap",
  quarterstaff: "Topple", shortsword: "Vex", longsword: "Sap", rapier: "Vex",
  greatsword: "Graze", shortbow: "Vex", longbow: "Slow", "crossbow-light": "Slow",
};

export function getWeaponMastery(item: DndItemData, rulesetId: string) {
  if (rulesetId !== "dnd_2024" || item.category !== "weapon") return null;
  return item.mastery ?? MASTERY_BY_WEAPON_ID[item.id] ?? null;
}

export function canEquipItem(item: DndItemData, inventoryQuantity: number) {
  return inventoryQuantity > 0 && ["weapon", "armor", "shield"].includes(item.category);
}

export function getItemSearchText(item: DndItemData, rulesetId: string) {
  return [item.name, item.category, item.weaponCategory, item.damageType,
    item.properties?.join(" "), item.tags?.join(" "),
    getWeaponMastery(item, rulesetId), item.description]
    .filter(Boolean).join(" ").toLocaleLowerCase("tr");
}
