import type { AbilityKey, Character } from "../../core/character/character.types";
import type { DndItemData, RulesetData } from "../../core/rulesets/ruleset.types";
import {
  certifiedAbilityModifier,
  certifiedProficiencyBonus,
} from "./abilityProficiencyOracle";
import { SKILL_ABILITIES } from "../../core/rulesets/characterSheetRules";

export type CharacterDerivedStatsOracleSnapshot = {
  proficiencyBonus: number;
  armorClass: number;
  initiative: number;
  speed: number;
  passivePerception: number;
  spellcastingAbility: AbilityKey;
  spellSaveDc: number;
  spellAttackBonus: number;
  skills: Record<string, number>;
  saves: Record<AbilityKey, number>;
};

function selectedFeatNames(character: Character, data: RulesetData | null) {
  const names = (data?.feats ?? [])
    .filter((feat) => character.featIds.includes(feat.id))
    .map((feat) => feat.name);
  const originFeat = data?.backgrounds.find((entry) => entry.name === character.background)?.originFeat;
  if (originFeat) names.push(originFeat);
  return new Set(names.map((name) => name.toLowerCase()));
}

function attunedBonus(character: Character, items: readonly DndItemData[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return character.inventory
    .filter((entry) => entry.attuned)
    .reduce((sum, entry) => sum + (itemMap.get(entry.itemId)?.armorBonus ?? 0), 0);
}

function oracleArmorClass(character: Character, items: readonly DndItemData[]) {
  if (character.armorClassMode !== "auto") return character.armorClass;
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const armor = character.equippedArmorId ? itemMap.get(character.equippedArmorId) : null;
  const shield = character.equippedShieldId ? itemMap.get(character.equippedShieldId) : null;
  const dexterity = certifiedAbilityModifier(character.abilities.dex);
  let armorClass = 10 + dexterity;
  if (armor?.category === "armor" && armor.armorClass) {
    if (armor.armorType === "heavy") armorClass = armor.armorClass;
    else if (armor.armorType === "medium") {
      armorClass = armor.armorClass + Math.min(armor.dexBonusMax ?? 2, dexterity);
    } else armorClass = armor.armorClass + dexterity;
  }
  if (shield?.category === "shield") armorClass += shield.armorClassBonus ?? 2;
  if (armor?.category === "armor" && character.fightingStyleIds?.includes("defense")) armorClass += 1;
  return armorClass + attunedBonus(character, items);
}

function oracleSpellcastingAbility(character: Character, data: RulesetData | null): AbilityKey {
  return data?.classes.find((entry) => entry.name === character.className)?.spellcastingAbility
    ?? (["Wizard", "Artificer"].includes(character.className)
      ? "int"
      : ["Bard", "Paladin", "Sorcerer", "Warlock"].includes(character.className)
        ? "cha"
        : "wis");
}

export function buildCharacterDerivedStatsOracle(
  character: Character,
  data: RulesetData | null,
): CharacterDerivedStatsOracleSnapshot {
  const proficiencyBonus = certifiedProficiencyBonus(character.level);
  const feats = selectedFeatNames(character, data);
  const classData = data?.classes.find((entry) => entry.name === character.className);
  const items = data?.items ?? [];
  const savingThrowItemBonus = attunedBonus(character, items);
  const spellcastingAbility = oracleSpellcastingAbility(character, data);
  const skill = (name: string) => {
    const ability = SKILL_ABILITIES[name] ?? "wis";
    const proficient = character.skillProficiencies.includes(name);
    const expertise = character.expertiseSkills.includes(name);
    const jackOfAllTrades = character.className.toLowerCase() === "bard" && character.level >= 2 && !proficient;
    const training = expertise ? proficiencyBonus * 2 : proficient ? proficiencyBonus : jackOfAllTrades ? Math.floor(proficiencyBonus / 2) : 0;
    return certifiedAbilityModifier(character.abilities[ability]) + training;
  };
  const skills = Object.fromEntries(Object.keys(SKILL_ABILITIES).map((name) => [name, skill(name)]));
  const saves = Object.fromEntries(
    (Object.keys(character.abilities) as AbilityKey[]).map((ability) => [
      ability,
      certifiedAbilityModifier(character.abilities[ability])
        + (classData?.savingThrows.includes(ability) ? proficiencyBonus : 0)
        + savingThrowItemBonus,
    ]),
  ) as Record<AbilityKey, number>;
  const initiativeBonus = feats.has("alert")
    ? character.ruleset === "dnd_2024" ? proficiencyBonus : 5
    : 0;
  const passiveBonus = feats.has("observant") ? 5 : 0;
  const speedBonus = feats.has("mobile") ? 10 : 0;
  const castingModifier = certifiedAbilityModifier(character.abilities[spellcastingAbility]);

  return {
    proficiencyBonus,
    armorClass: oracleArmorClass(character, items),
    initiative: certifiedAbilityModifier(character.abilities.dex) + initiativeBonus,
    speed: (data?.races.find((entry) => entry.name === character.race)?.speed ?? 30) + speedBonus,
    passivePerception: 10 + skill("Perception") + passiveBonus,
    spellcastingAbility,
    spellSaveDc: 8 + proficiencyBonus + castingModifier,
    spellAttackBonus: proficiencyBonus + castingModifier,
    skills,
    saves,
  };
}
