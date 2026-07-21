import type { RollMode } from "./attackResolution";
import { chooseD20 } from "./attackResolution";
import type { DndSpellData } from "./ruleset.types";

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

export function getDefaultSaveDamageRule(spell: Pick<DndSpellData, "saveDamageRule" | "description" | "higherLevels">): SaveDamageRule {
  if (spell.saveDamageRule === "half") return "half";
  if (spell.saveDamageRule === "none" || spell.saveDamageRule === "full") return "none";
  const text = `${spell.description} ${spell.higherLevels ?? ""}`;
  return /half as much|half damage|save for half|yarısı|yarı hasar/i.test(text) ? "half" : "none";
}
