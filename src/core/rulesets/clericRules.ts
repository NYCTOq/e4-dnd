export function getDivineSparkDice(level:number){return level>=18?5:level>=13?4:level>=7?3:2}
export function getDestroyUndeadCr(level:number){return level>=17?4:level>=14?3:level>=11?2:level>=8?1:level>=5?.5:null}
export function getChannelDivinityUses(level:number){return level>=18?3:level>=6?2:level>=2?1:0}
export function getClericCombatFeatures(level:number,ruleset:string){return{channelDivinity:level>=2,divineSpark:ruleset==="dnd_2024"&&level>=2,destroyUndead:ruleset==="dnd_2014"?getDestroyUndeadCr(level):null,blessedStrikes:level>=7,divineIntervention:level>=10,greaterDivineIntervention:level>=20}}
