import { describe, expect, it } from "vitest";
import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getLevelOneAncestryReadiness } from "./levelOneAncestryReadiness";

const draft = (overrides: Partial<CharacterDraft> = {}): CharacterDraft => ({
  name: "A", playerName: "", ruleset: "dnd_2014", race: "Elf", subrace: "High Elf", className: "Wizard", subclass: "", background: "Sage", featIds: [],
  skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 1,
  abilities: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 }, maxHp: 8, armorClass: 12, armorClassMode: "auto",
  knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 10,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], resources: [], exhaustion: 0, conditionDurations: {}, notes: "", ...overrides,
});

const data2014 = {
  id: "dnd_2014", name: "2014", classes: [], backgrounds: [], subclasses: [], feats: [], spells: [], items: [], monsters: [],
  races: [{ id: "elf", name: "Elf", speed: 30, size: "Medium", abilityBonuses: { dex: 2 }, traits: ["Darkvision", "Fey Ancestry"], darkvision: 60, description: "", subraces: [{ id: "high-elf", name: "High Elf", abilityBonuses: { int: 1 }, traits: ["Cantrip"], description: "" }] }],
} as RulesetData;

const data2024 = {
  id: "dnd_2024", name: "2024", classes: [], backgrounds: [], subclasses: [], feats: [], spells: [], items: [], monsters: [],
  races: [{ id: "dwarf", name: "Dwarf", speed: 30, size: "Medium", abilityBonuses: {}, traits: ["Darkvision", "Dwarven Resilience", "Dwarven Toughness"], darkvision: 120, description: "" }],
} as RulesetData;

describe("level one ancestry readiness", () => {
  it("accepts a complete 2014 race and subrace", () => {
    const result = getLevelOneAncestryReadiness(draft(), data2014);
    expect(result.ready).toBe(true);
    expect(result.summary).toContain("Subrace High Elf");
  });

  it("blocks a missing required 2014 subrace", () => {
    const result = getLevelOneAncestryReadiness(draft({ subrace: "" }), data2014);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("subrace");
  });

  it("accepts a complete 2024 species without ability bonuses", () => {
    const result = getLevelOneAncestryReadiness(draft({ ruleset: "dnd_2024", race: "Dwarf", subrace: "" }), data2024);
    expect(result.ready).toBe(true);
    expect(result.summary).toContain("Darkvision 120 ft");
  });

  it("blocks legacy ability bonuses on a 2024 species", () => {
    const bad = { ...data2024, races: [{ ...data2024.races[0], abilityBonuses: { con: 2 } }] } as RulesetData;
    const result = getLevelOneAncestryReadiness(draft({ ruleset: "dnd_2024", race: "Dwarf", subrace: "" }), bad);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toContain("background");
  });
});
