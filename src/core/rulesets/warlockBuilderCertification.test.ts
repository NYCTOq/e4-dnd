import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { certifyWarlockBuilder, summarizeWarlockCertification } from "./warlockBuilderCertification";
import { getInvocationChoiceCount } from "./invocationRules";
import { getMysticArcanumLevels, getPactMagicSlots } from "./pactMagicRules";
import { getMagicalCunningRecovery, getMysticArcanumSpellLevels, getWarlockCombatFeatures, getWarlockKnownSpellLimit, getWarlockPreparedSpellLimit } from "./warlockRules";

const load=<T,>(path:string):T=>JSON.parse(readFileSync(new URL(`../../../${path}`,import.meta.url),"utf8")) as T;
const merged=(edition:"2014"|"2024")=>{const base=load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);const expansion=edition==="2014"?SUBCLASS_EXPANSION_2014:SUBCLASS_EXPANSION_2024;return [...base,...expansion.filter((x)=>!base.some((b)=>b.id===x.id))];};
const rows=(edition:"2014"|"2024")=>{const classes=load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);const races=load<DndRaceData[]>(`public/data/dnd_${edition}/races.json`);return certifyWarlockBuilder(`dnd_${edition}`,classes.find((x)=>x.id==="warlock")!,races,merged(edition));};

describe("Warlock full builder certification",()=>{
  it("certifies every 2014 race × official patron × level combination",()=>{const result=rows("2014");expect(result).toHaveLength(9*9*20);expect(summarizeWarlockCertification(result)).toMatchObject({ready:true,scenarioCount:1620,blockerCount:0});});
  it("certifies every 2024 species × PHB patron × level combination",()=>{const result=rows("2024");expect(result).toHaveLength(10*4*20);expect(summarizeWarlockCertification(result)).toMatchObject({ready:true,scenarioCount:800,blockerCount:0});});
  it("keeps legacy known spells and modern prepared spells separate",()=>{expect([1,2,3,10,17,20].map((l)=>getWarlockKnownSpellLimit(l,"dnd_2014"))).toEqual([2,3,4,10,14,15]);expect([1,2,3,10,17,20].map((l)=>getWarlockPreparedSpellLimit(l,"dnd_2024"))).toEqual([2,3,4,10,14,15]);expect(getWarlockPreparedSpellLimit(20,"dnd_2014")).toBe(0);expect(getWarlockKnownSpellLimit(20,"dnd_2024")).toBe(0);});
  it("matches Pact Magic slots at all breakpoints",()=>{expect([1,2,3,5,9,11,17,20].map((l)=>getPactMagicSlots("Warlock",l)[0])).toEqual([{level:1,max:1,used:0},{level:1,max:2,used:0},{level:2,max:2,used:0},{level:3,max:2,used:0},{level:5,max:2,used:0},{level:5,max:3,used:0},{level:5,max:4,used:0},{level:5,max:4,used:0}]);});
  it("tracks edition-specific invocation progression",()=>{expect([1,2,5,7,9,12,15,18].map((l)=>getInvocationChoiceCount("Warlock",l,"dnd_2014"))).toEqual([0,2,3,4,5,6,7,8]);expect([1,2,5,7,9,12,15,18].map((l)=>getInvocationChoiceCount("Warlock",l,"dnd_2024"))).toEqual([1,3,5,6,7,8,9,10]);});
  it("unlocks Mystic Arcanum independently from Pact slots",()=>{expect([10,11,13,15,17].map(getMysticArcanumSpellLevels)).toEqual([[],[6],[6,7],[6,7,8],[6,7,8,9]]);expect(getMysticArcanumLevels("Warlock",17,"dnd_2024")).toEqual([6,7,8,9]);});
  it("applies Magical Cunning and Eldritch Master recovery",()=>{expect([1,2,11,17,20].map((l)=>getMagicalCunningRecovery(l,"dnd_2024"))).toEqual([0,1,2,2,4]);expect(getMagicalCunningRecovery(20,"dnd_2014")).toBe(0);expect(getWarlockCombatFeatures(20,"dnd_2024")).toMatchObject({magicalCunning:true,contactPatron:true,epicBoon:true,eldritchMaster:true,magicalCunningRecovery:4});});
});
