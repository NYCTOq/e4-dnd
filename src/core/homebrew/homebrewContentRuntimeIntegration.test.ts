import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import type { DndFeatData, DndItemData, DndSpellData } from "../rulesets/ruleset.types";
import { createHomebrewPackage, type HomebrewEntity } from "./homebrewFoundation";
import { applyHomebrewFeatAbilityBonus, applyHomebrewSpellSelfEffect, getHomebrewContentRuntime, spendHomebrewItemCharge } from "./homebrewContentRuntimeIntegration";

const now = "2026-07-17T00:00:00.000Z";
const feat: DndFeatData = {id:"sand-touched",name:"Sand Touched",ruleset:"dnd_2024",category:"general",summary:"Wisdom grows.",benefits:["Wisdom +1"],choiceType:"ability",choiceCount:1,abilityOptions:["wis"]};
const spell: DndSpellData = {id:"desert-mend",name:"Desert Mend",level:1,school:"Evocation",castingTime:"1 action",range:"Self",components:["V"],duration:"Instantaneous",concentration:false,ritual:false,classes:["Sandcaller"],description:"Heal.",effectType:"healing",attackType:"automatic",healingDice:"1d8"};
const item: DndItemData = {id:"sun-staff",name:"Sun Staff",category:"gear",cost:"0",weight:2,description:"Stores sunlight.",magical:true,requiresAttunement:true,charges:3,chargeCost:1,grantedSpellName:"Desert Mend",effectSummary:"Radiant focus"};
const entities: HomebrewEntity[] = [
  {schemaVersion:1,type:"feat",id:feat.id,name:feat.name,tags:[],createdAt:now,updatedAt:now,payload:feat},
  {schemaVersion:1,type:"spell",id:spell.id,name:spell.name,tags:[],createdAt:now,updatedAt:now,payload:spell},
  {schemaVersion:1,type:"item",id:item.id,name:item.name,tags:[],createdAt:now,updatedAt:now,payload:item},
];
const pkg = createHomebrewPackage({id:"desert-kit",name:"Desert Kit",version:"1",entities});
const character = {id:"c",name:"Hero",playerName:"P",ruleset:"homebrew",race:"Human",className:"Sandcaller",subclass:"",background:"Sage",featIds:[feat.id],featChoices:{[feat.id]:["wis"]},skillProficiencies:[],expertiseSkills:[],toolProficiencies:[],languages:[],level:5,abilities:{str:10,dex:12,con:14,int:10,wis:18,cha:8},maxHp:40,currentHp:20,tempHp:0,armorClass:14,armorClassMode:"manual",knownSpellIds:[spell.id],preparedSpellIds:[spell.id],spellSlots:[{level:1,max:2,used:0}],inventory:[{itemId:item.id,quantity:1,attuned:true,chargesUsed:1}],equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:0,deathSaves:{successes:0,failures:0},hitDice:[],resources:[],exhaustion:0,conditionDurations:{},conditions:[],notes:"",createdAt:"x",updatedAt:"x"} as Character;

describe("homebrew content runtime integration", () => {
  it("certifies selected feat, spell and item runtime", () => { const runtime=getHomebrewContentRuntime(character,[pkg]); expect(runtime.ready).toBe(true); expect(runtime.feats).toHaveLength(1); expect(runtime.spells[0].formula).toBe("1d8"); expect(runtime.items[0]).toMatchObject({chargesRemaining:2,usable:true}); });
  it("blocks incomplete feat choices", () => { const runtime=getHomebrewContentRuntime({...character,featChoices:{}},[pkg]); expect(runtime.ready).toBe(false); expect(runtime.blockers[0]).toContain("zorunlu feat seçimi"); });
  it("applies feat ability increases with the normal cap", () => { expect(applyHomebrewFeatAbilityBonus({...character,abilities:{...character.abilities,wis:20}},feat.id,"wis").abilities.wis).toBe(20); });
  it("applies self healing spell effects", () => { expect(applyHomebrewSpellSelfEffect(character,spell,9).currentHp).toBe(29); });
  it("spends homebrew item charges", () => { expect(spendHomebrewItemCharge(character,item.id).inventory[0].chargesUsed).toBe(2); });
  it("warns when an attuned item is not attuned", () => { const runtime=getHomebrewContentRuntime({...character,inventory:[{itemId:item.id,quantity:1}]},[pkg]); expect(runtime.warnings.join(" ")).toContain("attunement"); expect(runtime.items[0].usable).toBe(false); });
});
