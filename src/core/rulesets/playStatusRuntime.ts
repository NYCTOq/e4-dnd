import type { Character, CharacterCondition } from "../character/character.types";

export type PlayStatusAction =
  | { type: "damage"; amount: number }
  | { type: "heal"; amount: number }
  | { type: "temp-hp"; amount: number }
  | { type: "death-save-success" }
  | { type: "death-save-failure"; critical?: boolean }
  | { type: "stabilize" }
  | { type: "reset-death-saves" }
  | { type: "toggle-condition"; condition: CharacterCondition }
  | { type: "set-exhaustion"; level: number }
  | { type: "spend-resource"; resourceId: string; amount?: number }
  | { type: "recover-resource"; resourceId: string; amount?: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(value)));

export function applyPlayStatusAction(character: Character, action: PlayStatusAction): Character {
  let next: Character = { ...character, updatedAt: new Date().toISOString() };
  if (action.type === "damage") {
    let remaining = Math.max(0, Math.trunc(action.amount));
    const absorbed = Math.min(next.tempHp, remaining);
    remaining -= absorbed;
    next = { ...next, tempHp: next.tempHp - absorbed, currentHp: Math.max(0, next.currentHp - remaining) };
    return next;
  }
  if (action.type === "heal") {
    const currentHp = Math.min(next.maxHp, next.currentHp + Math.max(0, Math.trunc(action.amount)));
    return { ...next, currentHp, ...(currentHp > 0 ? { deathSaves: { successes: 0, failures: 0 }, deathSaveStable: false, dead: false } : {}) };
  }
  if (action.type === "temp-hp") return { ...next, tempHp: Math.max(next.tempHp, Math.max(0, Math.trunc(action.amount))) };
  if (action.type === "death-save-success") {
    const successes = clamp(next.deathSaves.successes + 1, 0, 3);
    return { ...next, deathSaves: { ...next.deathSaves, successes }, deathSaveStable: successes >= 3, dead: false };
  }
  if (action.type === "death-save-failure") {
    const failures = clamp(next.deathSaves.failures + (action.critical ? 2 : 1), 0, 3);
    return { ...next, deathSaves: { ...next.deathSaves, failures }, dead: failures >= 3, deathSaveStable: false };
  }
  if (action.type === "stabilize") return { ...next, deathSaves: { successes: 3, failures: next.deathSaves.failures }, deathSaveStable: true, dead: false };
  if (action.type === "reset-death-saves") return { ...next, deathSaves: { successes: 0, failures: 0 }, deathSaveStable: false, dead: false };
  if (action.type === "toggle-condition") {
    const conditions = next.conditions.includes(action.condition)
      ? next.conditions.filter((item) => item !== action.condition)
      : [...next.conditions, action.condition];
    const conditionDurations = { ...next.conditionDurations };
    if (!conditions.includes(action.condition)) delete conditionDurations[action.condition];
    return { ...next, conditions, conditionDurations };
  }
  if (action.type === "set-exhaustion") return { ...next, exhaustion: clamp(action.level, 0, 6) };
  if (action.type === "spend-resource" || action.type === "recover-resource") {
    const amount = Math.max(1, Math.trunc(action.amount ?? 1));
    return {
      ...next,
      resources: next.resources.map((resource) => resource.id !== action.resourceId || resource.unlimited ? resource : {
        ...resource,
        used: action.type === "spend-resource"
          ? clamp(resource.used + amount, 0, resource.max)
          : clamp(resource.used - amount, 0, resource.max),
      }),
    };
  }
  return next;
}

export function getPlayStatusSummary(character: Character) {
  return {
    hp: `${character.currentHp}/${character.maxHp}`,
    tempHp: character.tempHp,
    dying: character.currentHp === 0 && !character.deathSaveStable && !character.dead,
    stable: Boolean(character.deathSaveStable),
    dead: Boolean(character.dead),
    conditionCount: character.conditions.length,
    exhaustion: clamp(character.exhaustion, 0, 6),
    availableResources: character.resources.filter((resource) => resource.unlimited || resource.used < resource.max).length,
  };
}
