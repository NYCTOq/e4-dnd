import { expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneOffenseReadiness } from "./levelOneOffenseReadiness";

const data: RulesetData = {
  id: "dnd_2024", name: "2024", subclasses: [], races: [], backgrounds: [], feats: [], monsters: [],
  classes: [
    { id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"], spellcastingAbility: null, armorProficiencies: [], weaponProficiencies: ["Simple", "Martial"], skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "none", levels: [] },
    { id: "wizard", name: "Wizard", hitDie: 6, primaryAbilities: ["int"], savingThrows: ["int", "wis"], spellcastingAbility: "int", armorProficiencies: [], weaponProficiencies: ["Simple"], skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "full", levels: [] },
    { id: "monk", name: "Monk", hitDie: 8, primaryAbilities: ["dex", "wis"], savingThrows: ["str", "dex"], spellcastingAbility: null, armorProficiencies: [], weaponProficiencies: ["Simple"], skillChoices: { choose: 2, from: [] }, description: "", subclassLevel: 3, spellProgression: "none", levels: [] },
  ],
  items: [{ id: "longsword", name: "Longsword", category: "weapon", cost: "15 gp", weight: 3, description: "", damage: "1d8", damageType: "slashing", weaponCategory: "martial", properties: ["Versatile 1d10"] }],
  spells: [{ id: "fire-bolt", name: "Fire Bolt", level: 0, school: "Evocation", castingTime: "Action", range: "120 feet", components: ["V", "S"], duration: "Instantaneous", concentration: false, ritual: false, classes: ["Wizard"], description: "", attackType: "spell-attack", effectType: "damage", damageDice: "1d10" }],
};

it("accepts a fighter with a complete weapon attack profile", () => {
  const status = getLevelOneOffenseReadiness({ ...emptyDraft, className: "Fighter", level: 1, abilities: { ...emptyDraft.abilities, str: 16 }, inventory: [{ itemId: "longsword", quantity: 1 }], equippedWeaponIds: ["longsword"] }, data);
  expect(status.ready).toBe(true);
  expect(status.summary.join(" ")).toMatch(/Longsword STR \+5/);
});

it("accepts an offensive wizard spell and reports spell math", () => {
  const status = getLevelOneOffenseReadiness({ ...emptyDraft, className: "Wizard", level: 1, abilities: { ...emptyDraft.abilities, int: 16 }, knownSpellIds: ["fire-bolt"] }, data);
  expect(status.ready).toBe(true);
  expect(status.summary.join(" ")).toMatch(/Spell Attack \+5.*Spell DC 13/);
});

it("accepts a monk without an equipped weapon", () => {
  const status = getLevelOneOffenseReadiness({ ...emptyDraft, className: "Monk", level: 1, abilities: { ...emptyDraft.abilities, dex: 16 } }, data);
  expect(status.ready).toBe(true);
  expect(status.summary.join(" ")).toMatch(/Unarmed Strike \+5/);
});

it("blocks a character with no reliable offensive option", () => {
  const status = getLevelOneOffenseReadiness({ ...emptyDraft, className: "Fighter", level: 1 }, data);
  expect(status.ready).toBe(false);
  expect(status.blockers.join(" ")).toMatch(/silah, saldırı büyüsü/);
});
