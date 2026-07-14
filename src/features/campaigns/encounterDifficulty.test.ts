import { describe, expect, it } from "vitest";
import { calculateEncounterDifficulty } from "./encounterDifficulty";
import { makeCharacter, makeEncounter, makeMonster } from "../../test/fixtures";

function participant(id: string, sourceType: "character" | "monster", sourceId: string) {
  return {
    id,
    sourceType,
    sourceId,
    name: id,
    armorClass: 10,
    maxHp: 10,
    currentHp: 10,
    initiative: null,
    initiativeModifier: 0,
    notes: "",
    conditions: [],
  };
}

describe("calculateEncounterDifficulty", () => {
  it("uses encounter characters and applies monster-count multiplier", () => {
    const party = [
      makeCharacter({ id: "c1", level: 5 }),
      makeCharacter({ id: "c2", level: 5 }),
      makeCharacter({ id: "c3", level: 5 }),
      makeCharacter({ id: "c4", level: 5 }),
    ];
    const encounter = makeEncounter([
      ...party.map((character) => participant(`p-${character.id}`, "character", character.id)),
      participant("m1", "monster", "ogre"),
      participant("m2", "monster", "ogre"),
    ]);

    const result = calculateEncounterDifficulty({
      encounter,
      campaignParty: party,
      monsters: [makeMonster({ id: "ogre", challengeRating: "2" })],
    });

    expect(result.partySource).toBe("encounter");
    expect(result.baseXp).toBe(900);
    expect(result.multiplier).toBe(1.5);
    expect(result.adjustedXp).toBe(1350);
    expect(result.difficulty).toBe("Easy");
  });

  it("falls back to campaign party and reports unknown monsters", () => {
    const result = calculateEncounterDifficulty({
      encounter: makeEncounter([participant("m1", "monster", "missing")]),
      campaignParty: [makeCharacter({ level: 3 })],
      monsters: [],
    });

    expect(result.partySource).toBe("campaign");
    expect(result.unknownMonsterCount).toBe(1);
    expect(result.baseXp).toBe(0);
    expect(result.difficulty).toBe("Trivial");
  });
});
