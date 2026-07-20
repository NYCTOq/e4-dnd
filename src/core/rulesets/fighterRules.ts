export type FighterEdition="dnd_2014"|"dnd_2024";
const safe=(level:number)=>Math.max(1,Math.min(20,Math.floor(level)));
export function getFighterExtraAttacks(level:number){const n=safe(level);return n>=20?4:n>=11?3:n>=5?2:1}
export function getActionSurgeUses(level:number){const n=safe(level);return n>=17?2:n>=2?1:0}
export function getIndomitableUses(level:number){const n=safe(level);return n>=17?3:n>=13?2:n>=9?1:0}
export function getIndomitableBonus(level:number,ruleset:string){return ruleset==="dnd_2024"?safe(level):0}
export function getSecondWindUses(level:number,ruleset:FighterEdition){const n=safe(level);return ruleset==="dnd_2024"?(n>=10?4:n>=4?3:2):1}
export function getFighterWeaponMasteryCount(level:number,ruleset:FighterEdition){const n=safe(level);if(ruleset==="dnd_2014")return 0;return n>=16?6:n>=10?5:n>=4?4:3}
export function getFighterSubclassLevel(_ruleset:FighterEdition){return 3}
export function getFighterSubclassFeatureLevels(ruleset:FighterEdition,subclassName:string){if(/champion/i.test(subclassName))return ruleset==="dnd_2024"?[3,7,10,15,18]:[3,7,10,15,18];if(/battle master/i.test(subclassName))return[3,7,10,15,18];return[3,7,10,15,18]}
export function getFighterFightingStyleCount(level:number,ruleset:FighterEdition,subclassName=""){const n=safe(level);let count=n>=1?1:0;if(/champion/i.test(subclassName)){if(ruleset==="dnd_2014"&&n>=10)count++;if(ruleset==="dnd_2024"&&n>=7)count++;}return count}
export function getChampionFeatures(level:number,ruleset:FighterEdition){const n=safe(level);return{criticalThreshold:n>=15?18:n>=3?19:20,remarkableAthlete:n>=3&&ruleset==="dnd_2024"||n>=7&&ruleset==="dnd_2014",additionalFightingStyle:ruleset==="dnd_2024"?n>=7:n>=10,heroicWarrior:ruleset==="dnd_2024"&&n>=10,survivor:n>=18}}
export function getBattleMasterProgression(level:number){const n=safe(level);return{superiorityDice:n>=15?6:n>=7?5:n>=3?4:0,superiorityDie:n>=18?"d12":n>=10?"d10":n>=3?"d8":null,maneuversKnown:n>=15?9:n>=10?7:n>=7?5:n>=3?3:0,studentOfWar:n>=3,knowYourEnemy:n>=7,relentless:n>=15,ultimateCombatSuperiority:n>=18}}
export function getFighterCombatFeatures(level:number,ruleset:FighterEdition="dnd_2014"){const n=safe(level);return{secondWind:n>=1,secondWindUses:getSecondWindUses(n,ruleset),secondWindShortRecovery:ruleset==="dnd_2024"?1:getSecondWindUses(n,ruleset),actionSurge:n>=2,actionSurgeUses:getActionSurgeUses(n),tacticalMind:ruleset==="dnd_2024"&&n>=2,tacticalShift:ruleset==="dnd_2024"&&n>=5,extraAttack:getFighterExtraAttacks(n),indomitable:getIndomitableUses(n),indomitableBonus:getIndomitableBonus(n,ruleset),tacticalMaster:ruleset==="dnd_2024"&&n>=9,studiedAttacks:ruleset==="dnd_2024"&&n>=13,weaponMasteryCount:getFighterWeaponMasteryCount(n,ruleset),epicBoon:ruleset==="dnd_2024"&&n>=19}}
