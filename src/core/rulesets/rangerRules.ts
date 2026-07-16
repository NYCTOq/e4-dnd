export function getFavoredEnemyUses(wisdomModifier:number){return Math.max(1,wisdomModifier)}
export function getHuntersMarkDamage(level:number){return level>=20?"1d10":level>=13?"1d8":"1d6"}
export function getRangerCombatFeatures(level:number,ruleset:string){return{favoredEnemy:ruleset==="dnd_2024"&&level>=1,deftExplorer:level>=1,fightingStyle:level>=2,extraAttack:level>=5,roving:level>=6,tireless:level>=10,naturesVeil:level>=14,foeSlayer:level>=20}}
