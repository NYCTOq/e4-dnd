import { describe, expect, it } from "vitest";
import { generateSpellcastingScenarios } from "./spellcastingScenarioMatrix";

describe("spellcasting scenario matrix",()=>{
  it("generates 208 deterministic unique scenarios",()=>{
    const a=generateSpellcastingScenarios();
    const b=generateSpellcastingScenarios();
    expect(a).toEqual(b);
    expect(a).toHaveLength(208);
    expect(new Set(a.map(x=>x.id)).size).toBe(208);
  });
  it("covers eight classes and two rulesets",()=>{
    const data=generateSpellcastingScenarios();
    expect(new Set(data.map(x=>x.className)).size).toBe(8);
    expect(new Set(data.map(x=>x.ruleset))).toEqual(new Set(["dnd_2014","dnd_2024"]));
  });
  it("keeps values sane",()=>{
    for(const x of generateSpellcastingScenarios()){
      expect(x.saveDc).toBeGreaterThanOrEqual(10);
      expect(x.attackBonus).toBeGreaterThanOrEqual(2);
      expect(x.maxSpellLevel).toBeGreaterThanOrEqual(0);
      expect(x.maxSpellLevel).toBeLessThanOrEqual(9);
    }
  });
});
