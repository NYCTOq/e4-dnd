export function getMartialArtsDie(level:number,ruleset:string){if(ruleset==="dnd_2024")return level>=17?12:level>=11?10:level>=5?8:6;return level>=17?10:level>=11?8:level>=5?6:4}
export function getUnarmoredMovementBonus(level:number){return level<2?0:level>=18?30:level>=14?25:level>=10?20:level>=6?15:10}
export function getFlurryStrikeCount(ruleset:string){return ruleset==="dnd_2024"?2:2}
export function getMonkCombatFeatures(level:number){return{flurry:level>=2,patientDefense:level>=2,stepOfWind:level>=2,deflectAttacks:level>=3,stunningStrike:level>=5,evasion:level>=7,diamondSoul:level>=14}}
