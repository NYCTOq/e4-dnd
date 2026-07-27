import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const detail = readFileSync(new URL("../../features/characters/CharacterDetail.tsx", import.meta.url), "utf8");
const certification = readFileSync(new URL("../../core/rulesets/characterSheetCertification.ts", import.meta.url), "utf8");

describe("v5.118C character derived stats UI bridge", () => {
  it("exposes one canonical snapshot through the Character Sheet certification", () => {
    expect(certification).toContain("derivedStats:getCharacterJourneySnapshot(character,rulesetData)");
    expect(detail).toContain("const derivedStats=sheetCertification.derivedStats");
  });

  it("renders and rolls canonical values instead of legacy shortcuts", () => {
    for (const token of [
      "derivedStats.armorClass",
      "derivedStats.proficiencyBonus",
      "derivedStats.initiative",
      "derivedStats.passivePerception",
      "derivedStats.spellSaveDc",
      "derivedStats.spellAttackBonus",
    ]) expect(detail).toContain(token);
    expect(detail).not.toContain("getPassivePerception(activeCharacter)");
    expect(detail).not.toContain("getInitiative(activeCharacter)");
  });
});
