import { FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, WARLOCK_PACT, THIRD_CASTER_MAX, type Progression } from "../reference/spellcasting.reference";

export const mod=(score:number)=>Math.floor((score-10)/2);
export function pb(level:number){
  if(!Number.isInteger(level)||level<1||level>20) throw new RangeError("level 1-20");
  return 2+Math.floor((level-1)/4);
}
export const spellSaveDc=(level:number,score:number,bonus=0)=>8+pb(level)+mod(score)+bonus;
export const spellAttack=(level:number,score:number,bonus=0)=>pb(level)+mod(score)+bonus;

export function spellSlots(progression:Progression,level:number){
  if(progression==="full") return FULL_CASTER_SLOTS[level].map((max,i)=>({level:i+1,max})).filter(x=>x.max>0);
  if(progression==="half") return HALF_CASTER_SLOTS[level].map((max,i)=>({level:i+1,max})).filter(x=>x.max>0);
  if(progression==="pact"){const p=WARLOCK_PACT[level];return [{level:p.slotLevel,max:p.slots}]}
  return [];
}
export function highestSpellLevel(progression:Progression,level:number){
  if(progression==="third") return THIRD_CASTER_MAX[level]??0;
  const slots=spellSlots(progression,level);
  return slots.length?Math.max(...slots.map(x=>x.level)):0;
}
export function preparedLimit(className:string,ruleset:"dnd_2014"|"dnd_2024",level:number,castingMod:number){
  const key=className.toLowerCase();
  if(ruleset==="dnd_2014"){
    if(["cleric","druid","wizard"].includes(key)) return Math.max(1,level+castingMod);
    if(key==="paladin") return Math.max(1,Math.floor(level/2)+castingMod);
    return null;
  }
  const fixed:Record<string,number[]> = {
    bard:[0,4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
    cleric:[0,4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,20,21,22,22,22],
    druid:[0,4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,20,21,22,22,22],
    ranger:[0,0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11],
    sorcerer:[0,2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
    warlock:[0,2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
    wizard:[0,4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,20,21,22,22,22],
  };
  if(key==="paladin") return Math.max(1,Math.floor(level/2)+castingMod);
  return fixed[key]?.[level]??null;
}
