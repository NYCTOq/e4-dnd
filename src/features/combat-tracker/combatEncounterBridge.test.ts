import { describe, expect, it } from "vitest";
import type { CampaignEncounter } from "../campaigns/campaignTypes";
import {
  createCombatEncounter,
  createCombatTemplate,
  createCombatant,
  createEncounterFromCampaignEncounter,
  createEncounterFromTemplate,
} from "./combatTrackerStorage";

describe("combat encounter bridge", () => {
  it("imports campaign participants into a live combat encounter", () => {
    const source: CampaignEncounter = {
      id: "encounter-1",
      name: "Harbor Ambush",
      round: 3,
      activeTurnIndex: 0,
      isActive: true,
      participants: [{
        id: "participant-1",
        sourceType: "monster",
        sourceId: "bandit",
        name: "Bandit Captain",
        armorClass: 15,
        maxHp: 65,
        currentHp: 41,
        initiative: 17,
        initiativeModifier: 2,
        notes: "Uses smoke bombs",
        conditions: [],
      }],
      rewards: [],
      createdAt: "2026-07-14T00:00:00.000Z",
      updatedAt: "2026-07-14T00:00:00.000Z",
    };

    const encounter = createEncounterFromCampaignEncounter(source, "campaign-1");
    expect(encounter.campaignId).toBe("campaign-1");
    expect(encounter.round).toBe(3);
    expect(encounter.combatants[0]).toMatchObject({ name: "Bandit Captain", currentHp: 41, kind: "Canavar" });
  });

  it("creates reusable templates without carrying damage or logs", () => {
    const combatant = { ...createCombatant("Tengiz", "Karakter"), maxHp: 30, currentHp: 4, initiative: 18 };
    const encounter = { ...createCombatEncounter("Boss Fight", "campaign-1"), combatants: [combatant], log: [{
      id: "log-1", kind: "Hasar" as const, round: 1, combatantId: combatant.id, combatantName: combatant.name, amount: 26, message: "Damage", createdAt: "2026-07-14T00:00:00.000Z",
    }] };

    const template = createCombatTemplate(encounter);
    const restored = createEncounterFromTemplate(template);
    expect(restored.log).toEqual([]);
    expect(restored.combatants[0].currentHp).toBe(30);
    expect(restored.combatants[0].initiative).toBe(18);
  });
});
