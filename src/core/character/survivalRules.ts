import type { CharacterDeathSaves } from "./character.types";

export type SurvivalState = {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  deathSaves: CharacterDeathSaves;
};

export type DamageResult = SurvivalState & {
  absorbedByTempHp: number;
  hpDamage: number;
  concentrationDc: number | null;
  massiveDamage: boolean;
};

export function getConcentrationDc(damage: number) {
  return damage > 0 ? Math.max(10, Math.floor(damage / 2)) : null;
}

export function applyDamage(state: SurvivalState, amount: number, critical = false): DamageResult {
  const damage = Math.max(0, Math.floor(amount));
  const absorbedByTempHp = Math.min(state.tempHp, damage);
  const remainingDamage = damage - absorbedByTempHp;
  const hpBefore = Math.max(0, state.currentHp);
  const hpDamage = Math.min(hpBefore, remainingDamage);
  const currentHp = Math.max(0, hpBefore - remainingDamage);
  const overflow = Math.max(0, remainingDamage - hpBefore);
  const massiveDamage = hpBefore > 0 && currentHp === 0 && overflow >= state.maxHp;
  let deathSaves = { ...state.deathSaves };

  if (massiveDamage) deathSaves = { successes: 0, failures: 3 };
  else if (hpBefore === 0 && remainingDamage > 0) {
    deathSaves.failures = Math.min(3, deathSaves.failures + (critical ? 2 : 1));
  }

  return {
    ...state,
    currentHp,
    tempHp: state.tempHp - absorbedByTempHp,
    deathSaves,
    absorbedByTempHp,
    hpDamage,
    concentrationDc: getConcentrationDc(damage),
    massiveDamage,
  };
}

export function applyHealing(state: SurvivalState, amount: number): SurvivalState {
  const healing = Math.max(0, Math.floor(amount));
  const currentHp = Math.min(state.maxHp, state.currentHp + healing);
  return {
    ...state,
    currentHp,
    deathSaves: currentHp > 0 ? { successes: 0, failures: 0 } : state.deathSaves,
  };
}

export function resolveDeathSave(state: SurvivalState, roll: number): SurvivalState {
  if (state.currentHp > 0 || state.deathSaves.failures >= 3 || state.deathSaves.successes >= 3) return state;
  if (roll === 20) return { ...state, currentHp: 1, deathSaves: { successes: 0, failures: 0 } };
  const deathSaves = { ...state.deathSaves };
  if (roll === 1) deathSaves.failures = Math.min(3, deathSaves.failures + 2);
  else if (roll >= 10) deathSaves.successes = Math.min(3, deathSaves.successes + 1);
  else deathSaves.failures = Math.min(3, deathSaves.failures + 1);
  return { ...state, deathSaves };
}
