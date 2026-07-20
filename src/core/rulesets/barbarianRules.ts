import type { DndItemData } from "./ruleset.types";

export type BarbarianEdition = "dnd_2014" | "dnd_2024";

export function getRageDamageBonus(level: number) {
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  return safe >= 16 ? 4 : safe >= 9 ? 3 : 2;
}

export function getRageUses(level: number, ruleset: BarbarianEdition): number | "unlimited" {
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  if (ruleset === "dnd_2014" && safe === 20) return "unlimited";
  return safe >= 17 ? 6 : safe >= 12 ? 5 : safe >= 6 ? 4 : safe >= 3 ? 3 : 2;
}

export function getWeaponMasteryCount(level: number, ruleset: BarbarianEdition) {
  if (ruleset === "dnd_2014") return 0;
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  return safe >= 10 ? 4 : safe >= 4 ? 3 : 2;
}

export function getBrutalCriticalExtraDice(level: number, ruleset: string) {
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  if (ruleset === "dnd_2024") return 0;
  return safe >= 17 ? 3 : safe >= 13 ? 2 : safe >= 9 ? 1 : 0;
}

export function getBrutalStrike(level: number, ruleset: BarbarianEdition) {
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  if (ruleset !== "dnd_2024" || safe < 9) return { dice: 0, effectCount: 0, options: [] as string[] };
  const options = safe >= 13
    ? ["Forceful Blow", "Hamstring Blow", "Staggering Blow", "Sundering Blow"]
    : ["Forceful Blow", "Hamstring Blow"];
  return { dice: safe >= 17 ? 2 : 1, effectCount: safe >= 17 ? 2 : 1, options };
}

export function getRelentlessRageRecoveryHp(level: number, ruleset: BarbarianEdition) {
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  if (safe < 11) return 0;
  return ruleset === "dnd_2024" ? safe * 2 : 1;
}

export function getPrimalChampion(level: number, ruleset: BarbarianEdition) {
  if (level < 20) return { strengthIncrease: 0, constitutionIncrease: 0, maximum: 20 };
  return { strengthIncrease: 4, constitutionIncrease: 4, maximum: ruleset === "dnd_2024" ? 25 : 24 };
}

/**
 * 2014 requires a melee weapon attack using Strength. 2024 requires an attack
 * using Strength and therefore also permits Strength-based thrown attacks.
 */
export function isRageDamageWeapon(
  weapon: DndItemData,
  ruleset: BarbarianEdition = "dnd_2014",
  attackAbility: "str" | "dex" = "str",
) {
  if (weapon.category !== "weapon" || attackAbility !== "str") return false;
  const properties = weapon.properties?.map((value) => value.toLowerCase()) ?? [];
  if (ruleset === "dnd_2024") return true;
  return !weapon.range && !properties.includes("ammunition");
}

export function reduceRageDamage(amount: number, raging: boolean, physical: boolean) {
  const damage = Math.max(0, Math.floor(amount));
  return raging && physical ? Math.floor(damage / 2) : damage;
}

export function getBarbarianCombatFeatures(level: number, ruleset: BarbarianEdition = "dnd_2014") {
  const safe = Math.max(1, Math.min(20, Math.floor(level)));
  return {
    recklessAttack: safe >= 2,
    dangerSense: safe >= 2,
    primalKnowledge: ruleset === "dnd_2024" && safe >= 3,
    extraAttack: safe >= 5,
    fastMovement: safe >= 5,
    feralInstinct: safe >= 7,
    instinctivePounce: ruleset === "dnd_2024" && safe >= 7,
    brutalCriticalDice: getBrutalCriticalExtraDice(safe, ruleset),
    brutalStrike: getBrutalStrike(safe, ruleset),
    relentlessRage: safe >= 11,
    persistentRage: safe >= 15,
    indomitableMight: safe >= 18,
    primalChampion: safe >= 20,
  };
}
