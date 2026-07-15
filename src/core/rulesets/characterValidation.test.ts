import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import { hasValidationErrors, validateCharacterDraft } from "./characterValidation";
import type { RulesetData } from "./ruleset.types";

const data = { id: "dnd_2014", name: "2014", classes: [{ name: "Fighter", subclassLevel: 3, spellcastingAbility: null, skillChoices: { choose: 2, from: ["Athletics", "Perception"] }, levels: [], spellProgression: "none" }], races: [{ name: "Human" }], backgrounds: [{ name: "Soldier", skillProficiencies: ["Athletics"] }], subclasses: [], feats: [], spells: [], items: [], monsters: [] } as unknown as RulesetData;

describe("character validation", () => {
  it("reports missing core selections", () => expect(hasValidationErrors(validateCharacterDraft(emptyDraft, data, emptyDraft.abilities))).toBe(true));
  it("requires the exact class skill quota", () => {
    const draft = { ...emptyDraft, name: "Tengiz", className: "Fighter", race: "Human", background: "Soldier", skillProficiencies: ["Perception"] };
    expect(validateCharacterDraft(draft, data, draft.abilities).some((issue) => issue.id === "skills")).toBe(true);
  });
  it("keeps empty inventory as warning instead of blocking error", () => {
    const issues = validateCharacterDraft({ ...emptyDraft, name: "Tengiz" }, data, emptyDraft.abilities);
    expect(issues.find((issue) => issue.id === "no-equipment")?.severity).toBe("warning");
  });
  it("rejects player ability scores above the normal cap", () => {
    const abilities = { ...emptyDraft.abilities, wis: 21 };
    expect(validateCharacterDraft({ ...emptyDraft, abilities }, data, abilities).some((issue) => issue.id === "ability-wis")).toBe(true);
  });
});
