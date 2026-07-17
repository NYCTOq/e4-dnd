import { describe, expect, it } from "vitest";
import { applyUnifiedChoice, getIncompleteUnifiedChoices, getUnifiedCharacterChoices, type UnifiedChoiceState } from "./unifiedCharacterChoices";
import { makeCharacter } from "../../test/fixtures";

const ruleset = { classes: [{ name: "Fighter", subclassLevel: 3, levels: [{ level: 1, proficiencyBonus: 2, features: [], weaponMasteryCount: 3 }] }], subclasses: [{ id: "champion", name: "Champion", className: "Fighter", level: 3, features: [] }], items: [{ id: "longsword", name: "Longsword", type: "weapon", mastery: "Sap" }], spells: [], races: [], backgrounds: [], feats: [], monsters: [] } as never;

describe("unified character choices", () => {
  it("builds one debt model for class and combat surfaces", () => {
    const states = getUnifiedCharacterChoices(makeCharacter({ className: "Fighter", level: 3, subclass: "", fightingStyleIds: [] }), ruleset);
    expect(states.find((state) => state.id === "subclass")?.complete).toBe(false);
    expect(states.find((state) => state.id === "fighting-styles")?.required).toBe(1);
  });
  it("tracks expertise only on proficient skills", () => {
    const states = getIncompleteUnifiedChoices(makeCharacter({ className: "Rogue", level: 1, skillProficiencies: ["Stealth", "Acrobatics"], expertiseSkills: ["Arcana"] }), null);
    expect(states.find((state) => state.id === "expertise")?.validSelected).toEqual([]);
  });
  it("applies array and single choices without exceeding limits", () => {
    const character = makeCharacter({ className: "Fighter", level: 1, fightingStyleIds: [] });
    const state = getUnifiedCharacterChoices(character, ruleset).find((item) => item.id === "fighting-styles")!;
    const first = applyUnifiedChoice(character, state, state.options[0].id);
    const second = applyUnifiedChoice(first, state, state.options[1]?.id ?? "invalid");
    expect(first.fightingStyleIds).toHaveLength(1);
    expect(second.fightingStyleIds).toHaveLength(1);
  });
  it("replaces a Mystic Arcanum choice inside the same spell-level group", () => {
    const character = makeCharacter({ className: "Warlock", level: 11, arcanumSpellIds: ["old"] });
    const state: UnifiedChoiceState = { id: "arcanum", label: "Mystic Arcanum", step: "spells", kind: "grouped-single", field: "arcanumSpellIds", required: 1, selected: ["old"], validSelected: ["old"], complete: true, message: "", options: [{ id: "old", name: "Old", group: "6" }, { id: "new", name: "New", group: "6" }] };
    expect(applyUnifiedChoice(character, state, "new").arcanumSpellIds).toEqual(["new"]);
  });
});
