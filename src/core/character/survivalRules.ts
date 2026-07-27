import type {
  CharacterDeathDyingHistoryEntry,
  CharacterDeathSaves,
} from "./character.types";
import {
  applyDamageToDyingCharacter,
  healDyingCharacter,
  rollCharacterDeathSave,
  stabilizeDyingCharacter,
} from "../rulesets/deathDyingCharacterAdapter";

export type SurvivalState = {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  deathSaves: CharacterDeathSaves;
  deathSaveStable?: boolean;
  dead?: boolean;
  deathDyingHistory?: CharacterDeathDyingHistoryEntry[];
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

export function applyDamage(
  state: SurvivalState,
  amount: number,
  critical = false,
): DamageResult {
  const result = applyDamageToDyingCharacter(state, amount, { critical });
  return {
    ...state,
    ...result.character,
    absorbedByTempHp: result.absorbedByTempHp,
    hpDamage: result.hpDamage,
    concentrationDc: result.concentrationDc,
    massiveDamage: result.massiveDamage,
  };
}

export function applyHealing(
  state: SurvivalState,
  amount: number,
): SurvivalState {
  return {
    ...state,
    ...healDyingCharacter(state, amount),
  };
}

export function resolveDeathSave(
  state: SurvivalState,
  roll: number,
): SurvivalState {
  return {
    ...state,
    ...rollCharacterDeathSave(state, roll).character,
  };
}

export function stabilizeCharacter(
  state: SurvivalState,
): SurvivalState {
  return {
    ...state,
    ...stabilizeDyingCharacter(state),
  };
}
