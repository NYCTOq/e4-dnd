import type { CharacterCondition } from "../character/character.types";
import type { RollMode } from "./attackResolution";

export type ConditionEffectSummary = {
  attackMode: RollMode;
  blocksActions: boolean;
  speedBecomesZero: boolean;
  notes: string[];
};

const ATTACK_DISADVANTAGE: CharacterCondition[] = ["Blinded", "Poisoned", "Restrained", "Prone", "Frightened"];
const BLOCKS_ACTIONS: CharacterCondition[] = ["Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"];
const ZERO_SPEED: CharacterCondition[] = ["Grappled", "Paralyzed", "Petrified", "Restrained", "Stunned", "Unconscious"];

export function combineRollModes(selected: RollMode, imposed: RollMode): RollMode {
  if (selected === "normal") return imposed;
  if (imposed === "normal" || selected === imposed) return selected;
  return "normal";
}

export function getConditionEffects(conditions: CharacterCondition[]): ConditionEffectSummary {
  const blocksActions = conditions.some(condition => BLOCKS_ACTIONS.includes(condition));
  const attackMode: RollMode = conditions.includes("Invisible")
    ? ATTACK_DISADVANTAGE.some(condition => conditions.includes(condition)) ? "normal" : "advantage"
    : ATTACK_DISADVANTAGE.some(condition => conditions.includes(condition)) ? "disadvantage" : "normal";
  const speedBecomesZero = conditions.some(condition => ZERO_SPEED.includes(condition));
  const notes: string[] = [];
  if (blocksActions) notes.push("Action ve reaction kullanamaz.");
  if (speedBecomesZero) notes.push("Speed 0 olur.");
  if (attackMode !== "normal") notes.push(`Attack roll: ${attackMode}.`);
  if (conditions.includes("Deafened")) notes.push("İşitmeye dayalı kontrolleri otomatik geçemez.");
  if (conditions.includes("Charmed")) notes.push("Charmer hedef alınamaz; sosyal etkileşimde charmer avantajlıdır.");
  return { attackMode, blocksActions, speedBecomesZero, notes };
}
