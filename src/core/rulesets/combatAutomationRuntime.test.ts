import { describe, expect, it } from "vitest";
import {
  beginAutomatedTurn,
  createCombatAutomationState,
  registerConcentrationDamage,
  resolveDeathSave,
  spendAutomatedMovement,
  spendAutomatedResource,
} from "./combatAutomationRuntime";

describe("combat automation runtime", () => {
  it("resets the active combatant economy when a turn begins", () => {
    let state = createCombatAutomationState(1, "a");
    state = spendAutomatedResource(state, "a", "action");
    state = spendAutomatedMovement(state, "a", 20);
    state = beginAutomatedTurn(state, "a", 1);
    expect(state.economyByCombatant.a).toEqual({ actionUsed: false, bonusActionUsed: false, reactionUsed: false, movementUsed: 0, attacksUsed: 0 });
  });

  it("caps movement at the configured speed", () => {
    let state = createCombatAutomationState();
    state = spendAutomatedMovement(state, "a", 20);
    state = spendAutomatedMovement(state, "a", 20);
    expect(state.economyByCombatant.a.movementUsed).toBe(30);
  });

  it("refreshes reactions when a new round begins", () => {
    let state = createCombatAutomationState(1, "a");
    state = spendAutomatedResource(state, "b", "reaction");
    state = beginAutomatedTurn(state, "a", 2);
    expect(state.economyByCombatant.b.reactionUsed).toBe(false);
  });

  it("creates concentration DC from damage", () => {
    const state = registerConcentrationDamage(createCombatAutomationState(), "a", 27, true);
    expect(state.concentrationDcByCombatant.a).toBe(13);
  });

  it("handles natural 1 and natural 20 death saves", () => {
    let state = resolveDeathSave(createCombatAutomationState(), "a", 1);
    expect(state.deathSavesByCombatant.a.failures).toBe(2);
    state = resolveDeathSave(state, "a", 20);
    expect(state.deathSavesByCombatant.a.stabilized).toBe(true);
  });

  it("marks a combatant dead at three failures", () => {
    let state = createCombatAutomationState();
    state = resolveDeathSave(state, "a", 2);
    state = resolveDeathSave(state, "a", 3);
    state = resolveDeathSave(state, "a", 4);
    expect(state.deathSavesByCombatant.a.dead).toBe(true);
  });
});
