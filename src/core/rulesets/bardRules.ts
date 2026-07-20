import type { RulesetId } from "../character/character.types";

export type BardEdition = Extract<RulesetId, "dnd_2014" | "dnd_2024">;
const clamp = (level:number) => Math.max(1, Math.min(20, Math.floor(level)));
const KNOWN_2014 = [0,4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22];
const PREPARED_2024 = [0,4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];

export function getBardicInspirationDie(level:number){const l=clamp(level);return l>=15?12:l>=10?10:l>=5?8:6}
export function getBardCantripCount(level:number){const l=clamp(level);return l>=10?4:l>=4?3:2}
export function getBardSpellLimit(level:number,ruleset:BardEdition){const l=clamp(level);return ruleset==="dnd_2024"?PREPARED_2024[l]:KNOWN_2014[l]}
export function getBardExpertiseCount(level:number,ruleset:BardEdition){const l=clamp(level);return ruleset==="dnd_2024"?(l>=9?4:l>=2?2:0):(l>=10?4:l>=3?2:0)}
export function getSongOfRestDie(level:number,ruleset:string){const l=clamp(level);if(ruleset!=="dnd_2014"||l<2)return null;return l>=17?12:l>=13?10:l>=9?8:6}
export function getInspirationRecovery(level:number){return clamp(level)>=5?"short":"long"}
export function getMagicalSecretsCount(level:number,ruleset:BardEdition){const l=clamp(level);if(ruleset==="dnd_2024")return 0;return l>=18?6:l>=14?4:l>=10?2:0}
export function getBardicInspirationInitiativeRecovery(level:number,ruleset:BardEdition){const l=clamp(level);if(ruleset==="dnd_2024"&&l>=18)return 2;if(ruleset==="dnd_2014"&&l>=20)return 1;return 0}
export function getBardCombatFeatures(level:number,ruleset:string){const l=clamp(level);const edition=(ruleset==="dnd_2024"?"dnd_2024":"dnd_2014") as BardEdition;return{
 jackOfAllTrades:l>=2,
 songOfRest:getSongOfRestDie(l,edition),
 fontOfInspiration:l>=5,
 fontSlotRecovery:edition==="dnd_2024"&&l>=5,
 countercharm:edition==="dnd_2014"?l>=6:l>=7,
 countercharmAction:edition==="dnd_2014"?"action":"reaction",
 magicalSecrets:l>=10,
 magicalSecretsCount:getMagicalSecretsCount(l,edition),
 superiorInspiration:getBardicInspirationInitiativeRecovery(l,edition)>0,
 wordsOfCreation:edition==="dnd_2024"&&l>=20,
 expertiseCount:getBardExpertiseCount(l,edition),
 cantripCount:getBardCantripCount(l),
 spellLimit:getBardSpellLimit(l,edition),
 inspirationDurationMinutes:edition==="dnd_2024"?60:10,
}}
