import { expect, it } from "vitest";
import type { Character } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getCharacterSpellcastingClasses, getSpellSource, getSpellcastingStatsForSpell } from "./multiclassSpellcastingSeparation";

const character = {
  id:"c",name:"Mix",playerName:"",ruleset:"dnd_2024",race:"Human",className:"Wizard",classLevels:[{className:"Wizard",level:3},{className:"Cleric",level:2}],subclass:"",background:"",featIds:[],skillProficiencies:[],expertiseSkills:[],toolProficiencies:[],languages:[],level:5,
  abilities:{str:8,dex:12,con:14,int:18,wis:16,cha:10},maxHp:30,currentHp:30,tempHp:0,armorClass:12,armorClassMode:"manual",knownSpellIds:["fire-bolt","sacred-flame"],preparedSpellIds:["fire-bolt","sacred-flame"],spellSlots:[],inventory:[],equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:0,deathSaves:{successes:0,failures:0},hitDice:[],resources:[],exhaustion:0,conditionDurations:{},conditions:[],notes:"",createdAt:"",updatedAt:""
} satisfies Character;
const rulesetData = { classes:[
  {id:"wizard",name:"Wizard",hitDie:6,primaryAbilities:["int"],savingThrows:["int","wis"],spellcastingAbility:"int",armorProficiencies:[],weaponProficiencies:[],skillChoices:{choose:0,from:[]},description:"",subclassLevel:3,spellProgression:"full",levels:[]},
  {id:"cleric",name:"Cleric",hitDie:8,primaryAbilities:["wis"],savingThrows:["wis","cha"],spellcastingAbility:"wis",armorProficiencies:[],weaponProficiencies:[],skillChoices:{choose:0,from:[]},description:"",subclassLevel:3,spellProgression:"full",levels:[]},
], spells:[],feats:[],races:[],backgrounds:[],items:[],subclasses:[] } as unknown as RulesetData;

it("keeps multiclass spellcasting abilities separate",()=>{
  expect(getCharacterSpellcastingClasses(character,rulesetData).map(x=>[x.className,x.spellcastingAbility])).toEqual([["Wizard","int"],["Cleric","wis"]]);
});
it("infers the source class from the spell list",()=>{
  expect(getSpellSource(character,{id:"fire-bolt",classes:["wizard"]},rulesetData)?.className).toBe("Wizard");
  expect(getSpellSource(character,{id:"sacred-flame",classes:["cleric"]},rulesetData)?.className).toBe("Cleric");
});
it("uses the source class ability for DC and attack",()=>{
  const wizard=getSpellcastingStatsForSpell(character,{id:"fire-bolt",name:"Fire Bolt",level:0,school:"",castingTime:"",range:"",components:[],duration:"",concentration:false,ritual:false,classes:["wizard"],description:""},rulesetData);
  const cleric=getSpellcastingStatsForSpell(character,{id:"sacred-flame",name:"Sacred Flame",level:0,school:"",castingTime:"",range:"",components:[],duration:"",concentration:false,ritual:false,classes:["cleric"],description:""},rulesetData);
  expect(wizard).toMatchObject({spellcastingAbility:"int",saveDc:15,attackBonus:7});
  expect(cleric).toMatchObject({spellcastingAbility:"wis",saveDc:14,attackBonus:6});
});
it("honors an explicit source for shared-list spells",()=>{
  const explicit={...character,spellSources:{shared:"Cleric"}};
  expect(getSpellSource(explicit,{id:"shared",classes:["wizard","cleric"]},rulesetData)).toMatchObject({className:"Cleric",explicit:true});
});
