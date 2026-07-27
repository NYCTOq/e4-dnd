import { describe, expect, it } from "vitest";
import { CERTIFIED_CASTERS, FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, WARLOCK_PACT } from "../reference/spellcasting.reference";
import { highestSpellLevel, preparedLimit, spellAttack, spellSaveDc, spellSlots } from "./spellcastingOracle";

describe("spellcasting oracle",()=>{
  it("covers eight caster classes",()=>expect(CERTIFIED_CASTERS).toHaveLength(8));
  it("covers 20 full caster levels",()=>expect(Object.keys(FULL_CASTER_SLOTS)).toHaveLength(20));
  it("covers 20 half caster levels",()=>expect(Object.keys(HALF_CASTER_SLOTS)).toHaveLength(20));
  it("covers 20 pact levels",()=>expect(Object.keys(WARLOCK_PACT)).toHaveLength(20));
  it("checks full caster milestones",()=>{
    expect(spellSlots("full",1)).toEqual([{level:1,max:2}]);
    expect(highestSpellLevel("full",17)).toBe(9);
  });
  it("checks half caster milestones",()=>{
    expect(spellSlots("half",1)).toEqual([]);
    expect(spellSlots("half",5)).toEqual([{level:1,max:4},{level:2,max:2}]);
    expect(highestSpellLevel("half",17)).toBe(5);
  });
  it("checks pact magic milestones",()=>{
    expect(spellSlots("pact",1)).toEqual([{level:1,max:1}]);
    expect(spellSlots("pact",11)).toEqual([{level:5,max:3}]);
    expect(spellSlots("pact",17)).toEqual([{level:5,max:4}]);
  });
  it("checks third caster milestones",()=>{
    expect(highestSpellLevel("third",3)).toBe(1);
    expect(highestSpellLevel("third",7)).toBe(2);
    expect(highestSpellLevel("third",13)).toBe(3);
    expect(highestSpellLevel("third",19)).toBe(4);
  });
  it("checks spell math",()=>{
    expect(spellSaveDc(5,18)).toBe(15);
    expect(spellAttack(5,18)).toBe(7);
    expect(spellSaveDc(17,20)).toBe(19);
    expect(spellAttack(17,20)).toBe(11);
  });
  it("checks prepared formulas",()=>{
    expect(preparedLimit("Cleric","dnd_2014",5,4)).toBe(9);
    expect(preparedLimit("Paladin","dnd_2014",5,3)).toBe(5);
    expect(preparedLimit("Wizard","dnd_2024",20,5)).toBe(22);
  });
});
