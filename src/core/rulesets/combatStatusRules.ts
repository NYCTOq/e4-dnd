import type { CharacterCondition, CharacterConditionDurations, CharacterDeathSaves } from "../character/character.types";

export type DeathSaveStatus = "conscious" | "dying" | "stable" | "dead";

export function getDeathSaveStatus(
  currentHp: number,
  deathSaves: CharacterDeathSaves,
  state?: { stable?: boolean; dead?: boolean },
): DeathSaveStatus {
  if (currentHp > 0) return "conscious";
  if (state?.dead || deathSaves.failures >= 3) return "dead";
  if (state?.stable || deathSaves.successes >= 3) return "stable";
  return "dying";
}

export function advanceConditionDurations(
  conditions: CharacterCondition[],
  durations: CharacterConditionDurations,
): { conditions: CharacterCondition[]; durations: CharacterConditionDurations; expired: CharacterCondition[] } {
  const nextDurations: CharacterConditionDurations = { ...durations };
  const expired: CharacterCondition[] = [];

  for (const condition of conditions) {
    const remaining = nextDurations[condition];
    if (remaining == null) continue;
    const next = Math.max(0, Math.floor(remaining) - 1);
    if (next <= 0) {
      delete nextDurations[condition];
      expired.push(condition);
    } else {
      nextDurations[condition] = next;
    }
  }

  return {
    conditions: conditions.filter((condition) => !expired.includes(condition)),
    durations: nextDurations,
    expired,
  };
}

export function shouldRequestConcentrationSave(
  hasConcentrationEffect: boolean,
  damageTaken: number,
): boolean {
  return hasConcentrationEffect && Math.max(0, Math.floor(damageTaken)) > 0;
}

export function getCombatStatusLabel(status: DeathSaveStatus): string {
  switch (status) {
    case "conscious": return "Ayakta";
    case "dying": return "Ölüm save'i gerekli";
    case "stable": return "Stabil";
    case "dead": return "Ölü";
  }
}
