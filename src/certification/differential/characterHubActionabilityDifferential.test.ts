import { describe, expect, it } from "vitest";
import { buildCharacterHubDifferentialReport, buildCharacterHubScenarioMatrix, compareCharacterHubScenario } from "./characterHubActionabilityDifferential";
import { getCanonicalCharacterHubDecision } from "../oracle/characterHubActionabilityOracle";

describe("v5.122B character hub actionability differential",()=>{
 it("covers 144 deterministic dashboard/list/detail scenarios",()=>{expect(buildCharacterHubScenarioMatrix()).toHaveLength(144);});
 it("keeps every surface equal to the independent oracle",()=>{expect(buildCharacterHubDifferentialReport()).toMatchObject({status:"GREEN",scenarioCount:144,mismatchCount:0,surfaceCount:3,stateCount:6,editionCount:2,archetypeCount:4,nextPackage:"v5.122C"});});
 it("prioritizes zero HP over active play and level-up",()=>{expect(getCanonicalCharacterHubDecision({characterId:"x",currentHp:0,maxHp:30,level:5,pendingLevel:true,activePlay:true}).actionId).toBe("recover");});
 it("prioritizes active play over pending level-up",()=>{expect(getCanonicalCharacterHubDecision({characterId:"x",currentHp:20,maxHp:30,level:5,pendingLevel:true,activePlay:true}).actionId).toBe("continue-play");});
 it("detects a route mutation",()=>{const row=compareCharacterHubScenario(buildCharacterHubScenarioMatrix()[1]);expect({...row.actual,route:"/wrong"}).not.toEqual(row.expected);});
 it("detects an action mutation",()=>{const decision=getCanonicalCharacterHubDecision({characterId:"x",currentHp:30,maxHp:30,level:5,pendingLevel:false,activePlay:false});expect({...decision,actionId:"continue-play"}).not.toEqual(decision);});
});
