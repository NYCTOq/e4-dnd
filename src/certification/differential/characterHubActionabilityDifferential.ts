import type { CharacterHubInput, CharacterHubSurface } from "../oracle/characterHubActionabilityOracle";
import { getCanonicalCharacterHubDecision, projectCharacterHubDecision } from "../oracle/characterHubActionabilityOracle";

export const CHARACTER_HUB_SURFACES: readonly CharacterHubSurface[]=["dashboard","characters","detail"];
export const CHARACTER_HUB_ARCHETYPES=["martial","prepared-caster","known-caster","multiclass"] as const;
export const CHARACTER_HUB_EDITIONS=["dnd_2014","dnd_2024"] as const;
export const CHARACTER_HUB_STATES = [
  {id:"empty",input:{characterId:null,currentHp:0,maxHp:0,level:0,pendingLevel:false,activePlay:false}},
  {id:"critical",input:{characterId:"hero",currentHp:0,maxHp:30,level:5,pendingLevel:false,activePlay:false}},
  {id:"wounded",input:{characterId:"hero",currentHp:17,maxHp:30,level:5,pendingLevel:false,activePlay:false}},
  {id:"level-ready",input:{characterId:"hero",currentHp:30,maxHp:30,level:5,pendingLevel:true,activePlay:false}},
  {id:"active-play",input:{characterId:"hero",currentHp:25,maxHp:30,level:5,pendingLevel:true,activePlay:true}},
  {id:"ready",input:{characterId:"hero",currentHp:30,maxHp:30,level:5,pendingLevel:false,activePlay:false}},
] as const;

export type CharacterHubScenario={edition:string;archetype:string;state:string;surface:CharacterHubSurface;input:CharacterHubInput};
export function buildCharacterHubScenarioMatrix(): CharacterHubScenario[]{
 return CHARACTER_HUB_EDITIONS.flatMap(edition=>CHARACTER_HUB_ARCHETYPES.flatMap(archetype=>CHARACTER_HUB_STATES.flatMap(state=>CHARACTER_HUB_SURFACES.map(surface=>({edition,archetype,state:state.id,surface,input:{...state.input,characterId:state.input.characterId?`${edition}-${archetype}-${state.id}`:null}})))));
}
export function compareCharacterHubScenario(scenario:CharacterHubScenario){
 const expected=getCanonicalCharacterHubDecision(scenario.input);
 const actual=projectCharacterHubDecision(scenario.surface,scenario.input);
 return {scenario,expected,actual,matches:expected.state===actual.state&&expected.actionId===actual.actionId&&expected.label===actual.label&&expected.route===actual.route&&expected.rank===actual.rank};
}
export function buildCharacterHubDifferentialReport(version="5.122.1"){
 const comparisons=buildCharacterHubScenarioMatrix().map(compareCharacterHubScenario);
 const mismatches=comparisons.filter(item=>!item.matches);
 return {package:"v5.122B",version,status:mismatches.length===0?"GREEN":"BLOCKED",scenarioCount:comparisons.length,surfaceCount:CHARACTER_HUB_SURFACES.length,stateCount:CHARACTER_HUB_STATES.length,editionCount:CHARACTER_HUB_EDITIONS.length,archetypeCount:CHARACTER_HUB_ARCHETYPES.length,mismatchCount:mismatches.length,nextPackage:"v5.122C",comparisons};
}
