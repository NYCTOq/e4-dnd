import { describe, expect, it } from "vitest";
import { advanceTurn, applyDamage, applyHealing, createCombatEffect, createCombatant, getActiveConditions, sanitizeCombatEncounter, sortCombatants, tickCombatEffects } from "./combatTrackerStorage";

describe("combat tracker storage", () => {
  it("orders combatants by initiative", () => {
    const low = { ...createCombatant("Low"), id: "low", initiative: 5 };
    const high = { ...createCombatant("High"), id: "high", initiative: 18 };
    expect(sortCombatants([low, high]).map((item) => item.id)).toEqual(["high", "low"]);
  });

  it("uses temporary hp before current hp", () => {
    const result = applyDamage({ ...createCombatant(), maxHp: 20, currentHp: 20, tempHp: 5 }, 8);
    expect(result.tempHp).toBe(0);
    expect(result.currentHp).toBe(17);
    expect(applyHealing(result, 99).currentHp).toBe(20);
  });

  it("advances rounds and sanitizes invalid values", () => {
    const first = { ...createCombatant("A"), id: "a", initiative: 20 };
    const second = { ...createCombatant("B"), id: "b", initiative: 10 };
    const sanitized = sanitizeCombatEncounter({ id: "e", name: "Fight", round: -4, activeCombatantId: "b", combatants: [first, second] });
    expect(sanitized?.round).toBe(1);
    expect(advanceTurn(sanitized!).round).toBe(2);
    expect(advanceTurn(sanitized!).activeCombatantId).toBe("a");
  });

  it("decreases timed effects and removes expired ones", () => {
    const combatant = { ...createCombatant("A"), effects: [createCombatEffect("Blessed", 2, "Cleric"), createCombatEffect("Haki", null)] };
    const firstTick = tickCombatEffects([combatant])[0];
    expect(firstTick.effects[0].remainingRounds).toBe(1);
    expect(tickCombatEffects([firstTick])[0].effects.map((effect) => effect.condition)).toEqual(["Haki"]);
  });

  it("combines permanent conditions with timed effects", () => {
    const combatant = { ...createCombatant(), conditions: ["Prone" as const], effects: [createCombatEffect("Poisoned", 3)] };
    expect(getActiveConditions(combatant)).toEqual(["Prone", "Poisoned"]);
  });
});
