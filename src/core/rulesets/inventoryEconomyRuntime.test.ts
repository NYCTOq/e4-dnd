import { describe, expect, it } from "vitest";
import type { Character } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";
import { applyGoldTransaction, getCarryingCapacity, getInventoryEconomySnapshot, normalizeInventoryStack } from "./inventoryEconomyRuntime";
const character = { abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10}, inventory:[], equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:10 } as unknown as Character;
const items=[{id:"arrow",name:"Arrow",category:"ammunition",weight:.05,tags:[],cost:"0 gp",description:""},{id:"sword",name:"Sword",category:"weapon",weight:3,tags:[],cost:"0 gp",description:""}] as DndItemData[];
describe("inventory economy runtime",()=>{
 it("calculates carrying capacity",()=>expect(getCarryingCapacity(10)).toBe(150));
 it("merges duplicate stacks",()=>expect(normalizeInventoryStack([{itemId:"arrow",quantity:5},{itemId:"arrow",quantity:7}])).toMatchObject([{itemId:"arrow",quantity:12}]));
 it("prevents overspending",()=>expect(applyGoldTransaction(5,"spend",6)).toMatchObject({ok:false,gold:5}));
 it("reports missing equipped items",()=>expect(getInventoryEconomySnapshot({...character,equippedWeaponIds:["sword"]},items).ready).toBe(false));
 it("counts ammunition and weight",()=>expect(getInventoryEconomySnapshot({...character,inventory:[{itemId:"arrow",quantity:20}]},items)).toMatchObject({ammunition:20,weight:1}));
});
