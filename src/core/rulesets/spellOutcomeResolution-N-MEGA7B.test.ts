import { describe, expect, it } from "vitest";
import { resolveSpellOutcome } from "./spellOutcomeResolution";
const maxRoll=()=>0.999999;

describe("N-MEGA7B spell outcome resolution",()=>{
  it("scales cantrip damage by character level",()=>{
    const result=resolveSpellOutcome({spell:{id:"fire-bolt",level:0,damageDice:"1d10",scaling:{mode:"character-level",dicePerStep:"1d10"}},characterLevel:11,random:maxRoll});
    expect(result.formula).toBe("3d10");
    expect(result.rawTotal).toBe(30);
  });
  it("applies slot-level upcast dice",()=>{
    const result=resolveSpellOutcome({spell:{id:"cure-wounds",level:1,healingDice:"1d8",scaling:{mode:"slot-level",dicePerStep:"1d8"}},characterLevel:5,castLevel:3,random:maxRoll});
    expect(result.formula).toBe("3d8");
    expect(result.appliedTotal).toBe(24);
    expect(result.kind).toBe("healing");
  });
  it("resolves spell attacks against armor class",()=>{
    const result=resolveSpellOutcome({spell:{id:"chromatic-orb",level:1,damageDice:"3d8",attackType:"spell-attack"},characterLevel:3,spellAttackBonus:5,attackD20:9,targetArmorClass:15,random:maxRoll});
    expect(result.attackTotal).toBe(14);
    expect(result.attackHit).toBe(false);
    expect(result.appliedTotal).toBe(0);
  });
  it("applies half damage after a successful save",()=>{
    const result=resolveSpellOutcome({spell:{id:"fireball",level:3,damageDice:"8d6",saveAbility:"dexterity",saveDamageRule:"half"},characterLevel:5,spellSaveDc:15,targetSaveTotal:16,random:maxRoll});
    expect(result.rawTotal).toBe(48);
    expect(result.saveSucceeded).toBe(true);
    expect(result.appliedTotal).toBe(24);
  });
  it("applies zero damage for a successful save when the spell says none",()=>{
    const result=resolveSpellOutcome({spell:{id:"sacred-flame",level:0,damageDice:"1d8",saveAbility:"dexterity",saveDamageRule:"none",scaling:{mode:"character-level",dicePerStep:"1d8"}},characterLevel:5,spellSaveDc:14,targetSaveTotal:14,random:maxRoll});
    expect(result.rawTotal).toBe(16);
    expect(result.appliedTotal).toBe(0);
  });
});
