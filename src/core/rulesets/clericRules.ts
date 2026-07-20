import type { RulesetId } from "../character/character.types";

export type ClericEdition = Extract<RulesetId,"dnd_2014"|"dnd_2024">;
const clamp=(level:number)=>Math.max(1,Math.min(20,Math.floor(level)));
const PREPARED_2024=[0,4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];

export function getClericCantripCount(level:number){const l=clamp(level);return l>=10?5:l>=4?4:3}
export function getClericPreparedSpellLimit(level:number,ruleset:ClericEdition,wisdomModifier=0){const l=clamp(level);return ruleset==="dnd_2024"?PREPARED_2024[l]:Math.max(1,l+wisdomModifier)}
export function getDivineSparkDice(level:number){const l=clamp(level);return l>=18?4:l>=13?3:l>=7?2:1}
export function getDestroyUndeadCr(level:number){const l=clamp(level);return l>=17?4:l>=14?3:l>=11?2:l>=8?1:l>=5?.5:null}
export function getChannelDivinityUses(level:number,ruleset:ClericEdition="dnd_2014"){const l=clamp(level);if(l<2)return 0;return ruleset==="dnd_2024"?(l>=18?4:l>=6?3:2):(l>=18?3:l>=6?2:1)}
export function getClericSubclassLevel(ruleset:ClericEdition){return ruleset==="dnd_2024"?3:1}
export function getClericSubclassFeatureLevels(ruleset:ClericEdition){return ruleset==="dnd_2024"?[3,6,17]:[1,2,6,8,17]}
export function getClericCombatFeatures(level:number,ruleset:string){const l=clamp(level);const edition=(ruleset==="dnd_2024"?"dnd_2024":"dnd_2014") as ClericEdition;return{
 channelDivinity:l>=2,
 channelDivinityUses:getChannelDivinityUses(l,edition),
 channelDivinityShortRestRecovery:edition==="dnd_2024"?1:getChannelDivinityUses(l,edition),
 divineOrder:edition==="dnd_2024"&&l>=1,
 divineSpark:edition==="dnd_2024"&&l>=2,
 divineSparkDice:edition==="dnd_2024"&&l>=2?getDivineSparkDice(l):0,
 destroyUndead:edition==="dnd_2014"?getDestroyUndeadCr(l):null,
 searUndead:edition==="dnd_2024"&&l>=5,
 blessedStrikes:edition==="dnd_2024"&&l>=7,
 improvedBlessedStrikes:edition==="dnd_2024"&&l>=14,
 divineIntervention:l>=10,
 improvedDivineIntervention:edition==="dnd_2014"&&l>=20,
 greaterDivineIntervention:edition==="dnd_2024"&&l>=20,
 cantripCount:getClericCantripCount(l),
 }}
