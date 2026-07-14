import { describe, expect, it } from "vitest";
import {
  addCombatLog,
  createCombatEncounter,
  createCombatLogEntry,
  createCombatant,
  getCombatSummary,
  sanitizeCombatEncounter,
} from "./combatTrackerStorage";

describe("combat log", () => {
  it("adds newest events to the beginning", () => {
    const encounter = createCombatEncounter("Test");
    const first = createCombatLogEntry("Sistem", 1, "İlk olay");
    const second = createCombatLogEntry("Not", 1, "İkinci olay");
    const result = addCombatLog(addCombatLog(encounter, first), second);
    expect(result.log.map((entry) => entry.message)).toEqual(["İkinci olay", "İlk olay"]);
  });

  it("calculates damage, healing and defeated counts", () => {
    const defeated = { ...createCombatant("Goblin"), currentHp: 0, isDefeated: true };
    let encounter = { ...createCombatEncounter("Özet"), round: 4, combatants: [defeated] };
    encounter = addCombatLog(encounter, createCombatLogEntry("Hasar", 2, "Hasar", defeated, 18));
    encounter = addCombatLog(encounter, createCombatLogEntry("İyileştirme", 3, "İyileştirme", defeated, 7));
    expect(getCombatSummary(encounter)).toEqual({ rounds: 4, damage: 18, healing: 7, defeated: 1, events: 2 });
  });

  it("keeps old encounters compatible when log is missing", () => {
    const sanitized = sanitizeCombatEncounter({ id: "old", name: "Eski", combatants: [], round: 1 });
    expect(sanitized?.log).toEqual([]);
  });
});
