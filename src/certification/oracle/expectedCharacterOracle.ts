export const abilityModifier=(score:number)=>Math.floor((score-10)/2);
export const proficiencyBonus=(level:number)=>2+Math.floor((Math.max(1,level)-1)/4);
export function applyBonuses(base:Record<string,number>,bonuses:Record<string,number|undefined>){return Object.fromEntries(Object.entries(base).map(([key,value])=>[key,value+(bonuses[key]??0)]));}
export function levelOneHp(hitDie:number,constitution:number,ancestryBonus=0){return hitDie+abilityModifier(constitution)+ancestryBonus;}
export function compareExpected(actual:Record<string,unknown>,expected:Record<string,unknown>){return Object.entries(expected).map(([field,expectedValue])=>({field,expected:expectedValue,actual:actual[field],pass:JSON.stringify(actual[field])===JSON.stringify(expectedValue)}));}
