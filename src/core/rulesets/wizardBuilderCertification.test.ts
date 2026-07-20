import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { certifyWizardBuilder, summarizeWizardCertification } from "./wizardBuilderCertification";
import { canRecoverWizardSlot, getArcaneRecoveryBudget, getWizardCantripCount, getWizardCombatFeatures, getWizardMaxSpellLevel, getWizardPreparedSpellLimit, getWizardSpellbookMinimum } from "./wizardRules";
const load=<T,>(path:string):T=>JSON.parse(readFileSync(new URL(`../../../${path}`,import.meta.url),"utf8")) as T;
const merged=(edition:"2014"|"2024")=>{const base=load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);const expansion=edition==="2014"?SUBCLASS_EXPANSION_2014:SUBCLASS_EXPANSION_2024;return[...base,...expansion.filter((x)=>!base.some((b)=>b.id===x.id))];};
const rows=(edition:"2014"|"2024")=>{const classes=load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);const races=load<DndRaceData[]>(`public/data/dnd_${edition}/races.json`);return certifyWizardBuilder(`dnd_${edition}`,classes.find((x)=>x.id==="wizard")!,races,merged(edition));};
describe("Wizard full builder certification",()=>{
  it("certifies every 2014 race × official subclass × level combination",()=>{const result=rows("2014");expect(result).toHaveLength(9*13*20);expect(summarizeWizardCertification(result)).toMatchObject({ready:true,scenarioCount:2340,blockerCount:0});});
  it("certifies every 2024 species × PHB subclass × level combination",()=>{const result=rows("2024");expect(result).toHaveLength(10*4*20);expect(summarizeWizardCertification(result)).toMatchObject({ready:true,scenarioCount:800,blockerCount:0});});
  it("keeps prepared spell models edition-specific",()=>{expect([1,5,10,20].map((l)=>getWizardPreparedSpellLimit(l,"dnd_2014",3))).toEqual([4,8,13,23]);expect([1,2,3,5,10,16,20].map((l)=>getWizardPreparedSpellLimit(l,"dnd_2024"))).toEqual([4,5,6,9,15,21,25]);});
  it("tracks cantrips, spellbook growth and maximum spell level",()=>{expect([1,4,10,20].map(getWizardCantripCount)).toEqual([3,4,5,5]);expect([1,2,10,20].map(getWizardSpellbookMinimum)).toEqual([6,8,24,44]);expect([1,3,5,17].map(getWizardMaxSpellLevel)).toEqual([1,2,3,9]);});
  it("enforces Arcane Recovery limits",()=>{expect([1,4,9,20].map(getArcaneRecoveryBudget)).toEqual([1,2,5,10]);expect(canRecoverWizardSlot(5,1,5)).toBe(true);expect(canRecoverWizardSlot(6,1,10)).toBe(false);});
  it("keeps edition class features separate",()=>{expect(getWizardCombatFeatures(20,"dnd_2014")).toMatchObject({ritualAdept:false,scholar:false,memorizeSpell:false,spellMastery:true,signatureSpells:true});expect(getWizardCombatFeatures(20,"dnd_2024")).toMatchObject({ritualAdept:true,scholar:true,memorizeSpell:true,epicBoon:true,spellMastery:true,signatureSpells:true});});
});
