import { describe, expect, it } from "vitest";
import { buildCrossDomainReferenceSnapshot, compareCrossDomainSnapshots } from "../oracle/crossDomainBuilderRecordSheetOracle";
import { buildRuntimeBuilderRecordSheetSnapshot } from "./crossDomainBuilderRecordSheetRuntime";
import { buildCrossDomainScenarioMatrix } from "../matrix/crossDomainBuilderRecordSheetScenarioMatrix";

describe("v5.121B builder-record-sheet differential",()=>{
  const scenarios=buildCrossDomainScenarioMatrix();
  it("covers 192 deterministic 2014/2024 lifecycle inputs",()=>{
    expect(scenarios).toHaveLength(192);
    expect(new Set(scenarios.map(s=>s.id)).size).toBe(192);
    expect(new Set(scenarios.map(s=>s.payload.ruleset))).toEqual(new Set(["2014","2024"]));
    expect(new Set(scenarios.map(s=>s.archetype)).size).toBe(4);
  });
  it("matches independent oracle and runtime snapshots with zero lost fields",()=>{
    const failures=scenarios.flatMap(s=>{
      const result=compareCrossDomainSnapshots(buildCrossDomainReferenceSnapshot(s.payload),buildRuntimeBuilderRecordSheetSnapshot(s.payload));
      return result.consistent?[]:[{id:s.id,differences:result.differences}];
    });
    expect(failures).toEqual([]);
  });
  it.each([
    ["ruleset",(s:any)=>({...s,identity:{...s.identity,ruleset:s.identity.ruleset==="2014"?"2024":"2014"}}),"identity"],
    ["subclass",(s:any)=>({...s,classIdentity:{...s.classIdentity,subclassName:null}}),"classIdentity"],
    ["ability",(s:any)=>({...s,abilities:s.abilities.map((x:any,i:number)=>i===0?[x[0],x[1]+1]:x)}),"abilities"],
    ["proficiency",(s:any)=>({...s,proficiencies:{...s.proficiencies,skills:[]}}),"proficiencies"],
    ["spell",(s:any)=>({...s,selections:{...s.selections,preparedSpells:[]}}),"selections.preparedSpells"],
    ["inventory",(s:any)=>({...s,inventory:{owned:[],equipped:[]}}),"inventory"],
    ["resource",(s:any)=>({...s,resources:s.resources.map((r:any)=>({...r,used:r.used+1}))}),"resources"],
  ])("detects %s field loss",(_name,mutate,expected)=>{
    const scenario=scenarios.find(s=>s.archetype==="prepared-caster"&&s.payload.level===5&&s.payload.ruleset==="2024"&&s.payload.resources[0].used===1)!;
    const reference=buildCrossDomainReferenceSnapshot(scenario.payload);
    const result=compareCrossDomainSnapshots(reference,mutate(buildRuntimeBuilderRecordSheetSnapshot(scenario.payload)));
    expect(result.consistent).toBe(false);
    expect(result.differences).toContain(expected);
  });
});
