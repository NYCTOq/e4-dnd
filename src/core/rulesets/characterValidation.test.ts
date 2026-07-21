import { readFileSync } from "node:fs";
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

  it.each([
    ["Rogue", "Arcane Trickster", 13],
    ["Fighter", "Eldritch Knight", 7],
  ] as const)("accepts 2014 %s subclass Wizard spells at valid levels", (className, subclass, level) => {
    const classes = JSON.parse(readFileSync("public/data/dnd_2014/classes.json", "utf8")) as RulesetData["classes"];
    const races = JSON.parse(readFileSync("public/data/dnd_2014/races.json", "utf8")) as RulesetData["races"];
    const backgrounds = JSON.parse(readFileSync("public/data/dnd_2014/backgrounds.json", "utf8")) as RulesetData["backgrounds"];
    const spells = JSON.parse(readFileSync("public/data/dnd_2014/spells.json", "utf8")) as RulesetData["spells"];
    const classData = classes.find((item) => item.name === className)!;
    const spell = spells.find((item) => item.id === "burning-hands")!;
    const ruleset = { ...data, id: "dnd_2014", classes, races, backgrounds, spells } as RulesetData;
    const draft = {
      ...emptyDraft,
      ruleset: "dnd_2014" as const,
      name: "Validation Probe",
      className,
      subclass,
      level,
      race: races.find((item) => !item.subraces?.length)?.name ?? races[0].name,
      background: backgrounds[0].name,
      knownSpellIds: [spell.id],
      skillProficiencies: classData.skillChoices.from.slice(0, classData.skillChoices.choose),
    };
    const spellIssues = validateCharacterDraft(draft, ruleset, draft.abilities).filter((issue) => issue.id === `spell-${spell.id}`);
    expect(spellIssues).toEqual([]);
  });

});
