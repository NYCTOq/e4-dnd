import { describe, expect, it } from "vitest";
import type { DndClassData } from "./ruleset.types";
import { formatSpellSlots, getClassLevel, getFeaturesThroughLevel } from "./classProgression";

const sample: DndClassData = {
  id: "fighter", name: "Fighter", hitDie: 10, primaryAbilities: ["str"], savingThrows: ["str", "con"],
  spellcastingAbility: null, armorProficiencies: [], weaponProficiencies: [], skillChoices: { choose: 2, from: [] },
  description: "", subclassLevel: 3, spellProgression: "none",
  levels: Array.from({ length: 20 }, (_, index) => ({ level: index + 1, proficiencyBonus: 2 + Math.floor(index / 4), features: index === 0 ? ["Second Wind"] : index === 1 ? ["Action Surge"] : [] })),
};

describe("class progression", () => {
  it("clamps requested levels", () => expect(getClassLevel(sample, 99).level).toBe(20));
  it("collects unlocked features", () => expect(getFeaturesThroughLevel(sample, 2)).toEqual(["Second Wind", "Action Surge"]));
  it("formats spell slot rows", () => expect(formatSpellSlots([4, 3, 2])).toBe("1:4 · 2:3 · 3:2"));
});
