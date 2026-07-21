import { describe, expect, it } from "vitest";
import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneFeatureChoiceReadiness } from "./levelOneFeatureChoiceReadiness";

const draft = (overrides: Partial<CharacterDraft> = {}): CharacterDraft => ({
  name: "A", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Fighter", subclass: "", background: "Soldier", featIds: [],
  skillProficiencies: ["Perception", "Survival"], expertiseSkills: [], toolProficiencies: [], languages: [], level: 1,
  abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 }, maxHp: 12, armorClass: 16, armorClassMode: "auto",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], resources: [], exhaustion: 0, conditionDurations: {}, notes: "",
  fightingStyleIds: ["defense"], masteredWeaponIds: ["longsword", "longbow", "dagger"], ...overrides,
});

const data = {
  id: "dnd_2024", name: "2024",
  classes: [{ id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], spellcastingAbility: null, armorProficiencies: ["Light", "Medium", "Heavy", "Shield"], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "none", levels: [{ level: 1, proficiencyBonus: 2, features: ["Fighting Style", "Weapon Mastery"], weaponMasteryCount: 3 }] }],
  items: [
    { id: "longsword", name: "Longsword", category: "weapon", cost: "", weight: 3, description: "", damage: "1d8", damageType: "slashing", weaponCategory: "martial", mastery: "Sap" },
    { id: "longbow", name: "Longbow", category: "weapon", cost: "", weight: 2, description: "", damage: "1d8", damageType: "piercing", weaponCategory: "martial", mastery: "Slow" },
    { id: "dagger", name: "Dagger", category: "weapon", cost: "", weight: 1, description: "", damage: "1d4", damageType: "piercing", weaponCategory: "simple", mastery: "Nick" },
  ],
  backgrounds: [], races: [], subclasses: [], feats: [], spells: [], monsters: [],
} as RulesetData;

describe("level one feature choice readiness", () => {
  it("accepts a complete 2024 fighter feature loadout", () => {
    const result = getLevelOneFeatureChoiceReadiness(draft(), data);
    expect(result.ready).toBe(true);
    expect(result.summary).toContain("Fighting Style 1/1");
    expect(result.summary).toContain("Weapon Mastery 3/3");
  });

  it("blocks missing fighting style", () => {
    const result = getLevelOneFeatureChoiceReadiness(draft({ fightingStyleIds: [] }), data);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("Fighting Style");
  });

  it("blocks incomplete weapon mastery choices", () => {
    const result = getLevelOneFeatureChoiceReadiness(draft({ masteredWeaponIds: ["longsword"] }), data);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("3 geçerli Weapon Mastery");
  });

  it("accepts a class with no level-one feature choices", () => {
    const noChoiceData = { ...data, classes: [{ ...data.classes[0], name: "Wizard", id: "wizard", levels: [{ level: 1, proficiencyBonus: 2, features: [] }] }] } as RulesetData;
    const result = getLevelOneFeatureChoiceReadiness(draft({ className: "Wizard", fightingStyleIds: [], masteredWeaponIds: [] }), noChoiceData);
    expect(result.ready).toBe(true);
  });
});
