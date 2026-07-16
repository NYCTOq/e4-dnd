import type { DndItemData } from "./ruleset.types";
export function getRageDamageBonus(level:number){return level>=16?4:level>=9?3:2}
export function getBrutalCriticalExtraDice(level:number,ruleset:string){if(ruleset==="dnd_2024")return level>=13?2:level>=9?1:0;return level>=17?3:level>=13?2:level>=9?1:0}
export function isRageDamageWeapon(weapon:DndItemData){const properties=weapon.properties?.map(value=>value.toLowerCase())??[];return weapon.category==="weapon"&&!weapon.range&&!properties.includes("ammunition")&&!properties.includes("finesse")}
export function reduceRageDamage(amount:number,raging:boolean,physical:boolean){const damage=Math.max(0,Math.floor(amount));return raging&&physical?Math.floor(damage/2):damage}
export function getBarbarianCombatFeatures(level:number){return{recklessAttack:level>=2,dangerSense:level>=2,extraAttack:level>=5,relentlessRage:level>=11,persistentRage:level>=15}}
