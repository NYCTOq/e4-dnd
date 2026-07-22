import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneSupportReadiness } from "./levelOneSupportReadiness";

const data: RulesetData = {
  id: "dnd_2024",
  name: "2024",
  subclasses: [],
  feats: [],
  monsters: [],
  items: [],
  classes: [{ id: "cleric", name: "Cleric", hitDie: 8, primaryAbilities: ["wis"], savingThrows: ["wis", "cha"], spellcastingAbility: "wis", armorProficiencies: ["Light", "Medium", "Shields"], weaponProficiencies: ["Simple"], skillChoices: { choose: 2, from: ["Insight", "Medicine"] }, description: "", subclassLevel: 3, spellProgression: "full", levels: [] }],
  races: [],
  backgrounds: [],
  spells: [
    { id: "cure-wounds", name: "Cure Wounds", level: 1, school: "Abjuration", castingTime: "Action", range: "Touch", components: ["V", "S"], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Cleric"], description: "A creature regains hit points.", tags: ["healing"] },
    { id: "bless", name: "Bless", level: 1, school: "Enchantment", castingTime: "Action", range: "30 feet", components: ["V", "S", "M"], duration: "1 minute", concentration: true, ritual: false, classes: ["Cleric"], description: "Targets add a d4 to attack rolls and saving throws.", tags: ["support", "buff"] },
  ],
};

function draft() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    className: "Cleric",
    preparedSpellIds: ["cure-wounds", "bless"],
    hitDice: [{ die: 8, max: 1, used: 0 }],
    resources: [{ id: "channel-divinity", name: "Channel Divinity", max: 1, used: 0, recovery: "short" as const }],
  };
}

describe("level one support readiness", () => {
  it("accepts healing, support and recovery options", () => {
    const status = getLevelOneSupportReadiness(draft(), data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/Cure Wounds/);
    expect(status.summary.join(" ")).toMatch(/Bless/);
    expect(status.summary.join(" ")).toMatch(/Hit Dice/);
  });

  it("blocks unknown spell references", () => {
    const status = getLevelOneSupportReadiness({ ...draft(), preparedSpellIds: ["missing"] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/katalogda bulunmayan/);
  });

  it("blocks invalid resource usage", () => {
    const status = getLevelOneSupportReadiness({ ...draft(), resources: [{ id: "lay-on-hands", name: "Lay on Hands", max: 5, used: 8, recovery: "long" }] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/maksimum/);
  });

  it("blocks a missing hit die pool", () => {
    const status = getLevelOneSupportReadiness({ ...draft(), hitDice: [] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Hit Dice/);
  });
});
