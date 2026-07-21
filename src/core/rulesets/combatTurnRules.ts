import { createTurnEconomy, type TurnEconomy } from "./actionEconomyRules";

export type CombatTurnState = {
  round: number;
  turn: number;
  activeCombatantId: string | null;
  economy: TurnEconomy;
};

export function createCombatTurnState(activeCombatantId: string | null = null): CombatTurnState {
  return { round: 1, turn: 1, activeCombatantId, economy: createTurnEconomy() };
}

export function beginCombatTurn(state: CombatTurnState, activeCombatantId = state.activeCombatantId): CombatTurnState {
  return { ...state, activeCombatantId, economy: createTurnEconomy() };
}

export function endCombatTurn(state: CombatTurnState, combatantCount = 1): CombatTurnState {
  const count = Math.max(1, Math.floor(combatantCount));
  const nextTurn = state.turn + 1;
  const wraps = nextTurn > count;
  return {
    ...state,
    round: wraps ? state.round + 1 : state.round,
    turn: wraps ? 1 : nextTurn,
    economy: createTurnEconomy(),
  };
}

export function getConcentrationSaveDc(damage: number): number {
  return Math.max(10, Math.floor(Math.max(0, damage) / 2));
}

export function canTakeOpportunityAttack(state: CombatTurnState): boolean {
  return !state.economy.reactionUsed;
}
