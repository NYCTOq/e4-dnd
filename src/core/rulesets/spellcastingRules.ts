import type { AbilityScores, RulesetId } from "../character/character.types";
import type { DndClassData, DndSpellData } from "./ruleset.types";
import { getBardCantripCount, getBardSpellLimit } from "./bardRules";
import { getClericCantripCount, getClericPreparedSpellLimit } from "./clericRules";
import { getDruidCantripCount, getDruidPreparedSpellLimit } from "./druidRules";
import { getPaladinPreparedSpellLimit } from "./paladinRules";
import { getRangerPreparedSpellLimit } from "./rangerRules";
import { getSorcererCantripCount, getSorcererPreparedSpellLimit } from "./sorcererRules";
import { getWarlockCantripCount, getWarlockPreparedSpellLimit } from "./warlockRules";
import { getWizardCantripCount, getWizardPreparedSpellLimit } from "./wizardRules";

export type RitualCastingMode = "none" | "known" | "prepared";

export type SpellcastingProfile = {
  cantripLimit: number; knownSpellLimit: number | null; preparedSpellLimit: number | null;
  ritualCasting: boolean; ritualMode: RitualCastingMode; pactMagic: boolean;
  spellListClass: string | null; maxSpellLevel: number;
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

const THIRD_CASTER_KNOWN = [0,0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13] as const;

function getThirdCasterProfile(level:number, subclassName:string, ruleset:RulesetId):SpellcastingProfile|null {
  const safe=Math.max(1,Math.min(20,Math.floor(level)));
  const normalized=subclassName.trim().toLowerCase();
  if (normalized!=="arcane trickster" && normalized!=="eldritch knight") return null;
  if (safe<3) return {cantripLimit:0,knownSpellLimit:0,preparedSpellLimit:0,ritualCasting:false,ritualMode:"none",pactMagic:false,spellListClass:"wizard",maxSpellLevel:0};
  const cantripLimit=normalized==="arcane trickster"?(safe>=10?4:3):(safe>=10?3:2);
  const maxSpellLevel=safe>=19?4:safe>=13?3:safe>=7?2:1;
  const spellCount=THIRD_CASTER_KNOWN[safe];
  return ruleset === "dnd_2024"
    ? {cantripLimit,knownSpellLimit:null,preparedSpellLimit:spellCount,ritualCasting:true,ritualMode:"prepared",pactMagic:false,spellListClass:"wizard",maxSpellLevel}
    : {cantripLimit,knownSpellLimit:spellCount,preparedSpellLimit:null,ritualCasting:false,ritualMode:"none",pactMagic:false,spellListClass:"wizard",maxSpellLevel};
}

export function getSpellcastingProfile(classData:DndClassData|null, level:number, abilities:AbilityScores, ruleset:RulesetId, subclassName=""):SpellcastingProfile {
  const thirdCaster=getThirdCasterProfile(level,subclassName,ruleset);
  if (thirdCaster) return thirdCaster;
  if (!classData || classData.spellProgression === "none") return {cantripLimit:0,knownSpellLimit:0,preparedSpellLimit:0,ritualCasting:false,ritualMode:"none",pactMagic:false,spellListClass:null,maxSpellLevel:0};
  const key=classData.name.toLowerCase(); const safe=Math.max(1,Math.min(20,Math.floor(level)));
  const base=cantripBase[key]; const cantripLimit=key === "bard" ? getBardCantripCount(safe) : key === "cleric" ? getClericCantripCount(safe) : key === "druid" ? getDruidCantripCount(safe,ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014") : key === "sorcerer" ? getSorcererCantripCount(safe,ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014") : key === "warlock" ? getWarlockCantripCount(safe) : key === "wizard" ? getWizardCantripCount(safe) : base ? (safe>=10?base[2]:safe>=4?base[1]:base[0]) : 0;
  const ability=classData.spellcastingAbility ? abilities[classData.spellcastingAbility] : 10;
  let preparedSpellLimit:number|null=null; let knownSpellLimit:number|null=knownBase[key]?.[safe] ?? null;
  if (["cleric","druid","wizard"].includes(key)) preparedSpellLimit=Math.max(1,safe+mod(ability));
  if (key === "cleric" && ruleset === "dnd_2024") preparedSpellLimit=getClericPreparedSpellLimit(safe,"dnd_2024",mod(ability));
  if (key === "druid") preparedSpellLimit=getDruidPreparedSpellLimit(safe,ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014",mod(ability));
  if (key==="paladin") preparedSpellLimit=getPaladinPreparedSpellLimit(safe,ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014",mod(ability));
  if (key === "bard" && ruleset === "dnd_2024") { knownSpellLimit = null; preparedSpellLimit = getBardSpellLimit(safe, "dnd_2024"); }
  if (key === "ranger" && ruleset === "dnd_2024") { knownSpellLimit = null; preparedSpellLimit = getRangerPreparedSpellLimit(safe,"dnd_2024"); }
  if (key === "sorcerer" && ruleset === "dnd_2024") { knownSpellLimit=null; preparedSpellLimit=getSorcererPreparedSpellLimit(safe,"dnd_2024"); }
  if (key === "warlock" && ruleset === "dnd_2024") { knownSpellLimit=null; preparedSpellLimit=getWarlockPreparedSpellLimit(safe,"dnd_2024"); }
  if (key === "wizard" && ruleset === "dnd_2024") preparedSpellLimit=getWizardPreparedSpellLimit(safe,"dnd_2024",mod(ability));
  const row=classData.levels.find(item=>item.level===safe);
  const maxSpellLevel=row?.pactMagic?.slotLevel ?? Math.max(0,...(row?.spellSlots??[]).map((slots,index)=>slots>0?index+1:0));
  const ritualMode: RitualCastingMode = ruleset === "dnd_2024"
    ? "prepared"
    : key === "bard" || key === "wizard"
      ? "known"
      : key === "cleric" || key === "druid"
        ? "prepared"
        : "none";
  return { cantripLimit, knownSpellLimit, preparedSpellLimit, ritualCasting:ritualMode !== "none", ritualMode, pactMagic:classData.spellProgression==="pact", spellListClass:key, maxSpellLevel };
}

export function canSelectKnownSpell(spell:DndSpellData, known:DndSpellData[], profile:SpellcastingProfile) {
  if (spell.level===0) return known.filter(item=>item.level===0).length < profile.cantripLimit;
  return profile.knownSpellLimit===null || known.filter(item=>item.level>0).length < profile.knownSpellLimit;
}
export function canPrepareSpell(spell:DndSpellData, preparedIds:string[], profile:SpellcastingProfile) {
  return spell.level===0 || profile.preparedSpellLimit===null || preparedIds.length < profile.preparedSpellLimit;
}
export function canRitualCast(
  spell:DndSpellData,
  profile:SpellcastingProfile,
  knownIds:string[],
  preparedIds:string[] = [],
) {
  if (!spell.ritual || !profile.ritualCasting) return false;
  return profile.ritualMode === "known"
    ? knownIds.includes(spell.id)
    : profile.ritualMode === "prepared"
      ? preparedIds.includes(spell.id)
      : false;
}
export function getClassSpellSlots(classData:DndClassData|null, level:number) {
  const row=classData?.levels.find(item=>item.level===Math.max(1,Math.min(20,Math.floor(level))));
  if (row?.pactMagic) return [{level:row.pactMagic.slotLevel,max:row.pactMagic.slots,used:0}];
  return (row?.spellSlots??[]).map((max,index)=>({level:index+1,max,used:0})).filter(slot=>slot.max>0);
}
