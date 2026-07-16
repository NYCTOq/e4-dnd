export function getBardicInspirationDie(level:number){return level>=15?12:level>=10?10:level>=5?8:6}
export function getSongOfRestDie(level:number,ruleset:string){if(ruleset!=="dnd_2014"||level<2)return null;return level>=17?12:level>=13?10:level>=9?8:6}
export function getBardCombatFeatures(level:number,ruleset:string){return{jackOfAllTrades:level>=2,songOfRest:getSongOfRestDie(level,ruleset),fontOfInspiration:level>=5,countercharm:ruleset==="dnd_2014"&&level>=6,magicalSecrets:level>=10,superiorInspiration:level>=20}}
export function getInspirationRecovery(level:number){return level>=5?"short":"long"}
