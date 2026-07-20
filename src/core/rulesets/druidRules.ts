import type { RulesetId } from "../character/character.types";

export type DruidEdition = Extract<RulesetId,"dnd_2014"|"dnd_2024">;
const clamp=(level:number)=>Math.max(1,Math.min(20,Math.floor(level)));
const prepared2024=[0,4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
export function getDruidSubclassLevel(ruleset:DruidEdition){return ruleset==="dnd_2024"?3:2}
export function getDruidCantripCount(level:number,ruleset:DruidEdition){const l=clamp(level);return ruleset==="dnd_2024"?(l>=10?4:l>=4?3:2):(l>=10?4:l>=4?3:2)}
export function getDruidPreparedSpellLimit(level:number,ruleset:DruidEdition,wisdomModifier:number){const l=clamp(level);return ruleset==="dnd_2024"?prepared2024[l]:Math.max(1,l+wisdomModifier)}
export function getWildShapeUses(level:number,ruleset:DruidEdition){const l=clamp(level);if(l<2)return 0;if(ruleset==="dnd_2014")return l===20?Number.POSITIVE_INFINITY:2;return l>=17?4:l>=6?3:2}
export function getWildShapeKnownForms(level:number,ruleset:DruidEdition){const l=clamp(level);if(l<2)return 0;if(ruleset==="dnd_2014")return 0;return l>=8?8:l>=4?6:4}
export function getWildShapeMaxCr(level:number,ruleset:DruidEdition,subclass=""){const l=clamp(level);if(l<2)return 0;const moon=/moon/i.test(subclass);if(ruleset==="dnd_2014"&&moon)return l<6?1:Math.floor(l/3);return l>=8?1:l>=4?.5:.25}
export function canWildShapeFly(level:number,_ruleset:DruidEdition){return clamp(level)>=8}
export function canWildShapeSwim(level:number,ruleset:DruidEdition){return ruleset==="dnd_2024"?clamp(level)>=2:clamp(level)>=4}
export function getNaturalRecoveryBudget(level:number,ruleset:DruidEdition){const l=clamp(level);return ruleset==="dnd_2014"?Math.ceil(l/2):l>=6?Math.ceil(l/2):0}
export function getDruidCombatFeatures(level:number,ruleset:DruidEdition){const l=clamp(level);return{
 primalOrder:ruleset==="dnd_2024"&&l>=1,
 wildCompanion:ruleset==="dnd_2024"&&l>=2,
 wildResurgence:ruleset==="dnd_2024"&&l>=5,
 elementalFury:ruleset==="dnd_2024"&&l>=7,
 improvedElementalFury:ruleset==="dnd_2024"&&l>=15,
 beastSpells:l>=18,
 archdruid:l>=20,
 unlimitedWildShape:ruleset==="dnd_2014"&&l>=20,
 evergreenWildShape:ruleset==="dnd_2024"&&l>=20,
 natureMagician:ruleset==="dnd_2024"&&l>=20,
 timelessBody:ruleset==="dnd_2014"?l>=18:l>=20,
}}
export function getDruidSubclassFeatureLevels(ruleset:DruidEdition,subclassName:string){if(ruleset==="dnd_2024")return[3,6,10,14];return /land/i.test(subclassName)?[2,3,6,10,14]:[2,6,10,14]}
