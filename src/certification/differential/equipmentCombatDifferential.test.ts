import { describe, expect, it } from "vitest";
import type { Character, CharacterDraft } from "../../core/character/character.types";
import type { DndItemData, DndSpellData, RulesetData } from "../../core/rulesets/ruleset.types";
import {
  calculateEffectiveArmorClass,
  calculateSuggestedArmorClass,
  getInventoryWeight,
  getWeaponAbilityModifier,
  getWeaponAttackBonus,
  getWeaponDamageSummary,
  setInventoryItemQuantity,
} from "../../features/characters/characterShared";
import { canEquipItem, getWeaponMastery } from "../../core/rulesets/equipmentRules";
import { getLevelOneCombatReadiness } from "../../core/rulesets/levelOneCombatReadiness";
import { REFERENCE_ITEMS, REFERENCE_SPELLS, type ReferenceCombatant, type ReferenceItem } from "../reference/equipmentCombat.reference";
import {
  automaticArmorClass,
  combatReadiness,
  inventoryWeight,
  setInventoryQuantity,
  weaponAbilityModifier,
  weaponAttackBonus,
  weaponDamageSummary,
  weaponMastery,
} from "../oracle/equipmentCombatOracle";

function refItem(id:string){const x=REFERENCE_ITEMS.find(i=>i.id===id);if(!x)throw new Error(`Missing ${id}`);return x;}
function actualItemFrom(item:ReferenceItem):DndItemData{
 const properties=[...(item.properties??[])];
 if(item.versatileDamage){const kept=properties.filter(p=>p.toLowerCase()!=="versatile");properties.splice(0,properties.length,...kept,`versatile (${item.versatileDamage})`)}
 return {id:item.id,name:item.name,category:item.category,weight:item.weight,damage:item.damage,damageType:item.damageType,properties,range:item.range,attackBonus:item.attackBonus,damageBonus:item.damageBonus,armorClass:item.armorClass,armorClassBonus:item.armorClassBonus,armorType:item.armorType,dexBonusMax:item.dexBonusMax,mastery:item.mastery,cost:"0 gp",description:"",tags:[]} as DndItemData;
}
const ACTUAL_ITEMS=REFERENCE_ITEMS.map(actualItemFrom);
function actualItem(id:string){const x=ACTUAL_ITEMS.find(i=>i.id===id);if(!x)throw new Error(`Missing actual ${id}`);return x;}
function base(o:Partial<ReferenceCombatant>={}):ReferenceCombatant{return {level:1,abilities:{str:16,dex:14,con:14,int:10,wis:10,cha:10},fightingStyleIds:[],equippedWeaponIds:[],armorClass:10,armorClassMode:"auto",equippedArmorId:null,equippedShieldId:null,inventory:[],maxHp:10,className:"Fighter",gold:0,knownSpellIds:[],preparedSpellIds:[],...o};}
function character(r:ReferenceCombatant):Character{return {id:"cert",name:"Certification",playerName:"",ruleset:"dnd_2014",race:"Human",subrace:"",className:r.className,subclass:"",background:"",level:r.level,abilities:r.abilities,featIds:[],fightingStyleIds:r.fightingStyleIds,masteredWeaponIds:[],skillProficiencies:[],expertiseSkills:[],toolProficiencies:[],languages:[],maxHp:r.maxHp,currentHp:r.maxHp,tempHp:0,armorClass:r.armorClass,armorClassMode:r.armorClassMode,knownSpellIds:r.knownSpellIds,preparedSpellIds:r.preparedSpellIds,spellSources:{},classKnownSpellIds:{},classPreparedSpellIds:{},spellSlots:[],inventory:r.inventory,equippedArmorId:r.equippedArmorId,equippedShieldId:r.equippedShieldId,equippedWeaponIds:r.equippedWeaponIds,gold:r.gold,deathSaves:{successes:0,failures:0},hitDice:[{die:10,max:r.level,used:0}],exhaustion:0,conditionDurations:{},notes:"",resources:[],conditions:[],activeSpellEffects:[],createdAt:"2026-01-01T00:00:00.000Z",updatedAt:"2026-01-01T00:00:00.000Z"} as Character;}

const levels=[1,4,5,8,9,13,17,20];
const scores=[{str:8,dex:8},{str:10,dex:14},{str:14,dex:10},{str:16,dex:18},{str:20,dex:12}];

