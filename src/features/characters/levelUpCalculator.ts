import type { AbilityKey, Character } from "../../core/character/character.types";
import { getAbilityModifier } from "../../core/character/characterCalculator";
import { normalizeHitDice, normalizeSpellSlots } from "./characterShared";

export type LevelUpAsiMode = "none" | "plus-two" | "split";

export type LevelUpOptions = {
  hpGain: number;
  hitDie: number;
  asiMode: LevelUpAsiMode;
  primaryAbility: AbilityKey;
  secondaryAbility: AbilityKey;
  updatedAt?: string;
};

export function isAsiMilestone(level: number): boolean {
  return [4, 8, 12, 16, 19].includes(level);
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
): Character["abilities"] {
  if (!isAsiMilestone(nextLevel) || asiMode === "none") {
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

  return {
    ...character,
    level: nextLevel,
    abilities: applyAbilityIncrease(
      character.abilities,
      nextLevel,
      options.asiMode,
      options.primaryAbility,
      options.secondaryAbility,
    ),
    maxHp: nextMaxHp,
    currentHp: Math.min(nextMaxHp, character.currentHp + hpGain),
    spellSlots: normalizeSpellSlots(character.spellSlots, nextLevel, character.className),
    hitDice: normalizeHitDice(character.hitDice, nextLevel, character.className, options.hitDie),
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  };
}

