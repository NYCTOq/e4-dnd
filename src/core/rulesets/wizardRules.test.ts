import { describe, expect, it } from "vitest";
import { canRecoverWizardSlot, getArcaneRecoveryBudget, getWizardCantripCount, getWizardCombatFeatures, getWizardMaxSpellLevel, getWizardPreparedSpellLimit, getWizardSpellbookMinimum, getWizardSubclassFeatureLevels, getWizardSubclassLevel } from "./wizardRules";

describe("wizard rules", () => {
  it("tracks cantrips and minimum spellbook size", () => {
    expect([1,4,10,20].map(getWizardCantripCount)).toEqual([3,4,5,5]);
    expect([1,2,10,20].map(getWizardSpellbookMinimum)).toEqual([6,8,24,44]);
  });
  it("keeps 2014 ability-based preparation separate from the 2024 table", () => {
    expect([1,5,10,20].map((level) => getWizardPreparedSpellLimit(level,"dnd_2014",3))).toEqual([4,8,13,23]);
    expect([1,2,3,5,10,16,20].map((level) => getWizardPreparedSpellLimit(level,"dnd_2024"))).toEqual([4,5,6,9,15,21,25]);
  });
  it("sets Arcane Recovery to half Wizard level rounded up and blocks level 6+ slots", () => {
    expect([1,4,9,20].map(getArcaneRecoveryBudget)).toEqual([1,2,5,10]);
    expect(canRecoverWizardSlot(3,1,3)).toBe(true);
    expect(canRecoverWizardSlot(6,1,10)).toBe(false);
    expect(canRecoverWizardSlot(2,0,5)).toBe(false);
  });
  it("tracks edition subclass levels and capstones", () => {
    expect(getWizardSubclassLevel("dnd_2014")).toBe(2);
    expect(getWizardSubclassLevel("dnd_2024")).toBe(3);
    expect(getWizardSubclassFeatureLevels("dnd_2014")).toEqual([2,6,10,14]);
    expect(getWizardSubclassFeatureLevels("dnd_2024")).toEqual([3,6,10,14]);
    expect(getWizardCombatFeatures(20,"dnd_2024")).toMatchObject({ritualAdept:true,scholar:true,memorizeSpell:true,spellMastery:true,epicBoon:true,signatureSpells:true});
    expect(getWizardCombatFeatures(20,"dnd_2014")).toMatchObject({ritualAdept:false,scholar:false,memorizeSpell:false,epicBoon:false,spellMastery:true,signatureSpells:true});
  });
  it("unlocks spell levels on full-caster progression", () => {
    expect([1,2,3,5,17,20].map(getWizardMaxSpellLevel)).toEqual([1,1,2,3,9,9]);
  });
});
