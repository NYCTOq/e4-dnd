import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData,DndRaceData,DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014,SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { certifyBardBuilder,summarizeBardCertification } from "./bardBuilderCertification";
import { getBardCantripCount,getBardCombatFeatures,getBardExpertiseCount,getBardicInspirationDie,getBardSpellLimit,getMagicalSecretsCount,getSongOfRestDie } from "./bardRules";
import { getSpellcastingProfile } from "./spellcastingRules";
const load=<T,>(path:string):T=>JSON.parse(readFileSync(new URL(`../../../${path}`,import.meta.url),"utf8")) as T;
const merged=(edition:"2014"|"2024")=>{const base=load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);const exp=edition==="2014"?SUBCLASS_EXPANSION_2014:SUBCLASS_EXPANSION_2024;return[...base,...exp.filter(c=>!base.some(e=>e.id===c.id))]};
function rows(edition:"2014"|"2024"){const classes=load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);const races=load<DndRaceData[]>(`public/data/dnd_${edition}/races.json`);return certifyBardBuilder(`dnd_${edition}`,classes.find(x=>x.id==="bard")!,races,merged(edition));}
const abilities={str:10,dex:14,con:12,int:10,wis:10,cha:18};
describe("Bard full builder certification",()=>{
 it("certifies every 2014 race × subclass × level combination",()=>{const result=rows("2014");expect(result).toHaveLength(9*2*20);expect(summarizeBardCertification(result)).toMatchObject({ready:true,scenarioCount:360,blockerCount:0})});
 it("certifies every 2024 species × subclass × level combination",()=>{const result=rows("2024");expect(result).toHaveLength(10*2*20);expect(summarizeBardCertification(result)).toMatchObject({ready:true,scenarioCount:400,blockerCount:0})});
 it("matches inspiration, Song of Rest and expertise breakpoints",()=>{expect(getBardicInspirationDie(1)).toBe(6);expect(getBardicInspirationDie(5)).toBe(8);expect(getBardicInspirationDie(10)).toBe(10);expect(getBardicInspirationDie(15)).toBe(12);expect(getSongOfRestDie(17,"dnd_2014")).toBe(12);expect(getSongOfRestDie(20,"dnd_2024")).toBeNull();expect(getBardExpertiseCount(2,"dnd_2024")).toBe(2);expect(getBardExpertiseCount(9,"dnd_2024")).toBe(4);expect(getBardExpertiseCount(3,"dnd_2014")).toBe(2)});
 it("matches official known/prepared spell tables",()=>{expect(getBardCantripCount(4)).toBe(3);expect(getBardSpellLimit(1,"dnd_2014")).toBe(4);expect(getBardSpellLimit(10,"dnd_2014")).toBe(14);expect(getBardSpellLimit(1,"dnd_2024")).toBe(4);expect(getBardSpellLimit(20,"dnd_2024")).toBe(22);const bard=load<DndClassData[]>("public/data/dnd_2024/classes.json").find(x=>x.id==="bard")!;expect(getSpellcastingProfile(bard,10,abilities,"dnd_2024")).toMatchObject({cantripLimit:4,knownSpellLimit:null,preparedSpellLimit:15})});
 it("distinguishes edition-specific high-level Bard features",()=>{expect(getMagicalSecretsCount(10,"dnd_2014")).toBe(2);expect(getMagicalSecretsCount(18,"dnd_2014")).toBe(6);expect(getBardCombatFeatures(6,"dnd_2014")).toMatchObject({countercharm:true,countercharmAction:"action"});expect(getBardCombatFeatures(7,"dnd_2024")).toMatchObject({countercharm:true,countercharmAction:"reaction"});expect(getBardCombatFeatures(18,"dnd_2024")).toMatchObject({superiorInspiration:true});expect(getBardCombatFeatures(20,"dnd_2024")).toMatchObject({wordsOfCreation:true})});
 it("contains complete Lore and Valor feature checkpoints",()=>{for(const edition of ["2014","2024"] as const){const subs=merged(edition).filter(x=>x.className==="Bard");expect(subs).toHaveLength(2);for(const sub of subs)expect([...new Set(sub.features.map(x=>x.level))]).toEqual([3,6,14])}});
});
