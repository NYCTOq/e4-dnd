import type { AbilityKey, Character, CharacterDraft } from "./character.types";
import { getAbilityModifier, getProficiencyBonus, getSpellAttackBonus, getSpellSaveDc } from "./characterCalculator";
import type { DndItemData, RulesetData } from "../rulesets/ruleset.types";
import { getFeatRuntime } from "../rulesets/featRuntimeRules";
import { getPassiveScore, getSavingThrowBonus, getSkillBonus, SKILL_ABILITIES } from "../rulesets/characterSheetRules";
import { getAttunedMagicItemBonuses } from "../rulesets/magicItemRules";
import { getMulticlassAttacksPerAction, normalizeClassLevels } from "../rulesets/multiclassRules";
import { getAttacksPerAction } from "../rulesets/actionEconomyRules";

export type JourneyCharacter = Pick<Character,
  "abilities"|"armorClass"|"armorClassMode"|"equippedArmorId"|"equippedShieldId"|"equippedWeaponIds"|"fightingStyleIds"|"inventory"|"level"|"className"|"classLevels"|"ruleset"|"race"|"background"|"featIds"|"skillProficiencies"|"expertiseSkills"|"resources"
> & Partial<Pick<Character,"subrace">>;

export function getCharacterSpellcastingAbility(character: Pick<Character,"className">, rulesetData?: RulesetData|null): AbilityKey {
  return rulesetData?.classes.find(item=>item.name===character.className)?.spellcastingAbility
    ?? (["Wizard","Artificer"].includes(character.className)?"int":["Bard","Paladin","Sorcerer","Warlock"].includes(character.className)?"cha":"wis");
}

export function calculateJourneyArmorClass(character: JourneyCharacter, items: DndItemData[] = []): number {
  if (character.armorClassMode !== "auto") return character.armorClass;
  const itemMap=new Map(items.map(item=>[item.id,item]));
  const armor=character.equippedArmorId?itemMap.get(character.equippedArmorId):null;
  const shield=character.equippedShieldId?itemMap.get(character.equippedShieldId):null;
  const dex=getAbilityModifier(character.abilities.dex);
  let ac=10+dex;
  if(armor?.category==="armor"&&armor.armorClass){
    ac=armor.armorType==="heavy"?armor.armorClass:armor.armorType==="medium"?armor.armorClass+Math.min(armor.dexBonusMax??2,dex):armor.armorClass+dex;
  }
  if(shield?.category==="shield") ac+=shield.armorClassBonus??2;
  if(armor?.category==="armor"&&character.fightingStyleIds?.includes("defense")) ac+=1;
  ac+=getAttunedMagicItemBonuses(character.inventory??[],items).armorClass;
  return ac;
}

export function getCharacterJourneySnapshot(character: JourneyCharacter, rulesetData: RulesetData|null) {
  const pb=getProficiencyBonus(character.level);
  const feats=(rulesetData?.feats??[]).filter(feat=>character.featIds.includes(feat.id)).map(feat=>feat.name);
  const background=rulesetData?.backgrounds.find(item=>item.name===character.background);
  if(background?.originFeat) feats.push(background.originFeat);
  const featRuntime=getFeatRuntime(feats,character.level,character.ruleset);
  const race=rulesetData?.races.find(item=>item.name===character.race);
  const spellcastingAbility=getCharacterSpellcastingAbility(character,rulesetData);
  const classLevels=normalizeClassLevels(character.classLevels,character.className,character.level);
  const skills=Object.fromEntries(Object.keys(SKILL_ABILITIES).map(skill=>[skill,getSkillBonus(character as Character,skill)]));
  const saves=Object.fromEntries((Object.keys(character.abilities) as AbilityKey[]).map(ability=>[ability,getSavingThrowBonus(character as Character,ability,rulesetData)]));
  return {
    proficiencyBonus:pb,
    armorClass:calculateJourneyArmorClass(character,rulesetData?.items??[]),
    initiative:getAbilityModifier(character.abilities.dex)+featRuntime.alertInitiativeBonus,
    speed:(race?.speed??30)+featRuntime.speedBonus,
    passivePerception:getPassiveScore(character as Character,"Perception")+featRuntime.passivePerceptionBonus,
    spellcastingAbility,
    spellSaveDc:getSpellSaveDc(character as Character,spellcastingAbility),
    spellAttackBonus:getSpellAttackBonus(character as Character,spellcastingAbility),
    attacksPerAction:Math.max(getAttacksPerAction(character.className,character.level),getMulticlassAttacksPerAction(classLevels)),
    skills,
    saves,
    resources:Object.fromEntries((character.resources??[]).map(resource=>[resource.id,{max:resource.max,used:resource.used,remaining:Math.max(0,resource.max-resource.used),recovery:resource.recovery}]))
  };
}

export function compareJourneySnapshots(...snapshots: ReturnType<typeof getCharacterJourneySnapshot>[]) {
  if(snapshots.length<2) return {consistent:true,differences:[] as string[]};
  const baseline=JSON.stringify(snapshots[0]);
  return {consistent:snapshots.every(snapshot=>JSON.stringify(snapshot)===baseline),differences:snapshots.flatMap((snapshot,index)=>JSON.stringify(snapshot)===baseline?[]:[`snapshot-${index+1}`])};
}

export type JourneyDraft = CharacterDraft;
