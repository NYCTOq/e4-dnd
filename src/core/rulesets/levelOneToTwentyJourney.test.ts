import { describe, expect, it } from "vitest";
import {
  LEVEL_ONE_TO_TWENTY_SCENARIOS,
  getLevelOneToTwentyJourneyCoverage,
  getRequiredMilestonesAtLevel,
} from "./levelOneToTwentyJourney";

describe("level 1-20 advancement journey", () => {
  it("covers six classes and both official editions", () => {
    expect(getLevelOneToTwentyJourneyCoverage()).toMatchObject({
      ready: true,
      scenarioCount: 6,
      classCount: 6,
      rulesetCount: 2,
      uniqueIds: true,
    });
  });

  it("covers subclass, feat, epic boon, caster, pact magic and capstone milestones", () => {
    expect(getLevelOneToTwentyJourneyCoverage()).toMatchObject({
      coversSubclass: true,
      coversAsiFeat: true,
      coversEpicBoon: true,
      coversExtraAttack: true,
      coversSpellProgression: true,
      coversPactMagic: true,
      coversCapstone: true,
    });
  });

  it("models Fighter and Rogue bonus ASI milestones", () => {
    const fighter = LEVEL_ONE_TO_TWENTY_SCENARIOS.find((item) => item.className === "Fighter");
    const rogue = LEVEL_ONE_TO_TWENTY_SCENARIOS.find((item) => item.className === "Rogue");
    expect(fighter?.asiLevels).toEqual([4, 6, 8, 12, 14, 16, 19]);
    expect(rogue?.asiLevels).toContain(10);
  });

  it("requires subclass at level 3 and rejects levels outside 1-20", () => {
    const wizard = LEVEL_ONE_TO_TWENTY_SCENARIOS.find((item) => item.className === "Wizard");
    expect(wizard && getRequiredMilestonesAtLevel(wizard, 3).map((item) => item.kind)).toContain("subclass");
    expect(wizard && getRequiredMilestonesAtLevel(wizard, 0)).toEqual([]);
    expect(wizard && getRequiredMilestonesAtLevel(wizard, 21)).toEqual([]);
  });
});
