import { describe, expect, it } from "vitest";
import { applyPlayStatusAction } from "./playStatusRuntime";
import { makeCharacter } from "../../test/fixtures";

describe("N-MEGA10 play status runtime",()=>{
  it("absorbs damage with temporary hp before current hp",()=>{const hero=makeCharacter({currentHp:20,tempHp:5});const next=applyPlayStatusAction(hero,{type:"damage",amount:8});expect(next).toMatchObject({tempHp:0,currentHp:17})});
  it("tracks death saves and stabilizes",()=>{let hero=makeCharacter({currentHp:0});hero=applyPlayStatusAction(hero,{type:"death-save-success"});hero=applyPlayStatusAction(hero,{type:"death-save-success"});hero=applyPlayStatusAction(hero,{type:"death-save-success"});expect(hero.deathSaveStable).toBe(true)});
  it("toggles conditions and clamps exhaustion",()=>{let hero=makeCharacter();hero=applyPlayStatusAction(hero,{type:"toggle-condition",condition:"Poisoned"});hero=applyPlayStatusAction(hero,{type:"set-exhaustion",level:99});expect(hero.conditions).toContain("Poisoned");expect(hero.exhaustion).toBe(6)});
  it("spends and recovers resources without overflow",()=>{let hero=makeCharacter({resources:[{id:"rage",name:"Rage",max:2,used:0,recovery:"long"}]});hero=applyPlayStatusAction(hero,{type:"spend-resource",resourceId:"rage"});hero=applyPlayStatusAction(hero,{type:"recover-resource",resourceId:"rage"});expect(hero.resources[0].used).toBe(0)});
});
