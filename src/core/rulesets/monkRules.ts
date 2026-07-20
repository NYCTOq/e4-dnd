export type MonkEdition="dnd_2014"|"dnd_2024";
const safe=(level:number)=>Math.max(1,Math.min(20,Math.floor(level)));
export function getMartialArtsDie(level:number,ruleset:string){const l=safe(level);if(ruleset==="dnd_2024")return l>=17?12:l>=11?10:l>=5?8:6;return l>=17?10:l>=11?8:l>=5?6:4}
export function getMonkFocusPoints(level:number){const l=safe(level);return l>=2?l:0}
export function getUnarmoredMovementBonus(level:number){const l=safe(level);return l<2?0:l>=18?30:l>=14?25:l>=10?20:l>=6?15:10}
export function getFlurryStrikeCount(levelOrRuleset:number|string,rulesetMaybe?:string){const level=typeof levelOrRuleset==="number"?safe(levelOrRuleset):1;const ruleset=typeof levelOrRuleset==="string"?levelOrRuleset:rulesetMaybe;return ruleset==="dnd_2024"&&level>=10?3:2}
export function getMonkSubclassLevel(_ruleset:MonkEdition){return 3}
export function getMonkSubclassFeatureLevels(){return[3,6,11,17]}
export function getMonkCombatFeatures(level:number,ruleset:MonkEdition="dnd_2014"){const l=safe(level),is24=ruleset==="dnd_2024";return{
 flurry:l>=2,patientDefense:l>=2,stepOfWind:l>=2,uncannyMetabolism:is24&&l>=2,
 deflectAttacks:l>=3,deflectMissiles:!is24&&l>=3,slowFall:l>=4,extraAttack:l>=5,stunningStrike:l>=5,
 empoweredStrikes:l>=6,evasion:l>=7,stillnessOfMind:!is24&&l>=7,acrobaticMovement:l>=9,
 heightenedFocus:is24&&l>=10,selfRestoration:is24&&l>=10,purityOfBody:!is24&&l>=10,
 deflectEnergy:is24&&l>=13,tongueOfSunAndMoon:!is24&&l>=13,
 disciplinedSurvivor:is24&&l>=14,diamondSoul:!is24&&l>=14,perfectFocus:is24&&l>=15,timelessBody:!is24&&l>=15,
 superiorDefense:is24&&l>=18,emptyBody:!is24&&l>=18,perfectSelf:!is24&&l>=20,bodyAndMind:is24&&l>=20,
 focusPoints:getMonkFocusPoints(l),martialArtsDie:getMartialArtsDie(l,ruleset),unarmoredMovement:getUnarmoredMovementBonus(l),
 flurryStrikeCount:getFlurryStrikeCount(l,ruleset),perfectFocusFloor:is24&&l>=15?4:0,
 bodyAndMindIncrease:is24&&l>=20?4:0,bodyAndMindCap:is24&&l>=20?25:20,
 perfectSelfRecovery:!is24&&l>=20?4:0,stunningStrikeOncePerTurn:is24&&l>=5,
 patientDefenseFreeDisengage:is24&&l>=2,stepOfWindFreeDash:is24&&l>=2,
 } }
export function getOpenHandFeatures(level:number,ruleset:MonkEdition){const l=safe(level),is24=ruleset==="dnd_2024";return{
 openHandTechnique:l>=3,wholenessOfBody:l>=6,level11Feature:l>=11,quiveringPalm:l>=17,
 level11FeatureName:l>=11?(is24?"Fleet Step":"Tranquility"):null,
 wholenessAction:is24?"bonus-action":"action",wholenessUses:is24?"wisdom-modifier":"once-per-long-rest",
 quiveringPalmCost:is24?4:3,quiveringPalmDamage:is24?"10d12 force (half on save)":"10d10 necrotic or 0 HP on failed save",
 }}
export function getShadowFeatures(level:number,ruleset:MonkEdition){const l=safe(level),is24=ruleset==="dnd_2024";return{
 shadowArts:l>=3,shadowStep:l>=6,level11Feature:l>=11,level17Feature:l>=17,
 level11FeatureName:l>=11?(is24?"Improved Shadow Step":"Cloak of Shadows"):null,
 level17FeatureName:l>=17?(is24?"Cloak of Shadows":"Opportunist"):null,
 resourceName:is24?"Focus Points":"Ki Points",
 }}
