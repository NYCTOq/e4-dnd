import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import { createHomebrewPackage, type HomebrewEntity } from "./homebrewFoundation";
import { executeHomebrewRuntimeAction, getHomebrewCharacterRuntime, recoverHomebrewCharacterResources, synchronizeHomebrewResources } from "./homebrewRuntimeIntegration";

const character = { id:"c",name:"Hero",playerName:"P",ruleset:"homebrew",race:"Human",className:"Sandcaller",subclass:"Dune Voice",background:"Sage",featIds:[],skillProficiencies:[],expertiseSkills:[],toolProficiencies:[],languages:[],level:6,abilities:{str:10,dex:12,con:14,int:10,wis:18,cha:8},maxHp:40,currentHp:40,tempHp:0,armorClass:14,armorClassMode:"manual",knownSpellIds:[],preparedSpellIds:[],spellSlots:[],inventory:[],equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:0,deathSaves:{successes:0,failures:0},hitDice:[],resources:[],exhaustion:0,conditionDurations:{},conditions:[],notes:"",createdAt:"x",updatedAt:"x" } as Character;
const now="2026-07-17T00:00:00.000Z";
const entity: HomebrewEntity<"class"> = {schemaVersion:1 as const,type:"class" as const,id:"sandcaller",name:"Sandcaller",tags:[],createdAt:now,updatedAt:now,payload:{id:"sandcaller",name:"Sandcaller",hitDie:8,primaryAbilities:["wis"],savingThrows:["wis","cha"],spellcastingAbility:"wis",armorProficiencies:[],weaponProficiencies:[],skillChoices:{choose:2,from:[]},description:"Sand",subclassLevel:3,spellProgression:"full",levels:Array.from({length:20},(_,i)=>({level:i+1,proficiencyBonus:2+Math.floor(i/4),features:i===4?["Sand Step"]:[]}))},resources:[{id:"sand-points",name:"Sand Points",maximum:2,recovery:"short-rest" as const,recoveryAmount:1,levelScaling:[{level:5,maximum:3}]}],actions:[{id:"sand-burst",name:"Sand Burst",economy:"action" as const,resourceId:"sand-points",resourceCost:2,summary:"Burst"}]};
const pkg=createHomebrewPackage({id:"sand",name:"Sand",version:"1",entities:[entity]});

describe("homebrew runtime integration",()=>{
 it("matches class and exposes level progression",()=>{const runtime=getHomebrewCharacterRuntime(character,[pkg]);expect(runtime.entities).toHaveLength(1);expect(runtime.progressionFeatures[0]?.name).toBe("Sand Step");});
 it("scales and synchronizes resources",()=>{const resources=synchronizeHomebrewResources(character,[pkg]);expect(resources[0]).toMatchObject({id:"homebrew:sandcaller:sand-points",max:3,used:0,recovery:"short"});});
 it("spends a custom action resource",()=>{const next=executeHomebrewRuntimeAction(character,[pkg],"sandcaller:sand-burst");expect(next.resources[0].used).toBe(2);});
 it("blocks an action without enough resource",()=>{const spent={...character,resources:[{id:"homebrew:sandcaller:sand-points",name:"Sand Points",max:3,used:2,recovery:"short" as const}]};expect(()=>executeHomebrewRuntimeAction(spent,[pkg],"sandcaller:sand-burst")).toThrow("yetersiz");});
 it("honors partial short-rest recovery",()=>{const spent={...character,resources:[{id:"homebrew:sandcaller:sand-points",name:"Sand Points",max:3,used:3,recovery:"short" as const}]};expect(recoverHomebrewCharacterResources(spent,[pkg],"short-rest")[0].used).toBe(2);});
 it("does not recover on the wrong trigger",()=>{const spent={...character,resources:[{id:"homebrew:sandcaller:sand-points",name:"Sand Points",max:3,used:3,recovery:"short" as const}]};expect(recoverHomebrewCharacterResources(spent,[pkg],"long-rest")[0].used).toBe(3);});
});