describe("v5.110B differential equipment/combat",()=>{
 it.each([0,1,2,5,10])("inventory quantity %i",q=>{const src=[{itemId:"rope",quantity:2}];expect(setInventoryItemQuantity(src,"rope",q)).toEqual(setInventoryQuantity(src,"rope",q));});
 
    const weightCases = [
      { name: "empty", inventory: [] },
      {
        name: "rope",
        inventory: [{ itemId: "rope", quantity: 1 }],
      },
      {
        name: "rope and longsword",
        inventory: [
          { itemId: "rope", quantity: 2 },
          { itemId: "longsword", quantity: 1 },
        ],
      },
      {
        name: "armor and shield",
        inventory: [
          { itemId: "chain-mail", quantity: 1 },
          { itemId: "shield", quantity: 1 },
        ],
      },
    ];

    for (const weightCase of weightCases) {
      it(`weight ${weightCase.name}`, () => {
        expect(
          getInventoryWeight(weightCase.inventory, ACTUAL_ITEMS),
        ).toBe(
          inventoryWeight(weightCase.inventory, REFERENCE_ITEMS),
        );
      });
    }

 for(const level of levels)for(const s of scores)for(const wid of ["longsword","rapier","longbow","dagger"]){
  it(`${wid} L${level} STR${s.str} DEX${s.dex}`,()=>{const r=base({level,abilities:{str:s.str,dex:s.dex,con:14,int:10,wis:10,cha:10}});const c=character(r);expect(getWeaponAbilityModifier(c,actualItem(wid))).toBe(weaponAbilityModifier(r,refItem(wid)));expect(getWeaponAttackBonus(c,actualItem(wid))).toBe(weaponAttackBonus(r,refItem(wid)));});
 }
 it("archery",()=>{const r=base({level:5,fightingStyleIds:["archery"]});expect(getWeaponAttackBonus(character(r),actualItem("longbow"))).toBe(weaponAttackBonus(r,refItem("longbow")));});
 it("non proficient",()=>{const r=base({level:9});expect(getWeaponAttackBonus(character(r),actualItem("longsword"),false)).toBe(weaponAttackBonus(r,refItem("longsword"),false));});
 it.each([
  ["plain",base({equippedWeaponIds:["longsword"]}),"longsword",false],
  ["dueling",base({fightingStyleIds:["dueling"],equippedWeaponIds:["longsword"]}),"longsword",false],
  ["versatile",base({fightingStyleIds:["dueling"],equippedWeaponIds:["longsword"]}),"longsword",true],
  ["thrown",base({fightingStyleIds:["thrown-weapon-fighting"],equippedWeaponIds:["dagger"]}),"dagger",false],
  ["greatsword",base({equippedWeaponIds:["greatsword"]}),"greatsword",false],
 ] as const)("damage %s",(_n,r,wid,v)=>{expect(getWeaponDamageSummary(character(r),actualItem(wid),v)).toBe(weaponDamageSummary(r,refItem(wid),v));});
 const loadouts=[{a:null,s:null,styles:[] as string[]},{a:"leather",s:null,styles:[] as string[]},{a:"scale-mail",s:null,styles:[] as string[]},{a:"chain-mail",s:null,styles:[] as string[]},{a:"chain-mail",s:"shield",styles:[] as string[]},{a:"chain-mail",s:"shield",styles:["defense"]}];
 for(const dex of [8,10,12,14,16,18,20])for(const l of loadouts){it(`AC DEX${dex} ${l.a??"none"} ${l.s??"none"} ${l.styles.join(",")}`,()=>{const inv=[...(l.a?[{itemId:l.a,quantity:1}]:[]),...(l.s?[{itemId:l.s,quantity:1}]:[])];const r=base({abilities:{str:10,dex,con:14,int:10,wis:10,cha:10},fightingStyleIds:l.styles,inventory:inv,equippedArmorId:l.a,equippedShieldId:l.s});const c=character(r);const expected=automaticArmorClass(r,REFERENCE_ITEMS);expect(calculateSuggestedArmorClass(c,ACTUAL_ITEMS)).toBe(expected);expect(calculateEffectiveArmorClass(c,ACTUAL_ITEMS)).toBe(expected);});}
 it("manual AC",()=>{const r=base({armorClassMode:"manual",armorClass:23});expect(calculateEffectiveArmorClass(character(r),ACTUAL_ITEMS)).toBe(23);});
 it.each(["dagger","longsword","rapier","longbow","greatsword"])("mastery %s",wid=>{expect(getWeaponMastery(actualItem(wid),"dnd_2014")).toBe(weaponMastery(refItem(wid),"dnd_2014"));expect(getWeaponMastery(actualItem(wid),"dnd_2024")).toBe(weaponMastery(refItem(wid),"dnd_2024"));});
 it.each([["longsword",1,true],["chain-mail",1,true],["shield",1,true],["rope",1,false],["longsword",0,false]] as const)("equip %s q%i",(id,q,e)=>expect(canEquipItem(actualItem(id),q)).toBe(e));
 const ruleset={id:"dnd_2014",name:"Certification",version:"1",classes:[],races:[],backgrounds:[],feats:[],spells:REFERENCE_SPELLS as DndSpellData[],items:ACTUAL_ITEMS} as unknown as RulesetData;
 it.each([
  ["weapon",base({armorClass:16,inventory:[{itemId:"longsword",quantity:1}],equippedWeaponIds:["longsword"]}),[]],
  ["spell",base({className:"Wizard",armorClass:12,knownSpellIds:["fire-bolt"]}),[]],
  ["always",base({className:"Cleric",armorClass:16}),["sacred-flame"]],
  ["monk",base({className:"Monk",armorClass:15}),[]],
  ["missing",base({armorClass:16,equippedWeaponIds:["longsword"]}),[]],
  ["invalid",base({armorClass:9,maxHp:0}),[]],
  ["none",base({armorClass:12,gold:0,inventory:[]}),[]],
 ] as const)("readiness %s",(_n,r,always)=>{const expected=combatReadiness(r,REFERENCE_ITEMS,REFERENCE_SPELLS,[...always]);const actual=getLevelOneCombatReadiness(character(r) as unknown as CharacterDraft,ruleset,[...always]);expect({ready:actual.ready,blockers:actual.blockers,notices:actual.notices,primaryOptions:actual.primaryOptions}).toEqual(expected);});
});
