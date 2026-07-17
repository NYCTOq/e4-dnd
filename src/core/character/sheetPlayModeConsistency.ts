import type { AbilityKey, Character } from "./character.types";
import { getAbilityModifier, getProficiencyBonus } from "./characterCalculator";
import type { DndItemData, RulesetData } from "../rulesets/ruleset.types";
import { getCharacterJourneySnapshot, type JourneyCharacter } from "./playerJourneyConsistency";
import { getAncestryRuntime } from "../rulesets/ancestryRuntimeRules";
import { getFightingStyles } from "../rulesets/fightingStyleRules";

export type WeaponConsistencyRow = {
  itemId: string;
  name: string;
  attackAbility: AbilityKey;
  attackBonus: number;
  damage: string;
  damageBonus: number;
  damageType: string | null;
  range: string | null;
};

const hasProperty=(item:DndItemData,value:string)=>item.properties?.some(property=>property.toLowerCase().includes(value))??false;

function getWeaponAbility(character: Pick<Character,"abilities">, item:DndItemData):AbilityKey{
  const ranged=Boolean(item.range)||hasProperty(item,"ammunition");
  if(ranged)return "dex";
  if(hasProperty(item,"finesse")&&character.abilities.dex>character.abilities.str)return "dex";
  return "str";
}

export function getWeaponConsistencyRows(character: JourneyCharacter, items:DndItemData[]):WeaponConsistencyRow[]{
  const itemMap=new Map(items.map(item=>[item.id,item]));
  const styles=getFightingStyles(character.ruleset).filter(style=>character.fightingStyleIds?.includes(style.id));
  return (character.equippedWeaponIds??[]).map(id=>itemMap.get(id)).filter((item):item is DndItemData=>item?.category==="weapon").map(item=>{
    const ability=getWeaponAbility(character as Character,item);
    const ranged=ability==="dex"&&(Boolean(item.range)||hasProperty(item,"ammunition"));
    const archery=ranged?(styles.find(style=>style.id==="archery")?.attackBonus??0):0;
    const oneHanded=!hasProperty(item,"two-handed")&&!hasProperty(item,"two handed");
    const dueling=oneHanded?(styles.find(style=>style.id==="dueling")?.damageBonus??0):0;
    const thrown=hasProperty(item,"thrown")?(styles.find(style=>style.id==="thrown-weapon-fighting")?.damageBonus??0):0;
    return {
      itemId:item.id,
      name:item.name,
      attackAbility:ability,
      attackBonus:getAbilityModifier(character.abilities[ability])+getProficiencyBonus(character.level)+(item.attackBonus??0)+archery,
      damage:item.damage??"—",
      damageBonus:getAbilityModifier(character.abilities[ability])+(item.damageBonus??0)+dueling+thrown,
      damageType:item.damageType??null,
      range:item.range??null,
    };
  });
}

export function getSheetPlayModeConsistencySnapshot(character:Character,rulesetData:RulesetData|null){
  const journey=getCharacterJourneySnapshot(character,rulesetData);
  const ancestry=getAncestryRuntime(rulesetData?.races.find(race=>race.name===character.race),character.subrace,character.level);
  const itemMap=new Map((rulesetData?.items??[]).map(item=>[item.id,item]));
  const itemResistances=character.inventory.filter(entry=>entry.attuned).map(entry=>itemMap.get(entry.itemId)?.resistanceDamageType).filter((value):value is string=>Boolean(value));
  const activeEffects=character.activeSpellEffects??[];
  const concentrationEffects=activeEffects.filter(effect=>effect.concentration);
  return {
    ...journey,
    hitPoints:{current:character.currentHp,max:character.maxHp,temp:character.tempHp},
    weapons:getWeaponConsistencyRows(character,rulesetData?.items??[]),
    damageResistances:[...new Set([...ancestry.damageResistances,...itemResistances.map(value=>value.toLowerCase())])].sort(),
    conditions:[...character.conditions].sort(),
    activeEffects:activeEffects.map(effect=>({id:effect.id,spellId:effect.spellId,remainingRounds:effect.remainingRounds,concentration:effect.concentration})).sort((a,b)=>a.id.localeCompare(b.id)),
    concentration:{active:concentrationEffects.length>0,effectIds:concentrationEffects.map(effect=>effect.id).sort(),valid:concentrationEffects.length<=1},
    spellSlots:character.spellSlots.map(slot=>({level:slot.level,max:slot.max,used:slot.used,remaining:Math.max(0,slot.max-slot.used)})),
    pactMagicSlots:(character.pactMagicSlots??[]).map(slot=>({level:slot.level,max:slot.max,used:slot.used,remaining:Math.max(0,slot.max-slot.used)})),
    deathSaves:{...character.deathSaves},
    exhaustion:character.exhaustion,
  };
}

export function compareSheetAndPlayMode(character:Character,rulesetData:RulesetData|null,sheetSnapshot?:ReturnType<typeof getSheetPlayModeConsistencySnapshot>,playSnapshot?:ReturnType<typeof getSheetPlayModeConsistencySnapshot>){
  const expected=getSheetPlayModeConsistencySnapshot(character,rulesetData);
  const sheet=sheetSnapshot??expected;
  const play=playSnapshot??expected;
  const keys=Object.keys(expected) as Array<keyof typeof expected>;
  const differences=keys.filter(key=>JSON.stringify(sheet[key])!==JSON.stringify(play[key]));
  const blockers=[...differences.map(key=>`Character Sheet ve Play Mode ${String(key)} değeri farklı.`),...(expected.concentration.valid?[]:["Birden fazla concentration effect aynı anda aktif."])];
  return {consistent:blockers.length===0,differences,blockers,score:Math.max(0,100-blockers.length*15)};
}
