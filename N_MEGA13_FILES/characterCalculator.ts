import type { AbilityKey, Character } from "./character.types";

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function getInitiative(character: Character): number {
  return getAbilityModifier(character.abilities.dex);
}

export function getPassivePerception(character: Character): number {
  return 10 + getAbilityModifier(character.abilities.wis);
}

const SPELLCASTING_ABILITY_BY_CLASS: Readonly<Record<string, AbilityKey>> = {
  bard: "cha",
  cleric: "wis",
  druid: "wis",
  paladin: "cha",
  ranger: "wis",
  sorcerer: "cha",
  warlock: "cha",
  wizard: "int",
};

export function getCharacterSpellcastingAbility(
  character: Pick<Character, "className">
): AbilityKey {
  return SPELLCASTING_ABILITY_BY_CLASS[character.className.trim().toLowerCase()] ?? "wis";
}

export function getSpellSaveDc(
  character: Character,
  ability: AbilityKey = getCharacterSpellcastingAbility(character)
): number {
  return 8 + getProficiencyBonus(character.level) + getAbilityModifier(character.abilities[ability]);
}

export function getSpellAttackBonus(
  character: Character,
  ability: AbilityKey = getCharacterSpellcastingAbility(character)
): number {
  return getProficiencyBonus(character.level) + getAbilityModifier(character.abilities[ability]);
}
