import {describe,expect,it} from "vitest";
import {makeCharacter} from "../../test/fixtures";
import type {RulesetData} from "../rulesets/ruleset.types";
import {calculateJourneyArmorClass,compareJourneySnapshots,getCharacterJourneySnapshot,getCharacterSpellcastingAbility} from "./playerJourneyConsistency";

const data={classes:[{name:"Wizard",spellcastingAbility:"int",savingThrows:["int","wis"]}],races:[{name:"Human",speed:30}],backgrounds:[],feats:[{id:"alert",name:"Alert"}],items:[{id:"leather",category:"armor",armorClass:11,armorType:"light"},{id:"shield",category:"shield",armorClassBonus:2}]} as unknown as RulesetData;

describe("player journey consistency",()=>{
 it("uses ruleset spellcasting ability instead of screen guesses",()=>expect(getCharacterSpellcastingAbility(makeCharacter({className:"Wizard"}),data)).toBe("int"));
 it("keeps automatic armor calculation centralized",()=>{const c=makeCharacter({armorClassMode:"auto",equippedArmorId:"leather",equippedShieldId:"shield",abilities:{str:10,dex:16,con:10,int:10,wis:10,cha:10}});expect(calculateJourneyArmorClass(c,data.items)).toBe(16)});
 it("produces one reusable sheet and play-mode snapshot",()=>{const c=makeCharacter({className:"Wizard",level:5,race:"Human",abilities:{str:10,dex:14,con:12,int:18,wis:12,cha:10},skillProficiencies:["Arcana"],resources:[{id:"arcane-recovery",name:"Arcane Recovery",max:1,used:0,recovery:"long"}]});const a=getCharacterJourneySnapshot(c,data);const b=getCharacterJourneySnapshot(c,data);expect(a).toMatchObject({proficiencyBonus:3,initiative:2,speed:30,spellSaveDc:15,spellAttackBonus:7,attacksPerAction:1});expect(a.skills.Arcana).toBe(7);expect(compareJourneySnapshots(a,b)).toEqual({consistent:true,differences:[]})});
 it("reports diverging snapshots",()=>{const c=makeCharacter();const a=getCharacterJourneySnapshot(c,null);expect(compareJourneySnapshots(a,{...a,armorClass:a.armorClass+1})).toMatchObject({consistent:false,differences:["snapshot-2"]})});
});
