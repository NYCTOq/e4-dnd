import type { AbilityScores, RulesetId } from "../character/character.types";
import type { DndClassData, DndSpellData } from "./ruleset.types";

export type SpellcastingProfile = {
  cantripLimit: number; knownSpellLimit: number | null; preparedSpellLimit: number | null;
  ritualCasting: boolean; pactMagic: boolean;
};
const mod = (score:number) => Math.floor((score - 10) / 2);
const cantripBase:Record<string,[number,number,number]> = {
  bard:[2,3,4], cleric:[3,4,5], druid:[2,3,4], sorcerer:[4,5,6], warlock:[2,3,4], wizard:[3,4,5],
};
const knownBase:Record<string,number[]> = {
  bard:[0,4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
  sorcerer:[0,2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
  warlock:[0,2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
  ranger:[0,0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11],
};

export function getSpellcastingProfile(classData:DndClassData|null, level:number, abilities:AbilityScores, ruleset:RulesetId):SpellcastingProfile {
  if (!classData || classData.spellProgression === "none") return {cantripLimit:0,knownSpellLimit:0,preparedSpellLimit:0,ritualCasting:false,pactMagic:false};
  const key=classData.name.toLowerCase(); const safe=Math.max(1,Math.min(20,Math.floor(level)));
  const base=cantripBase[key]; const cantripLimit=base ? (safe>=10?base[2]:safe>=4?base[1]:base[0]) : 0;
  const ability=classData.spellcastingAbility ? abilities[classData.spellcastingAbility] : 10;
  let preparedSpellLimit:number|null=null; let knownSpellLimit:number|null=knownBase[key]?.[safe] ?? null;
  if (["cleric","druid","wizard"].includes(key)) preparedSpellLimit=Math.max(1,safe+mod(ability));
  if (key==="paladin") preparedSpellLimit=Math.max(1,Math.floor(safe/2)+mod(ability));
  if (ruleset==="dnd_2024" && ["bard","ranger","sorcerer","warlock"].includes(key)) knownSpellLimit=null;
  return { cantripLimit, knownSpellLimit, preparedSpellLimit, ritualCasting:["bard","cleric","druid","wizard"].includes(key), pactMagic:classData.spellProgression==="pact" };
}

export function canSelectKnownSpell(spell:DndSpellData, known:DndSpellData[], profile:SpellcastingProfile) {
  if (spell.level===0) return known.filter(item=>item.level===0).length < profile.cantripLimit;
  return profile.knownSpellLimit===null || known.filter(item=>item.level>0).length < profile.knownSpellLimit;
}
export function canPrepareSpell(spell:DndSpellData, preparedIds:string[], profile:SpellcastingProfile) {
  return spell.level===0 || profile.preparedSpellLimit===null || preparedIds.length < profile.preparedSpellLimit;
}
export function canRitualCast(spell:DndSpellData, profile:SpellcastingProfile, knownIds:string[]) {
  return spell.ritual && profile.ritualCasting && knownIds.includes(spell.id);
}
export function getClassSpellSlots(classData:DndClassData|null, level:number) {
  const row=classData?.levels.find(item=>item.level===Math.max(1,Math.min(20,Math.floor(level))));
  if (row?.pactMagic) return [{level:row.pactMagic.slotLevel,max:row.pactMagic.slots,used:0}];
  return (row?.spellSlots??[]).map((max,index)=>({level:index+1,max,used:0})).filter(slot=>slot.max>0);
}
