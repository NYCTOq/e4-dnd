import type { RollMode } from "./attackResolution";
import { chooseD20 } from "./attackResolution";

export type SaveDamageRule = "half" | "none";

export function resolveTargetSave(rolls: number[], bonus: number, dc: number, mode: RollMode) {
  const naturalRoll = chooseD20(rolls, mode);
  const total = naturalRoll + bonus;
  return { naturalRoll, total, success: total >= dc };
}

export function resolveSaveDamage(damage: number, saveSucceeded: boolean, rule: SaveDamageRule) {
  if (!saveSucceeded) return Math.max(0, damage);
  return rule === "half" ? Math.floor(Math.max(0, damage) / 2) : 0;
}

export function getDefaultSaveDamageRule(spellLevel: number, hasDamage: boolean): SaveDamageRule {
  return hasDamage && spellLevel > 0 ? "half" : "none";
}
