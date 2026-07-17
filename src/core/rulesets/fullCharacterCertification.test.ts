import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import { certifyCharacterLifecycle, certifyCharacterRecord, getFullCharacterCertification } from "./fullCharacterCertification";
import type { RulesetData } from "./ruleset.types";

const minimalRuleset = (id: "dnd_2014" | "dnd_2024"): RulesetData => ({
  id, name: id,
  classes: Array.from({ length: 12 }, (_, index) => {
    const names = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];
    const name = names[index];
    return { id: name.toLowerCase(), name, hitDie: 8, primaryAbilities: ["str"], savingThrows: ["str", "con"], spellcastingAbility: name === "Fighter" || name === "Barbarian" || name === "Monk" || name === "Rogue" ? null : "cha", armorProficiencies: [], weaponProficiencies: [], skillChoices: { choose: 2, from: ["Athletics"] }, description: "x", subclassLevel: 3, spellProgression: name === "Warlock" ? "pact" : name === "Fighter" || name === "Barbarian" || name === "Monk" || name === "Rogue" ? "none" : "full", levels: Array.from({ length: 20 }, (_, levelIndex) => ({ level: levelIndex + 1, proficiencyBonus: 2 + Math.floor(levelIndex / 4), features: [levelIndex === 19 ? "Capstone" : `Feature ${levelIndex + 1}`], spellSlots: name === "Warlock" ? undefined : [1], pactMagic: name === "Warlock" ? { slotLevel: Math.min(5, Math.ceil((levelIndex + 1) / 2)), slots: 1 } : undefined })) };
  }),
  subclasses: ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"].map((className) => ({ id: `${className.toLowerCase()}-sub`, name: `${className} Sub`, className, ruleset: id, selectionLevel: 3, description: "x", features: [{ level: 3, name: "Feature", summary: "x" }] })),
  races: [{ id: "human", name: "Human", speed: 30, size: "Medium", abilityBonuses: {}, traits: [], description: "x" }],
  backgrounds: [{ id: "soldier", name: "Soldier", description: "x", skillProficiencies: ["Athletics"] }],
  feats: [], spells: Array.from({ length: 10 }, (_, level) => ({ id: `spell-${level}`, name: `Spell ${level}`, level, school: "Evocation", castingTime: "1 action", range: "60 feet", components: ["V"], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Wizard"], description: "x", effectType: "damage", damageDice: "1d6" })),
  items: [{ id: "sword", name: "Sword", category: "weapon", cost: "1 gp", weight: 1, description: "x", damage: "1d6" }, { id: "armor", name: "Armor", category: "armor", cost: "1 gp", weight: 1, description: "x", armorClass: 12 }], monsters: [],
});
const character = (level = 1): Character => ({ id: "hero", name: "Hero", playerName: "Player", ruleset: "homebrew", race: "Human", className: "Cleric", subclass: "", background: "Soldier", featIds: [], skillProficiencies: ["Athletics"], expertiseSkills: [], toolProficiencies: [], languages: [], level, abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, maxHp: 12 + level, currentHp: 10 + level, tempHp: 0, armorClass: 16, armorClassMode: "manual", knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [{ itemId: "sword", quantity: 1 }], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: ["sword"], gold: 0, deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: 10, max: level, used: 0 }], resources: [], exhaustion: 0, conditionDurations: {}, conditions: [], notes: "", createdAt: "2026-01-01", updatedAt: "2026-01-01" });

describe("full character certification", () => {
  it("certifies 24 class-edition combinations", () => { const result = getFullCharacterCertification([minimalRuleset("dnd_2014"), minimalRuleset("dnd_2024")]); expect(result.combinations).toBe(24); expect(result.classMatrix.every((entry) => entry.criticalLevels.includes(20))).toBe(true); });
  it("fails when a critical progression level is absent", () => { const data = minimalRuleset("dnd_2014"); data.classes[0].levels = data.classes[0].levels.filter((entry) => entry.level !== 20); expect(getFullCharacterCertification([data]).status).toBe("needs-work"); });
  it("reports character integrity", () => { expect(certifyCharacterRecord(character(), null).status).toBe("pass"); });
  it("certifies create-level-rest-restore lifecycle", () => { const created = character(1); const leveled = { ...character(2), maxHp: 16, currentHp: 8, spellSlots: [{ level: 1, max: 2, used: 1 }] }; const rested = { ...leveled, currentHp: 16, spellSlots: [{ level: 1, max: 2, used: 0 }] }; const restored = { ...rested }; expect(certifyCharacterLifecycle([{ checkpoint: "created", character: created }, { checkpoint: "leveled", character: leveled }, { checkpoint: "rested", character: rested }, { checkpoint: "restored", character: restored }]).status).toBe("pass"); });
});
