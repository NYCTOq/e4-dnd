import { describe,expect,it } from "vitest";
import { canRitualCast,getClassSpellSlots,getSpellcastingProfile } from "./spellcastingRules";
import type { DndClassData,DndSpellData } from "./ruleset.types";
const abilities={str:10,dex:10,con:10,int:16,wis:18,cha:16};
const cleric={name:"Cleric",spellProgression:"full",spellcastingAbility:"wis",levels:[{level:5,proficiencyBonus:3,features:[],spellSlots:[4,3,2]}]} as unknown as DndClassData;
describe("spellcasting rules engine",()=>{
 it("calculates prepared limits from class level and ability",()=>expect(getSpellcastingProfile(cleric,5,abilities,"dnd_2014").preparedSpellLimit).toBe(9));
 it("reads standard and pact slots from class progression",()=>expect(getClassSpellSlots(cleric,5)).toEqual([{level:1,max:4,used:0},{level:2,max:3,used:0},{level:3,max:2,used:0}]));
 it("allows ritual casting only for known ritual spells",()=>{const profile=getSpellcastingProfile(cleric,5,abilities,"dnd_2014"); const spell={id:"detect-magic",ritual:true} as DndSpellData; expect(canRitualCast(spell,profile,[spell.id])).toBe(true); expect(canRitualCast(spell,profile,[])).toBe(false);});
});
