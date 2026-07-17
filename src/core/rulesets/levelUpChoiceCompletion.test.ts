import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import type { DndFeatData, RulesetData } from "./ruleset.types";
import { applyFeatAbilityChoice, getFeatChoiceState, getLevelUpChoiceCompletion } from "./levelUpChoiceCompletion";

const character: Character = {
  id:"hero",name:"Hero",playerName:"Player",ruleset:"dnd_2024",race:"Human",className:"Fighter",subclass:"Champion",background:"Soldier",featIds:[],skillProficiencies:["Athletics"],expertiseSkills:[],toolProficiencies:[],languages:[],level:4,
  abilities:{str:16,dex:14,con:14,int:10,wis:10,cha:10},maxHp:36,currentHp:36,tempHp:0,armorClass:16,armorClassMode:"auto",knownSpellIds:[],preparedSpellIds:[],spellSlots:[],inventory:[],equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:0,deathSaves:{successes:0,failures:0},hitDice:[{die:10,max:4,used:0}],resources:[],exhaustion:0,conditionDurations:{},conditions:[],notes:"",createdAt:"2026-01-01",updatedAt:"2026-01-01",
};
const feat: DndFeatData = {id:"resilient-2024",name:"Resilient",ruleset:"dnd_2024",category:"general",summary:"Ability",benefits:["Ability"],abilityOptions:["con","wis"],choiceType:"ability",choiceCount:1};
const ruleset = { classes:[],subclasses:[],races:[],backgrounds:[],feats:[feat],spells:[],items:[],monsters:[] } as unknown as RulesetData;

describe("level-up choice completion",()=>{
  it("requires a structured feat sub-choice",()=>expect(getFeatChoiceState(feat,[])?.complete).toBe(false));
  it("accepts a valid feat ability choice",()=>expect(getFeatChoiceState(feat,["con"])?.complete).toBe(true));
  it("rejects an invalid feat ability choice",()=>expect(getFeatChoiceState(feat,["str"])?.selected).toEqual([]));
  it("applies a feat ability increase with the cap",()=>expect(applyFeatAbilityChoice({...character.abilities,con:20},feat,"con").con).toBe(20));
  it("blocks level-up when feat sub-choice is missing",()=>expect(getLevelUpChoiceCompletion(character,ruleset,feat,[]).status).toBe("blocked"));
  it("returns a non-blocked report after the feat choice",()=>expect(getLevelUpChoiceCompletion(character,ruleset,feat,["wis"]).blockers).toEqual([]));
});
