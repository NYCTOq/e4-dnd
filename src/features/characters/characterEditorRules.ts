import type { Character, CharacterDraft } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { buildFinalSkillProficiencies, normalizeExpertise, getExpertiseLimit } from "../../core/rulesets/proficiencyRules";
import { getAlwaysPreparedSpells } from "../../core/rulesets/subclassRules";
import { getHighestSpellLevel } from "../../core/rulesets/spellRules";
import { calculateEffectiveArmorClass, normalizeHitDice, normalizeSpellSlots } from "./characterShared";

export function characterToEditDraft(character: Character): CharacterDraft {
  return {
    name: character.name, playerName: character.playerName, ruleset: character.ruleset,
    race: character.race, subrace: character.subrace, className: character.className,
    classLevels: character.classLevels?.map((entry) => ({ ...entry })), subclass: character.subclass,
    background: character.background, originAbilityPrimary: character.originAbilityPrimary,
    originAbilitySecondary: character.originAbilitySecondary, featIds: [...(character.featIds ?? [])],
    fightingStyleIds: [...(character.fightingStyleIds ?? [])], masteredWeaponIds: [...(character.masteredWeaponIds ?? [])],
    metamagicIds: [...(character.metamagicIds ?? [])], invocationIds: [...(character.invocationIds ?? [])],
    wildShapeFormIds: [...(character.wildShapeFormIds ?? [])], maneuverIds: [...(character.maneuverIds ?? [])],
    companionId: character.companionId, companionCurrentHp: character.companionCurrentHp,
    arcanumSpellIds: [...(character.arcanumSpellIds ?? [])], usedArcanumSpellIds: [...(character.usedArcanumSpellIds ?? [])],
    activeSpellEffects: (character.activeSpellEffects ?? []).map((effect) => ({ ...effect })),
    skillProficiencies: [...(character.skillProficiencies ?? [])], expertiseSkills: [...(character.expertiseSkills ?? [])],
    toolProficiencies: [...(character.toolProficiencies ?? [])], languages: [...(character.languages ?? [])],
    level: character.level, abilities: { ...character.abilities }, maxHp: character.maxHp,
    armorClass: character.armorClass, armorClassMode: character.armorClassMode === "auto" ? "auto" : "manual",
    knownSpellIds: [...(character.knownSpellIds ?? [])], preparedSpellIds: [...(character.preparedSpellIds ?? [])],
    spellSlots: character.spellSlots.map((slot) => ({ ...slot })), pactMagicSlots: character.pactMagicSlots?.map((slot) => ({ ...slot })),
    inventory: character.inventory.map((entry) => ({ ...entry })), equippedArmorId: character.equippedArmorId ?? null,
    equippedShieldId: character.equippedShieldId ?? null, equippedWeaponIds: [...(character.equippedWeaponIds ?? [])],
    gold: character.gold ?? 0, deathSaves: { ...(character.deathSaves ?? { successes: 0, failures: 0 }) },
    hitDice: character.hitDice.map((pool) => ({ ...pool })), exhaustion: character.exhaustion ?? 0,
    conditionDurations: { ...(character.conditionDurations ?? {}) }, notes: character.notes,
  };
}

export function buildEditedCharacter(character: Character, draft: CharacterDraft, rulesetData: RulesetData | null): Character {
  const classData = rulesetData?.classes.find((item) => item.name === draft.className) ?? null;
  const background = rulesetData?.backgrounds.find((item) => item.name === draft.background) ?? null;
  const subclass = rulesetData?.subclasses.find((item) => item.name === draft.subclass && item.className === draft.className) ?? null;
  const alwaysPrepared = getAlwaysPreparedSpells(subclass, getHighestSpellLevel(classData ?? undefined, draft.level), rulesetData?.spells ?? []);
  const knownSpellIds = [...new Set([...draft.knownSpellIds, ...alwaysPrepared.map((spell) => spell.id)])];
  const preparedSpellIds = [...new Set([...draft.preparedSpellIds, ...alwaysPrepared.map((spell) => spell.id)])];
  const skillProficiencies = buildFinalSkillProficiencies(draft.skillProficiencies, classData, background);
  const multiclass = (draft.classLevels?.length ?? 0) > 1;
  return {
    ...character, ...draft, knownSpellIds, preparedSpellIds, skillProficiencies,
    expertiseSkills: normalizeExpertise(draft.expertiseSkills, skillProficiencies, getExpertiseLimit(draft.className, draft.level)),
    armorClass: calculateEffectiveArmorClass(draft, rulesetData?.items),
    currentHp: Math.min(character.currentHp, draft.maxHp),
    spellSlots: multiclass ? draft.spellSlots : normalizeSpellSlots(draft.spellSlots, draft.level, draft.className),
    hitDice: multiclass ? draft.hitDice : normalizeHitDice(draft.hitDice, draft.level, draft.className, classData?.hitDie),
    updatedAt: new Date().toISOString(),
  };
}
