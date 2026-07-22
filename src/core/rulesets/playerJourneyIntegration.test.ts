import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import { getPlayerJourneyIntegrationSnapshot } from "./playerJourneyIntegration";

const character = {
  id: "hero", name: "Hero", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Warlock", subclass: "", background: "",
  featIds: [], skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 3,
  abilities: { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, maxHp: 24, currentHp: 18, tempHp: 0, armorClass: 14, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [{ level: 1, max: 2, used: 0 }], pactMagicSlots: [{ level: 2, max: 2, used: 1 }],
  inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0, deathSaves: { successes: 0, failures: 0 },
  hitDice: [{ die: 8, max: 3, used: 0 }], resources: [{ id: "inv", name: "Invocation", max: 1, used: 1, recovery: "short" }], exhaustion: 0, conditionDurations: {}, conditions: [], notes: "", createdAt: "", updatedAt: "",
} satisfies Character;

describe("player journey integration", () => {
  it("recommends a short rest for Pact Magic and short-rest resources", () => {
    const snapshot = getPlayerJourneyIntegrationSnapshot(character);
    expect(snapshot.restRecommendation).toBe("short");
    expect(snapshot.spentPactSlots).toBe(1);
    expect(snapshot.shortRestRecoveryCount).toBe(2);
  });

  it("recommends a long rest when normal spell slots or Hit Dice are spent", () => {
    const snapshot = getPlayerJourneyIntegrationSnapshot({ ...character, spellSlots: [{ level: 1, max: 2, used: 1 }], hitDice: [{ die: 8, max: 3, used: 1 }] });
    expect(snapshot.restRecommendation).toBe("long");
    expect(snapshot.longRestRecoveryCount).toBeGreaterThan(0);
  });

  it("reports a fully ready journey when nothing is spent", () => {
    const snapshot = getPlayerJourneyIntegrationSnapshot({ ...character, currentHp: 24, pactMagicSlots: [{ level: 2, max: 2, used: 0 }], resources: [{ ...character.resources[0], used: 0 }] });
    expect(snapshot.restRecommendation).toBe("none");
    expect(snapshot.playReady).toBe(true);
  });
});
