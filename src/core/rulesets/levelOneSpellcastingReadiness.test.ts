import { describe, expect, it } from "vitest";
import { getLevelOneSpellcastingReadiness } from "./levelOneSpellcastingReadiness";
import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";

const draft = (overrides: Partial<CharacterDraft> = {}): CharacterDraft => ({
  name: "A", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Wizard", subclass: "", background: "Sage", featIds: [], skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 1,
  abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 8 }, maxHp: 8, armorClass: 12, armorClassMode: "manual",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], exhaustion: 0, conditionDurations: {}, notes: "", ...overrides,
});
const row = { level: 1, proficiencyBonus: 2, features: [], spellSlots: [2,0,0,0,0,0,0,0,0] };
const data = {
  classes: [
    { id: "wizard", name: "Wizard", hitDie: 6, primaryAbilities: ["int"], savingThrowProficiencies: ["int", "wis"], armorProficiencies: [], weaponProficiencies: [], skillChoices: { choose: 2, from: [] }, spellcastingAbility: "int", spellProgression: "full", features: [], levels: [row] },
    { id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrowProficiencies: ["str", "con"], armorProficiencies: [], weaponProficiencies: [], skillChoices: { choose: 2, from: [] }, spellProgression: "none", features: [], levels: [{...row, spellSlots:[0,0,0,0,0,0,0,0,0]}] },
  ],
  spells: [
    { id: "fire-bolt", name: "Fire Bolt", level: 0, school: "Evocation", castingTime: "1 Action", range: "120 feet", components: "V, S", duration: "Instantaneous", classes: ["Wizard"] },
    { id: "mage-hand", name: "Mage Hand", level: 0, school: "Conjuration", castingTime: "1 Action", range: "30 feet", components: "V, S", duration: "1 minute", classes: ["Wizard"] },
    { id: "light", name: "Light", level: 0, school: "Evocation", castingTime: "1 Action", range: "Touch", components: "V, M", duration: "1 hour", classes: ["Wizard"] },
    ...Array.from({ length: 4 }, (_, i) => ({ id: `spell-${i}`, name: `Spell ${i}`, level: 1, school: "Evocation", castingTime: "1 Action", range: "60 feet", components: "V, S", duration: "Instantaneous", classes: ["Wizard"] })),
  ], races: [], backgrounds: [], subclasses: [], feats: [], items: [],
} as unknown as RulesetData;

describe("level one spellcasting readiness", () => {
  it("accepts a complete 2024 wizard spell selection", () => {
    const result = getLevelOneSpellcastingReadiness(draft({ preparedSpellIds: ["fire-bolt", "mage-hand", "light", "spell-0", "spell-1", "spell-2", "spell-3"] }), data);
    expect(result.ready).toBe(true); expect(result.summary).toContain("Cantrip 3/3"); expect(result.summary).toContain("Prepared spell 4/4");
  });
  it("blocks incomplete caster choices", () => { expect(getLevelOneSpellcastingReadiness(draft({ preparedSpellIds: ["fire-bolt"] }), data).ready).toBe(false); });
  it("does not require spells from a noncaster", () => { const result = getLevelOneSpellcastingReadiness(draft({ className: "Fighter" }), data); expect(result.applicable).toBe(false); expect(result.ready).toBe(true); });
  it("excludes always prepared spells from the normal prepared quota", () => { const result = getLevelOneSpellcastingReadiness(draft({ preparedSpellIds: ["fire-bolt", "mage-hand", "light", "spell-0", "spell-1", "spell-2", "spell-3"] }), data, ["spell-3"]); expect(result.ready).toBe(false); expect(result.notices[0]).toContain("Always Prepared"); });
});
