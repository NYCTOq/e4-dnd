import type { RulesetId } from "../character/character.types";
import type { RollMode } from "./attackResolution";

export type ExhaustionEffects = {
  level: number;
  d20Penalty: number;
  abilityCheckMode: RollMode;
  attackSaveMode: RollMode;
  speedMultiplier: number;
  speedPenalty: number;
  maxHpMultiplier: number;
  dead: boolean;
};

export function getExhaustionEffects(ruleset: RulesetId, value: number): ExhaustionEffects {
  const level = Math.min(6, Math.max(0, Math.floor(value)));
  if (ruleset === "dnd_2024") {
    return { level, d20Penalty: level * 2, abilityCheckMode: "normal", attackSaveMode: "normal", speedMultiplier: 1, speedPenalty: level * 5, maxHpMultiplier: 1, dead: level >= 6 };
  }
  return {
    level,
    d20Penalty: 0,
    abilityCheckMode: level >= 1 ? "disadvantage" : "normal",
    attackSaveMode: level >= 3 ? "disadvantage" : "normal",
    speedMultiplier: level >= 5 ? 0 : level >= 2 ? 0.5 : 1,
    speedPenalty: 0,
    maxHpMultiplier: level >= 4 ? 0.5 : 1,
    dead: level >= 6,
  };
}

export function getEffectiveSpeed(baseSpeed: number, effects: ExhaustionEffects) {
  return Math.max(0, Math.floor(baseSpeed * effects.speedMultiplier) - effects.speedPenalty);
}

export function getEffectiveMaxHp(maxHp: number, effects: ExhaustionEffects) {
  return Math.max(1, Math.floor(maxHp * effects.maxHpMultiplier));
}
