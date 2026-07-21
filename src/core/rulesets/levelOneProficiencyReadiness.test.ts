import { describe, expect, it } from "vitest";
import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneProficiencyReadiness } from "./levelOneProficiencyReadiness";

const draft = (overrides: Partial<CharacterDraft> = {}): CharacterDraft => ({
  name: "A", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Fighter", subclass: "", background: "Soldier", featIds: [],
  skillProficiencies: ["Perception", "Survival"], expertiseSkills: [], toolProficiencies: [], languages: [], level: 1,
  abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 }, maxHp: 12, armorClass: 16, armorClassMode: "auto",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], resources: [], exhaustion: 0, conditionDurations: {}, notes: "", ...overrides,
});

const data = {
  id: "dnd_2024", name: "2024",
  classes: [{ id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], spellcastingAbility: null, armorProficiencies: ["Light", "Medium", "Heavy", "Shield"], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"] }, description: "", subclassLevel: 3, spellProgression: "none", levels: [] }],
  backgrounds: [{ id: "soldier", name: "Soldier", description: "", skillProficiencies: ["Athletics", "Intimidation"] }],
  races: [], subclasses: [], feats: [], spells: [], items: [], monsters: [],
} as RulesetData;

describe("level one proficiency readiness", () => {
  it("accepts exact class skill count without charging background duplicates", () => {
    const result = getLevelOneProficiencyReadiness(draft(), data);
    expect(result.ready).toBe(true);
    expect(result.summary).toContain("Class skill 2/2");
  });

  it("blocks incomplete class skill selection", () => {
    const result = getLevelOneProficiencyReadiness(draft({ skillProficiencies: ["Perception"] }), data);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("2 class skill");
  });

  it("blocks expertise on a non-proficient skill", () => {
    const result = getLevelOneProficiencyReadiness(draft({ expertiseSkills: ["Arcana"] }), data);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("Expertise");
  });

  it("reports automatic saving throw proficiencies", () => {
    const result = getLevelOneProficiencyReadiness(draft(), data);
    expect(result.notices.join(" ")).toContain("STR, CON");
  });
});
