import { describe, expect, it } from "vitest";
import { spendTurnResource } from "./actionEconomyRules";
import { beginCombatTurn, canTakeOpportunityAttack, createCombatTurnState, endCombatTurn, getConcentrationSaveDc } from "./combatTurnRules";

describe("combat turn runtime", () => {
  it("starts at round one and refreshes action economy at turn start", () => {
    const spent = { ...createCombatTurnState("hero"), economy: spendTurnResource(createCombatTurnState().economy, "action") };
    expect(beginCombatTurn(spent).economy.actionUsed).toBe(false);
  });

  it("advances turns and wraps into the next round", () => {
    const first = createCombatTurnState("hero");
    expect(endCombatTurn(first, 2)).toMatchObject({ round: 1, turn: 2 });
    expect(endCombatTurn({ ...first, turn: 2 }, 2)).toMatchObject({ round: 2, turn: 1 });
  });

  it("uses the official concentration DC floor and half-damage rule", () => {
    expect(getConcentrationSaveDc(1)).toBe(10);
    expect(getConcentrationSaveDc(21)).toBe(10);
    expect(getConcentrationSaveDc(30)).toBe(15);
  });

  it("blocks opportunity attacks after reaction is spent", () => {
    const ready = createCombatTurnState();
    const spent = { ...ready, economy: spendTurnResource(ready.economy, "reaction") };
    expect(canTakeOpportunityAttack(ready)).toBe(true);
    expect(canTakeOpportunityAttack(spent)).toBe(false);
  });
});
