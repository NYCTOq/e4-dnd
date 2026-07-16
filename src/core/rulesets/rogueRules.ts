import type { DndItemData } from "./ruleset.types";

export function getSneakAttackDice(level: number) {
  return Math.max(1, Math.ceil(Math.min(20, Math.max(1, level)) / 2));
}

export function isSneakAttackWeapon(weapon: DndItemData) {
  const properties = weapon.properties?.map(value => value.toLowerCase()) ?? [];
  return weapon.category === "weapon" && (properties.includes("finesse") || Boolean(weapon.range) || properties.includes("ammunition"));
}

export function canUseSneakAttack(input: { level: number; weapon: DndItemData; usedThisTurn: boolean; hasAdvantage: boolean; hasDisadvantage: boolean; allyAdjacent: boolean }) {
  if (input.level < 1 || input.usedThisTurn || !isSneakAttackWeapon(input.weapon) || input.hasDisadvantage) return false;
  return input.hasAdvantage || input.allyAdjacent;
}

export function getRogueCombatFeatures(level: number) {
  return {
    cunningAction: level >= 2,
    uncannyDodge: level >= 5,
    evasion: level >= 7,
    reliableTalent: level >= 11,
    elusive: level >= 18,
  };
}
