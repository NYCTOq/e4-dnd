import { describe, expect, it } from "vitest";
import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { normalizeDraftForProgression } from "./progressionDraftNormalization";

const baseDraft: CharacterDraft = {
  name: "Test", playerName: "", ruleset: "dnd_2024", race: "Human", className: "Sorcerer", subclass: "Draconic Sorcery", background: "Acolyte",
  featIds: ["feat-a", "feat-b", "feat-c", "feat-d", "feat-e"], featChoices: {}, fightingStyleIds: [], masteredWeaponIds: [], metamagicIds: ["careful-spell", "distant-spell", "empowered-spell", "extended-spell", "heightened-spell", "quickened-spell"], invocationIds: [], wildShapeFormIds: [], maneuverIds: [], arcanumSpellIds: [], usedArcanumSpellIds: [],
  skillProficiencies: [], expertiseSkills: [], toolProficiencies: [], languages: [], level: 20,
  abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 18 }, abilityScoreIncreases: { cha: 6, con: 4 },
  maxHp: 100, armorClass: 10, armorClassMode: "manual", knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [], exhaustion: 0, conditionDurations: {}, notes: "",
};

function classData(name: string, subclassLevel: number, spellProgression: "none" | "full" = "none") {
  return { id: name.toLowerCase(), name, hitDie: 8, primaryAbilities: [], savingThrows: [], spellcastingAbility: spellProgression === "none" ? null : "cha", armorProficiencies: [], weaponProficiencies: [], skillChoices: { choose: 0, from: [] }, description: "", subclassLevel, spellProgression, levels: Array.from({ length: 20 }, (_, i) => ({ level: i + 1, proficiencyBonus: 2 + Math.floor(i / 4), features: [], spellSlots: [] })) } as const;
}

const ruleset = {
  classes: [classData("Sorcerer", 3, "full"), classData("Fighter", 3), classData("Warlock", 3, "full")],
  subclasses: [
    { id: "draconic", name: "Draconic Sorcery", className: "Sorcerer", selectionLevel: 3, description: "", features: [] },
    { id: "champion", name: "Champion", className: "Fighter", selectionLevel: 3, description: "", features: [] },
  ],
  races: [], backgrounds: [], feats: ["a", "b", "c", "d", "e"].map((id) => ({ id: `feat-${id}`, name: id, description: "" })), items: [], spells: [],
} as unknown as RulesetData;

describe("progression draft normalization", () => {
  it("removes subclass and high-level choices after a level drop", () => {
    const normalized = normalizeDraftForProgression({ ...baseDraft, level: 2 }, ruleset);
    expect(normalized.subclass).toBe("");
    expect(normalized.featIds).toEqual([]);
    expect(normalized.metamagicIds).toHaveLength(2);
    expect(normalized.abilityScoreIncreases).toEqual({});
  });

  it("removes choices belonging to a previous class", () => {
    const normalized = normalizeDraftForProgression({ ...baseDraft, className: "Fighter", subclass: "Draconic Sorcery", level: 5 }, ruleset);
    expect(normalized.subclass).toBe("");
    expect(normalized.metamagicIds).toEqual([]);
  });

  it("removes a subclass that belongs to another edition/catalog", () => {
    const normalized = normalizeDraftForProgression({ ...baseDraft, subclass: "Clockwork Soul" }, ruleset);
    expect(normalized.subclass).toBe("");
  });

  it("clamps level to the legal 1-20 range", () => {
    expect(normalizeDraftForProgression({ ...baseDraft, level: 99 }, ruleset).level).toBe(20);
    expect(normalizeDraftForProgression({ ...baseDraft, level: 0 }, ruleset).level).toBe(1);
  });
});
