import type { BackgroundReference } from "../reference.types";
const source=(name:string)=>({publisher:"Wizards of the Coast" as const,document:"D&D Basic Rules 2024",section:`Character Origins > ${name}`,ruleset:"dnd_2024" as const,verifiedAt:"2026-07-23"});
export const BACKGROUNDS_2024_REFERENCE:BackgroundReference[]=[
{id:"soldier",name:"Soldier",abilityOptions:["str","dex","con"],abilityModes:["2-1","1-1-1"],grantedSkills:["Athletics","Intimidation"],grantedOriginFeat:"savage-attacker",source:source("Soldier")},
{id:"criminal",name:"Criminal",abilityOptions:["dex","con","int"],abilityModes:["2-1","1-1-1"],grantedSkills:["Sleight of Hand","Stealth"],grantedOriginFeat:"alert",source:source("Criminal")},
{id:"sage",name:"Sage",abilityOptions:["con","int","wis"],abilityModes:["2-1","1-1-1"],grantedSkills:["Arcana","History"],grantedOriginFeat:"magic-initiate-wizard",source:source("Sage")},
{id:"acolyte",name:"Acolyte",abilityOptions:["int","wis","cha"],abilityModes:["2-1","1-1-1"],grantedSkills:["Insight","Religion"],grantedOriginFeat:"magic-initiate-cleric",source:source("Acolyte")},
];
