import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneSocialReadiness } from "./levelOneSocialReadiness";

const data: RulesetData = {
  id: "dnd_2024",
  name: "2024",
  subclasses: [],
  feats: [],
  monsters: [],
  items: [],
  classes: [{ id: "bard", name: "Bard", hitDie: 8, primaryAbilities: ["cha"], savingThrows: ["dex", "cha"], spellcastingAbility: "cha", armorProficiencies: ["Light"], weaponProficiencies: ["Simple"], skillChoices: { choose: 3, from: ["Performance", "Persuasion"] }, description: "", subclassLevel: 3, spellProgression: "full", levels: [] }],
  races: [{ id: "human", name: "Human", speed: 30, size: "Medium", abilityBonuses: {}, traits: [], description: "", languages: ["Common"] }],
  backgrounds: [{ id: "entertainer", name: "Entertainer", description: "", skillProficiencies: ["Performance", "Persuasion"] }],
  spells: [{ id: "friends", name: "Friends", level: 0, school: "Enchantment", castingTime: "Action", range: "Self", components: ["S"], duration: "1 minute", concentration: true, ritual: false, classes: ["Bard"], description: "Influence a creature socially.", tags: ["social"] }],
};

function draft() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    name: "Liora",
    playerName: "Hüseyin",
    race: "Human",
    className: "Bard",
    background: "Entertainer",
    skillProficiencies: ["Performance", "Persuasion"],
    languages: ["Common", "Elvish"],
    knownSpellIds: ["friends"],
    notes: "Kalabalıkları etkilemek ve kayıp kardeşini bulmak istiyor.",
  };
}

describe("level one social readiness", () => {
  it("accepts a complete identity and social profile", () => {
    const status = getLevelOneSocialReadiness(draft(), data);
    expect(status.ready).toBe(true);
    expect(status.summary.join(" ")).toMatch(/Liora/);
    expect(status.summary.join(" ")).toMatch(/Friends/);
  });

  it("blocks missing core identity selections", () => {
    const status = getLevelOneSocialReadiness({ ...draft(), name: "", className: "Missing", race: "", background: "" }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Karakter adı/);
    expect(status.blockers.join(" ")).toMatch(/Class/);
    expect(status.blockers.join(" ")).toMatch(/Race\/Species/);
    expect(status.blockers.join(" ")).toMatch(/Background/);
  });

  it("reports missing player and roleplay notes as notices", () => {
    const status = getLevelOneSocialReadiness({ ...draft(), playerName: "", notes: "" }, data);
    expect(status.ready).toBe(true);
    expect(status.notices.join(" ")).toMatch(/Oyuncu adı/);
    expect(status.notices.join(" ")).toMatch(/kişilik/);
  });

  it("blocks unknown spell references", () => {
    const status = getLevelOneSocialReadiness({ ...draft(), knownSpellIds: ["missing"] }, data);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/katalogda bulunmayan/);
  });
});
