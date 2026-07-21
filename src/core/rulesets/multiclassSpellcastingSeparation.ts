import type { AbilityKey, Character, CharacterClassLevel } from "../character/character.types";
import type { DndClassData, DndSpellData, RulesetData } from "./ruleset.types";
import { getSpellAttackBonus, getSpellSaveDc } from "../character/characterCalculator";
import { normalizeClassLevels } from "./multiclassRules";

export type CharacterSpellSource = {
  className: string;
  spellcastingAbility: AbilityKey;
  spellListClass: string;
  explicit: boolean;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function getClassData(className: string, rulesetData?: RulesetData | null): DndClassData | null {
  const normalized = normalizeName(className);
  return rulesetData?.classes.find((item) => normalizeName(item.name) === normalized) ?? null;
}

function getLevelEntry(character: Pick<Character, "classLevels" | "className" | "level" | "subclass">, className: string): CharacterClassLevel | null {
  const levels = normalizeClassLevels(character.classLevels, character.className, character.level);
  const normalized = normalizeName(className);
  const entry = levels.find((item) => normalizeName(item.className) === normalized);
  if (!entry) return null;
  return { ...entry, subclass: entry.subclass ?? (normalizeName(character.className) === normalized ? character.subclass : undefined) };
}

export function getClassSpellcastingAbility(
  character: Pick<Character, "classLevels" | "className" | "level" | "subclass">,
  className: string,
  rulesetData?: RulesetData | null,
): AbilityKey | null {
  const classData = getClassData(className, rulesetData);
  if (classData?.spellcastingAbility) return classData.spellcastingAbility;

  const entry = getLevelEntry(character, className);
  const subclass = normalizeName(entry?.subclass ?? "");
  if ((normalizeName(className) === "fighter" && subclass === "eldritch knight") ||
      (normalizeName(className) === "rogue" && subclass === "arcane trickster")) {
    return "int";
  }
  return null;
}

export function getCharacterSpellcastingClasses(
  character: Pick<Character, "classLevels" | "className" | "level" | "subclass">,
  rulesetData?: RulesetData | null,
): CharacterSpellSource[] {
  const levels = normalizeClassLevels(character.classLevels, character.className, character.level);
  return levels.flatMap((entry) => {
    const ability = getClassSpellcastingAbility(character, entry.className, rulesetData);
    if (!ability) return [];
    const subclass = normalizeName(entry.subclass ?? (normalizeName(entry.className) === normalizeName(character.className) ? character.subclass : ""));
    const thirdCaster = (normalizeName(entry.className) === "fighter" && subclass === "eldritch knight") ||
      (normalizeName(entry.className) === "rogue" && subclass === "arcane trickster");
    return [{
      className: entry.className,
      spellcastingAbility: ability,
      spellListClass: thirdCaster ? "wizard" : normalizeName(entry.className),
      explicit: false,
    }];
  });
}

export function getSpellSource(
  character: Pick<Character, "classLevels" | "className" | "level" | "subclass" | "spellSources">,
  spell: Pick<DndSpellData, "id" | "classes">,
  rulesetData?: RulesetData | null,
): CharacterSpellSource | null {
  const available = getCharacterSpellcastingClasses(character, rulesetData);
  const explicitClass = character.spellSources?.[spell.id];
  if (explicitClass) {
    const matched = available.find((entry) => normalizeName(entry.className) === normalizeName(explicitClass));
    if (matched) return { ...matched, explicit: true };
  }

  const spellClasses = new Set(spell.classes.map(normalizeName));
  const eligible = available.filter((entry) => spellClasses.has(entry.spellListClass));
  if (eligible.length === 1) return eligible[0];
  if (eligible.length > 1) {
    return eligible.find((entry) => normalizeName(entry.className) === normalizeName(character.className)) ?? eligible[0];
  }
  return available.length === 1 ? available[0] : null;
}

export function getSpellcastingStatsForClass(
  character: Character,
  className: string,
  rulesetData?: RulesetData | null,
) {
  const ability = getClassSpellcastingAbility(character, className, rulesetData);
  if (!ability) return null;
  return {
    className,
    ability,
    saveDc: getSpellSaveDc(character, ability),
    attackBonus: getSpellAttackBonus(character, ability),
  };
}

export function getSpellcastingStatsForSpell(
  character: Character,
  spell: DndSpellData,
  rulesetData?: RulesetData | null,
) {
  const source = getSpellSource(character, spell, rulesetData);
  if (!source) return null;
  return {
    ...source,
    saveDc: getSpellSaveDc(character, source.spellcastingAbility),
    attackBonus: getSpellAttackBonus(character, source.spellcastingAbility),
  };
}

export function getClassSpellIds(character: Pick<Character, "knownSpellIds" | "preparedSpellIds" | "classKnownSpellIds" | "classPreparedSpellIds">, className: string) {
  const key = normalizeName(className);
  return {
    known: character.classKnownSpellIds?.[key] ?? character.knownSpellIds,
    prepared: character.classPreparedSpellIds?.[key] ?? character.preparedSpellIds,
  };
}
