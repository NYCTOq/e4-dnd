export function getFighterExtraAttacks(level:number){return level>=20?4:level>=11?3:level>=5?2:1}
export function getActionSurgeUses(level:number){return level>=17?2:level>=2?1:0}
export function getIndomitableUses(level:number){return level>=17?3:level>=13?2:level>=9?1:0}
export function getIndomitableBonus(level:number,ruleset:string){return ruleset==="dnd_2024"?Math.max(1,Math.min(20,level)):0}
export function getFighterCombatFeatures(level:number){return{secondWind:level>=1,actionSurge:level>=2,tacticalMind:level>=2,extraAttack:getFighterExtraAttacks(level),indomitable:getIndomitableUses(level),tacticalMaster:level>=9,studiedAttacks:level>=13}}
