import { describe,expect,it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { getPassiveScore,getSavingThrowBonus,getSkillBonus } from "./characterSheetRules";
import type { RulesetData } from "./ruleset.types";
describe("character sheet rules",()=>{
 it("adds proficiency and expertise correctly",()=>{const c=makeCharacter({level:5,abilities:{str:10,dex:16,con:10,int:10,wis:14,cha:10},skillProficiencies:["Stealth"],expertiseSkills:["Stealth"]}); expect(getSkillBonus(c,"Stealth")).toBe(9);});
 it("calculates passive scores from the same skill engine",()=>{const c=makeCharacter({abilities:{str:10,dex:10,con:10,int:10,wis:16,cha:10}}); expect(getPassiveScore(c,"Perception")).toBe(13);});
 it("adds class saving throw proficiency",()=>{const c=makeCharacter({level:1,className:"Fighter",abilities:{str:16,dex:10,con:10,int:10,wis:10,cha:10}}); const data={classes:[{name:"Fighter",savingThrows:["str","con"]}]} as unknown as RulesetData; expect(getSavingThrowBonus(c,"str",data)).toBe(5);});
});
