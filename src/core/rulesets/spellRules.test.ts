import { describe, expect, it } from "vitest";
import { getHighestSpellLevel, getSpellMechanicSummary, isSpellAvailableToClass } from "./spellRules";
import type { DndClassData, DndSpellData } from "./ruleset.types";
const cls: DndClassData = { id:"wizard", name:"Wizard", hitDie:6, primaryAbilities:["int"], savingThrows:["int","wis"], spellcastingAbility:"int", armorProficiencies:[], weaponProficiencies:[], skillChoices:{choose:2,from:[]}, description:"", subclassLevel:3, spellProgression:"full", levels:[{level:5,proficiencyBonus:3,features:[],spellSlots:[4,3,2]}] };
const spell: DndSpellData = { id:"fireball",name:"Fireball",level:3,school:"Evocation",castingTime:"1 action",range:"150 feet",components:["V","S","M"],duration:"Instantaneous",concentration:false,ritual:false,classes:["Sorcerer","Wizard"],description:"",effectType:"damage",attackType:"saving-throw",damageDice:"8d6",damageType:"fire",saveAbility:"dex" };
describe("spell rules",()=>{
 it("calculates highest available spell level",()=>expect(getHighestSpellLevel(cls,5)).toBe(3));
 it("matches class spell lists case-insensitively",()=>expect(isSpellAvailableToClass(spell,"wizard")).toBe(true));
 it("builds a mechanics summary",()=>expect(getSpellMechanicSummary(spell)).toContain("DEX save"));
});
