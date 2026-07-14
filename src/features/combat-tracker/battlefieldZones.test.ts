import { describe, expect, it } from "vitest";
import { advanceTurn, createBattlefieldZone, createCombatEncounter, createCombatant, sanitizeCombatEncounter, tickBattlefieldZones } from "./combatTrackerStorage";

describe("battlefield zones", () => {
  it("decreases durations and removes expired zones", () => {
    const persistent = { ...createBattlefieldZone("Aura"), remainingRounds: null };
    const expiring = { ...createBattlefieldZone("Fire"), remainingRounds: 1 };
    const active = { ...createBattlefieldZone("Fog"), remainingRounds: 3 };
    const result = tickBattlefieldZones([persistent, expiring, active]);
    expect(result).toHaveLength(2);
    expect(result.find((zone) => zone.name === "Fog")?.remainingRounds).toBe(2);
  });

  it("ticks zones when a new round begins", () => {
    const first = { ...createCombatant("A"), initiative: 20 };
    const second = { ...createCombatant("B"), initiative: 10 };
    const zone = { ...createBattlefieldZone("Spirit Guardians"), remainingRounds: 10 };
    const encounter = { ...createCombatEncounter(), combatants: [first, second], activeCombatantId: second.id, zones: [zone] };
    const result = advanceTurn(encounter);
    expect(result.round).toBe(2);
    expect(result.zones[0].remainingRounds).toBe(9);
  });

  it("sanitizes invalid targets and preserves old encounters", () => {
    const combatant = createCombatant("Tengiz");
    const zone = { ...createBattlefieldZone("Sandstorm"), affectedCombatantIds: [combatant.id, "missing"] };
    const result = sanitizeCombatEncounter({ ...createCombatEncounter(), combatants: [combatant], zones: [zone] });
    expect(result?.zones[0].affectedCombatantIds).toEqual([combatant.id]);
    const legacy = sanitizeCombatEncounter({ ...createCombatEncounter(), combatants: [combatant] });
    expect(legacy?.zones).toEqual([]);
  });
});
