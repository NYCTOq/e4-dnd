import type { AbilityKey, Character } from "../../core/character/character.types";
import { getAbilityModifier } from "../../core/character/characterCalculator";
import { normalizeHitDice, normalizeSpellSlots } from "./characterShared";
import type { DndClassData } from "../../core/rulesets/ruleset.types";
import { getClassResources, mergeClassResources } from "../../core/rulesets/classFeatureEngine";
import { getClassSpellSlots } from "../../core/rulesets/spellcastingRules";

export type LevelUpAsiMode = "none" | "plus-two" | "split";

export type LevelUpOptions = {
  hpGain: number;
  hitDie: number;
  asiMode: LevelUpAsiMode;
  primaryAbility: AbilityKey;
  secondaryAbility: AbilityKey;
  updatedAt?: string;
  classData?: DndClassData | null;
};

export function isAsiMilestone(level: number, className = ""): boolean {
  const levels=[4,8,12,16,19]; const key=className.toLowerCase();
  if(key==="fighter") levels.push(6,14); if(key==="rogue") levels.push(10);
  return levels.includes(level);
}

export function getAverageHpGain(hitDie: number, constitutionScore: number): number {
  const safeHitDie = Math.max(2, Math.floor(hitDie));
  return Math.max(1, Math.floor(safeHitDie / 2) + 1 + getAbilityModifier(constitutionScore));
}

export function applyAbilityIncrease(
  abilities: Character["abilities"],
  nextLevel: number,
  asiMode: LevelUpAsiMode,
  primaryAbility: AbilityKey,
  secondaryAbility: AbilityKey,
  className = "",
): Character["abilities"] {
  if (!isAsiMilestone(nextLevel, className) || asiMode === "none") {
    return { ...abilities };
  }

  const nextAbilities = { ...abilities };

  if (asiMode === "plus-two") {
    nextAbilities[primaryAbility] = Math.min(20, nextAbilities[primaryAbility] + 2);
    return nextAbilities;
  }

  nextAbilities[primaryAbility] = Math.min(20, nextAbilities[primaryAbility] + 1);
  nextAbilities[secondaryAbility] = Math.min(20, nextAbilities[secondaryAbility] + 1);
  return nextAbilities;
}

export function buildLeveledCharacter(
  character: Character,
  options: LevelUpOptions,
): Character {
  if (character.level >= 20) {
    return character;
  }

  const nextLevel = Math.min(20, character.level + 1);
  const hpGain = Math.max(1, Math.floor(options.hpGain || 1));
  const nextMaxHp = character.maxHp + hpGain;
  const nextAbilities = applyAbilityIncrease(character.abilities,nextLevel,options.asiMode,options.primaryAbility,options.secondaryAbility,character.className);
  const progressionSlots=getClassSpellSlots(options.classData??null,nextLevel);
  const currentSlotMap=new Map(character.spellSlots.map(slot=>[slot.level,slot]));
  const nextSlots=progressionSlots.length ? progressionSlots.map(slot=>({...slot,used:Math.min(slot.max,currentSlotMap.get(slot.level)?.used??0)})) : normalizeSpellSlots(character.spellSlots,nextLevel,character.className);

  return {
    ...character,
    level: nextLevel,
    abilities: nextAbilities,
    maxHp: nextMaxHp,
    currentHp: Math.min(nextMaxHp, character.currentHp + hpGain),
    spellSlots: nextSlots,
    hitDice: normalizeHitDice(character.hitDice, nextLevel, character.className, options.hitDie),
    resources: mergeClassResources(character.resources,getClassResources(character.className,nextLevel,nextAbilities,character.ruleset)),
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  };
}
