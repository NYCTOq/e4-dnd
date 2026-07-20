export type RangerEdition="dnd_2014"|"dnd_2024";
const clamp=(level:number)=>Math.max(1,Math.min(20,Math.floor(level)));
const prepared2024=[0,2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
const known2014=[0,0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11];
export function getFavoredEnemyUses(level:number,ruleset:RangerEdition="dnd_2024"){const safe=clamp(level);if(ruleset!=="dnd_2024")return 0;return safe>=17?6:safe>=13?5:safe>=9?4:safe>=5?3:2}
export function getHuntersMarkDamage(level:number,ruleset:string="dnd_2024"){return ruleset==="dnd_2024"&&clamp(level)>=20?"1d10":"1d6"}
export function getRangerPreparedSpellLimit(level:number,ruleset:RangerEdition){const safe=clamp(level);return ruleset==="dnd_2024"?prepared2024[safe]:0}
export function getRangerKnownSpellLimit(level:number,ruleset:RangerEdition){const safe=clamp(level);return ruleset==="dnd_2014"?known2014[safe]:0}
export function getRangerWeaponMasteryCount(_level:number,ruleset:RangerEdition){return ruleset==="dnd_2024"?2:0}
export function getRangerExpertiseCount(level:number,ruleset:RangerEdition){const safe=clamp(level);return ruleset==="dnd_2024"?(safe>=9?3:safe>=2?1:0):0}
export function getRangerSubclassLevel(){return 3}
export function getRangerSubclassFeatureLevels(){return[3,7,11,15]}
export function getRangerCombatFeatures(level:number,ruleset:string,wisdomModifier=0){const safe=clamp(level),modern=ruleset==="dnd_2024";return{
 favoredEnemy:modern,
 favoredEnemyUses:getFavoredEnemyUses(safe,modern?"dnd_2024":"dnd_2014"),
 naturalExplorer:!modern,
 primevalAwareness:!modern&&safe>=3,
 deftExplorer:modern&&safe>=2,
 expertiseCount:getRangerExpertiseCount(safe,modern?"dnd_2024":"dnd_2014"),
 fightingStyle:safe>=2,
 extraAttack:safe>=5,
 landsStride:!modern&&safe>=8,
 hideInPlainSight:!modern&&safe>=10,
 roving:modern&&safe>=6,
 rovingSpeedBonus:modern&&safe>=6?10:0,
 tireless:modern&&safe>=10,
 tirelessUses:modern&&safe>=10?Math.max(1,wisdomModifier):0,
 tirelessTempHp:modern&&safe>=10?"1d8 + WIS":null,
 relentlessHunter:modern&&safe>=13,
 naturesVeil:modern&&safe>=14,
 naturesVeilUses:modern&&safe>=14?Math.max(1,wisdomModifier):0,
 vanish:!modern&&safe>=14,
 preciseHunter:modern&&safe>=17,
 feralSenses:safe>=18,
 blindsight:modern&&safe>=18?30:0,
 foeSlayer:safe>=20,
 foeSlayerSummary:safe>=20?(modern?"Hunter's Mark damage die becomes d10":"Once per turn add WIS to attack or damage against a favored enemy"):null,
 weaponMasteryCount:getRangerWeaponMasteryCount(safe,modern?"dnd_2024":"dnd_2014"),
 huntersMarkDamage:getHuntersMarkDamage(safe,modern?"dnd_2024":"dnd_2014")
}}
export function getHunterProgression(level:number,ruleset:RangerEdition){const safe=clamp(level),modern=ruleset==="dnd_2024";return{
 huntersLore:modern&&safe>=3,
 huntersPrey:safe>=3,
 huntersPreyOptions:modern?["Colossus Slayer","Horde Breaker"]:["Colossus Slayer","Giant Killer","Horde Breaker"],
 defensiveTactics:safe>=7,
 defensiveOptions:modern?["Escape the Horde","Multiattack Defense"]:["Escape the Horde","Multiattack Defense","Steel Will"],
 level11Feature:safe>=11?(modern?"Superior Hunter's Prey":"Multiattack"):null,
 level11Options:!modern&&safe>=11?["Volley","Whirlwind Attack"]:[],
 superiorDefense:safe>=15,
 superiorDefenseOptions:modern?["Reactive Resistance"]:["Evasion","Stand Against the Tide","Uncanny Dodge"]
}}
export function getBeastMasterProgression(level:number,ruleset:RangerEdition){const safe=clamp(level),modern=ruleset==="dnd_2024";return{
 companion:safe>=3,
 companionFeature:modern?"Primal Companion":"Ranger's Companion",
 exceptionalTraining:safe>=7,
 bestialFury:safe>=11,
 companionAttacks:safe>=11?2:1,
 shareSpells:safe>=15,
 commandAction:modern?"Bonus Action":"Attack action replacement / command",
 sourceWarning:modern?"Beast Master is full PHB content; preserve source and license metadata.":null
}}
