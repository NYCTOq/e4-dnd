import {describe,expect,it} from "vitest";
import {abilityModifier,applyBonuses,levelOneHp,proficiencyBonus} from "./expectedCharacterOracle";
describe("official expected result oracle",()=>{it("calculates proficiency bonus",()=>{expect([1,5,9,13,17].map(proficiencyBonus)).toEqual([2,3,4,5,6]);});it("applies bonuses",()=>{expect(applyBonuses({str:15,con:14},{str:2,con:1})).toEqual({str:17,con:15});});it("calculates hp",()=>{expect(levelOneHp(10,15)).toBe(12);});it("calculates modifier",()=>{expect(abilityModifier(17)).toBe(3);});});
