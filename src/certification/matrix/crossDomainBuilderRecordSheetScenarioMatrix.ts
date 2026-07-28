import type { CrossDomainArchetype, CrossDomainPayload, CrossDomainRuleset } from "../oracle/crossDomainBuilderRecordSheetOracle";

export type CrossDomainScenario = { id:string; archetype:CrossDomainArchetype; payload:CrossDomainPayload };
const RULESETS:readonly CrossDomainRuleset[]=["2014","2024"];
const ARCHETYPES:readonly CrossDomainArchetype[]=["martial","prepared-caster","known-caster","multiclass"];
const LEVELS=[1,3,5,9,13,17] as const;
const EQUIPMENT_STATES=["basic","equipped"] as const;
const RESOURCE_STATES=["fresh","spent"] as const;

function classProfile(archetype:CrossDomainArchetype){
  if(archetype==="martial") return {className:"Fighter",subclassName:"Champion",classLevels:{Fighter:1}};
  if(archetype==="prepared-caster") return {className:"Cleric",subclassName:"Life Domain",classLevels:{Cleric:1}};
  if(archetype==="known-caster") return {className:"Sorcerer",subclassName:"Draconic Sorcery",classLevels:{Sorcerer:1}};
  return {className:"Fighter",subclassName:"Champion",classLevels:{Fighter:1,Wizard:1}};
}

export function buildCrossDomainScenarioMatrix():readonly CrossDomainScenario[]{
  const scenarios:CrossDomainScenario[]=[];
  for(const ruleset of RULESETS) for(const archetype of ARCHETYPES) for(const level of LEVELS) for(const equipment of EQUIPMENT_STATES) for(const state of RESOURCE_STATES){
    const profile=classProfile(archetype);
    const multiclass=archetype==="multiclass";
    const classLevels=multiclass?{Fighter:Math.max(1,Math.floor(level/2)),Wizard:Math.max(1,level-Math.max(1,Math.floor(level/2)))}:{[profile.className]:level};
    const caster=archetype!=="martial";
    const inventoryIds=equipment==="equipped"?["chain-mail","shield","longsword"]:["longsword"];
    const equippedItemIds=equipment==="equipped"?["chain-mail","shield","longsword"]:["longsword"];
    const payload:CrossDomainPayload={
      id:`${ruleset}-${archetype}-${level}-${equipment}-${state}`,
      ruleset,level,className:profile.className,subclassName:level>=3?profile.subclassName:null,classLevels,
      ancestry:ruleset==="2024"?"Human":"Variant Human",background:caster?"Sage":"Soldier",
      abilities:{str:archetype==="martial"?16:10,dex:14,con:14,int:multiclass?16:caster?12:10,wis:archetype==="prepared-caster"?16:10,cha:archetype==="known-caster"?16:10},
      skillProficiencies:caster?["Arcana","Insight"]:["Athletics","Perception"],saveProficiencies:caster?["Wisdom","Charisma"]:["Strength","Constitution"],
      featIds:level>=4?[ruleset==="2024"?"alert-2024":"alert-2014"]:[],
      knownSpellIds:archetype==="known-caster"||multiclass?["fire-bolt","shield"]:[],
      preparedSpellIds:archetype==="prepared-caster"?["bless","cure-wounds"]:multiclass?["magic-missile"]:[],
      inventoryIds,equippedItemIds,
      resources:[{id:caster?"spell-slots-1":"second-wind",max:level>=5?4:2,used:state==="spent"?1:0,recovery:caster?"long":"short"}],
    };
    scenarios.push({id:payload.id,archetype,payload});
  }
  return scenarios;
}
