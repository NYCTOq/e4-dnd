import { describe, expect, it } from "vitest";
import {
  CERTIFIED_ABILITY_KEYS,
  CERTIFIED_SKILLS,
  CERTIFIED_STANDARD_ARRAY,
} from "../reference/abilityProficiency.reference";
import {
  certifiedAbilityModifier,
  certifiedInitiative,
  certifiedPassivePerception,
  certifiedPointBuyRemaining,
  certifiedPointBuySpent,
  certifiedProficiencyBonus,
  certifiedSavingThrow,
  certifiedSkillBonus,
  certifiedSpellSaveDc,
  certifiedUnarmoredAc,
} from "./abilityProficiencyOracle";

const balanced = { str:13,dex:13,con:13,int:12,wis:12,cha:12 } as const;

describe("ability, proficiency and derived stats oracle", () => {
  it("certifies all standard array values", () => {
    expect([...CERTIFIED_STANDARD_ARRAY].sort((a,b)=>b-a)).toEqual([15,14,13,12,10,8]);
  });

  it.each([
    [1,-5],[2,-4],[3,-4],[4,-3],[5,-3],[6,-2],[7,-2],[8,-1],[9,-1],
    [10,0],[11,0],[12,1],[13,1],[14,2],[15,2],[16,3],[17,3],[18,4],
    [19,4],[20,5],[21,5],[22,6],[23,6],[24,7],[25,7],[30,10],
  ])("score %i has modifier %i", (score, modifier) => {
    expect(certifiedAbilityModifier(score)).toBe(modifier);
  });

  it("certifies proficiency bonus at all levels", () => {
    expect(Array.from({length:20},(_,i)=>certifiedProficiencyBonus(i+1)))
      .toEqual([2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6]);
  });

  it("certifies a legal 27 point build", () => {
    const scores = { str:15,dex:15,con:15,int:8,wis:8,cha:8 } as const;
    expect(certifiedPointBuySpent(scores)).toBe(27);
    expect(certifiedPointBuyRemaining(scores)).toBe(0);
  });

  it("certifies balanced point buy", () => {
    expect(certifiedPointBuySpent(balanced)).toBe(27);
    expect(certifiedPointBuyRemaining(balanced)).toBe(0);
  });

  it("rejects point buy values outside 8-15", () => {
    expect(() => certifiedPointBuySpent({ ...balanced, str:16 })).toThrow(RangeError);
  });

  it.each(CERTIFIED_ABILITY_KEYS)("supports ability key %s", (key) => {
    expect(key.length).toBe(3);
  });

  it.each(Object.entries(CERTIFIED_SKILLS))("%s maps to %s", (skill, ability) => {
    expect(["str","dex","con","int","wis","cha"]).toContain(ability);
    expect(skill.length).toBeGreaterThan(2);
  });

  it("certifies saving throw proficiency", () => {
    expect(certifiedSavingThrow({ score:16, level:5, proficient:true })).toBe(6);
    expect(certifiedSavingThrow({ score:16, level:5, proficient:false })).toBe(3);
  });

  it("certifies skill proficiency and expertise", () => {
    const abilities = { str:10,dex:16,con:14,int:12,wis:14,cha:8 } as const;
    expect(certifiedSkillBonus({ skill:"Stealth", abilities, level:5, proficiency:0 })).toBe(3);
    expect(certifiedSkillBonus({ skill:"Stealth", abilities, level:5, proficiency:1 })).toBe(6);
    expect(certifiedSkillBonus({ skill:"Stealth", abilities, level:5, proficiency:2 })).toBe(9);
  });

  it("certifies initiative", () => {
    expect(certifiedInitiative(16)).toBe(3);
    expect(certifiedInitiative(16,2)).toBe(5);
  });

  it("certifies passive perception", () => {
    expect(certifiedPassivePerception({ wisdom:16, level:5, proficiency:1 })).toBe(16);
    expect(certifiedPassivePerception({ wisdom:16, level:5, proficiency:2 })).toBe(19);
  });

  it("certifies spell save DC", () => {
    expect(certifiedSpellSaveDc({ castingScore:18, level:5 })).toBe(15);
    expect(certifiedSpellSaveDc({ castingScore:20, level:17 })).toBe(19);
  });

  it("certifies unarmored AC", () => {
    expect(certifiedUnarmoredAc({ dexterity:16 })).toBe(13);
    expect(certifiedUnarmoredAc({ dexterity:16, shieldBonus:2 })).toBe(15);
  });
});
