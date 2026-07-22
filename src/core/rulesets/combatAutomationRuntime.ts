import { createTurnEconomy, spendMovement, spendTurnResource, type TurnEconomy, type TurnResource } from "./actionEconomyRules";
import { getConcentrationSaveDc } from "./combatTurnRules";

export type DeathSaveState = {
  successes: number;
  failures: number;
  stabilized: boolean;
  dead: boolean;
};

export type CombatAutomationState = {
  round: number;
  activeCombatantId: string | null;
  economyByCombatant: Record<string, TurnEconomy>;
  speedByCombatant: Record<string, number>;
  concentrationDcByCombatant: Record<string, number | null>;
  deathSavesByCombatant: Record<string, DeathSaveState>;
};

export function createDeathSaveState(): DeathSaveState {
  return { successes: 0, failures: 0, stabilized: false, dead: false };
}

export function createCombatAutomationState(round = 1, activeCombatantId: string | null = null): CombatAutomationState {
  return {
    round: Math.max(1, Math.floor(round)),
    activeCombatantId,
    economyByCombatant: {},
    speedByCombatant: {},
    concentrationDcByCombatant: {},
    deathSavesByCombatant: {},
  };
}

export function ensureCombatantAutomation(
  state: CombatAutomationState,
  combatantId: string,
  speed = 30,
): CombatAutomationState {
  if (!combatantId) return state;
  return {
    ...state,
    economyByCombatant: state.economyByCombatant[combatantId]
      ? state.economyByCombatant
      : { ...state.economyByCombatant, [combatantId]: createTurnEconomy() },
    speedByCombatant: state.speedByCombatant[combatantId] !== undefined
      ? state.speedByCombatant
      : { ...state.speedByCombatant, [combatantId]: Math.max(0, Math.floor(speed)) },
    deathSavesByCombatant: state.deathSavesByCombatant[combatantId]
      ? state.deathSavesByCombatant
      : { ...state.deathSavesByCombatant, [combatantId]: createDeathSaveState() },
  };
}

export function beginAutomatedTurn(
  state: CombatAutomationState,
  combatantId: string,
  round = state.round,
): CombatAutomationState {
  const ensured = ensureCombatantAutomation(state, combatantId);
  const nextRound = Math.max(1, Math.floor(round));
  const roundAdvanced = nextRound > ensured.round;
  const economyByCombatant = roundAdvanced
    ? Object.fromEntries(Object.entries(ensured.economyByCombatant).map(([id, economy]) => [id, { ...economy, reactionUsed: false }]))
    : ensured.economyByCombatant;
  return {
    ...ensured,
    round: nextRound,
    activeCombatantId: combatantId,
    economyByCombatant: { ...economyByCombatant, [combatantId]: createTurnEconomy() },
    concentrationDcByCombatant: { ...ensured.concentrationDcByCombatant, [combatantId]: null },
  };
}

export function spendAutomatedResource(
  state: CombatAutomationState,
  combatantId: string,
  resource: TurnResource,
): CombatAutomationState {
  const ensured = ensureCombatantAutomation(state, combatantId);
  return {
    ...ensured,
    economyByCombatant: {
      ...ensured.economyByCombatant,
      [combatantId]: spendTurnResource(ensured.economyByCombatant[combatantId], resource),
    },
  };
}

export function spendAutomatedMovement(
  state: CombatAutomationState,
  combatantId: string,
  feet: number,
): CombatAutomationState {
  const ensured = ensureCombatantAutomation(state, combatantId);
  const speed = ensured.speedByCombatant[combatantId] ?? 30;
  return {
    ...ensured,
    economyByCombatant: {
      ...ensured.economyByCombatant,
      [combatantId]: spendMovement(ensured.economyByCombatant[combatantId], feet, speed),
    },
  };
}

export function registerConcentrationDamage(
  state: CombatAutomationState,
  combatantId: string,
  damage: number,
  isConcentrating: boolean,
): CombatAutomationState {
  if (!isConcentrating || damage <= 0) return state;
  const ensured = ensureCombatantAutomation(state, combatantId);
  return {
    ...ensured,
    concentrationDcByCombatant: {
      ...ensured.concentrationDcByCombatant,
      [combatantId]: getConcentrationSaveDc(damage),
    },
  };
}

export function resolveDeathSave(
  state: CombatAutomationState,
  combatantId: string,
  roll: number,
): CombatAutomationState {
  const ensured = ensureCombatantAutomation(state, combatantId);
  const current = ensured.deathSavesByCombatant[combatantId];
  if (current.dead || current.stabilized) return ensured;
  const normalized = Math.max(1, Math.min(20, Math.floor(roll)));
  let successes = current.successes;
  let failures = current.failures;
  if (normalized === 20) successes = 3;
  else if (normalized === 1) failures += 2;
  else if (normalized >= 10) successes += 1;
  else failures += 1;
  const next: DeathSaveState = {
    successes: Math.min(3, successes),
    failures: Math.min(3, failures),
    stabilized: successes >= 3,
    dead: failures >= 3,
  };
  return {
    ...ensured,
    deathSavesByCombatant: { ...ensured.deathSavesByCombatant, [combatantId]: next },
  };
}

export function resetDeathSaves(state: CombatAutomationState, combatantId: string): CombatAutomationState {
  const ensured = ensureCombatantAutomation(state, combatantId);
  return {
    ...ensured,
    deathSavesByCombatant: { ...ensured.deathSavesByCombatant, [combatantId]: createDeathSaveState() },
  };
}
