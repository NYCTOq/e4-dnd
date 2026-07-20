import type { Character, CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getFightingStyleChoiceCount, getFightingStyles } from "./fightingStyleRules";
import { getWeaponMastery, getWeaponMasteryChoiceCount } from "./equipmentRules";
import { getMetamagicChoiceCount, getMetamagicOptions } from "./metamagicRules";
import { getEldritchInvocations, getInvocationChoiceCount, isInvocationEligible } from "./invocationRules";
import { getWildShapeForms, getWildShapeKnownCount, isWildShapeFormEligible } from "./wildShapeRules";
import { getBattleMasterManeuvers, getManeuverChoiceCount } from "./maneuverRules";
import { getCompanionChoiceCount, getRangerCompanions } from "./companionRules";
import { getMysticArcanumLevels } from "./pactMagicRules";
import { getExpertiseLimit } from "./proficiencyRules";

export type UnifiedChoiceStep = "class" | "skills" | "feats" | "combat" | "equipment" | "spells";
export type UnifiedChoiceField =
  | "fightingStyleIds"
  | "masteredWeaponIds"
  | "metamagicIds"
  | "invocationIds"
  | "wildShapeFormIds"
  | "maneuverIds"
  | "expertiseSkills";

export type UnifiedChoiceOption = { id: string; name: string; detail?: string; group?: string };
export type UnifiedChoiceState = {
  id: string;
  label: string;
  step: UnifiedChoiceStep;
  kind: "single" | "multiple" | "grouped-single";
  field?: UnifiedChoiceField | "subclass" | "companionId" | "arcanumSpellIds";
  required: number;
  selected: string[];
  validSelected: string[];
  options: UnifiedChoiceOption[];
  complete: boolean;
  message: string;
};

type ChoiceCharacter = Character | CharacterDraft;

function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }
function makeState(input: Omit<UnifiedChoiceState, "complete" | "message">): UnifiedChoiceState {
  const complete = input.validSelected.length === input.required;
  return { ...input, complete, message: `${input.label}: ${input.validSelected.length}/${input.required} seçim tamamlandı.` };
}

export function getUnifiedCharacterChoices(character: ChoiceCharacter, rulesetData: RulesetData | null): UnifiedChoiceState[] {
  const states: UnifiedChoiceState[] = [];
  const classData = rulesetData?.classes.find((item) => item.name === character.className);

  if (classData && character.level >= classData.subclassLevel) {
    const options = (rulesetData?.subclasses ?? []).filter((item) => item.className === character.className).map((item) => ({ id: item.name, name: item.name, }));
    const selected = character.subclass ? [character.subclass] : [];
    const valid = selected.filter((id) => options.some((option) => option.id === id));
    states.push(makeState({ id: "subclass", label: "Subclass", step: "class", kind: "single", field: "subclass", required: 1, selected, validSelected: valid, options }));
  }

  const styleOptions = getFightingStyles(character.ruleset);
  const styles = unique(character.fightingStyleIds ?? []);
  states.push(makeState({ id: "fighting-styles", label: "Fighting Style", step: "combat", kind: "multiple", field: "fightingStyleIds", required: getFightingStyleChoiceCount(character.className, character.level, character.subclass), selected: styles, validSelected: styles.filter((id) => styleOptions.some((option) => option.id === id)), options: styleOptions }));

  const masteryOptions = (rulesetData?.items ?? []).filter((item) => getWeaponMastery(item, character.ruleset)).map((item) => ({ id: item.id, name: item.name, detail: getWeaponMastery(item, character.ruleset) ?? "" }));
  const masteries = unique(character.masteredWeaponIds ?? []);
  states.push(makeState({ id: "weapon-mastery", label: "Weapon Mastery", step: "equipment", kind: "multiple", field: "masteredWeaponIds", required: getWeaponMasteryChoiceCount(classData, character.level, character.ruleset), selected: masteries, validSelected: masteries.filter((id) => masteryOptions.some((option) => option.id === id)), options: masteryOptions }));

  const metamagicOptions = getMetamagicOptions(character.ruleset).map((item) => ({ id: item.id, name: item.name, detail: `${item.cost} SP` }));
  const metamagic = unique(character.metamagicIds ?? []);
  states.push(makeState({ id: "metamagic", label: "Metamagic", step: "feats", kind: "multiple", field: "metamagicIds", required: getMetamagicChoiceCount(character.className, character.level, character.ruleset), selected: metamagic, validSelected: metamagic.filter((id) => metamagicOptions.some((option) => option.id === id)), options: metamagicOptions }));

  const invocationOptions = getEldritchInvocations(character.ruleset).filter((item) => isInvocationEligible(item, character)).map((item) => ({ id: item.id, name: item.name, detail: item.summary }));
  const invocations = unique(character.invocationIds ?? []);
  states.push(makeState({ id: "invocations", label: "Eldritch Invocation", step: "feats", kind: "multiple", field: "invocationIds", required: getInvocationChoiceCount(character.className, character.level, character.ruleset), selected: invocations, validSelected: invocations.filter((id) => invocationOptions.some((option) => option.id === id)), options: invocationOptions }));

  const wildShapeOptions = getWildShapeForms().filter((item) => isWildShapeFormEligible(item, character.level, character.ruleset, character.subclass)).map((item) => ({ id: item.id, name: item.name, detail: `CR ${item.challengeRating}` }));
  const wildShapes = unique(character.wildShapeFormIds ?? []);
  const wildShapeRequired = character.ruleset === "dnd_2024" ? getWildShapeKnownCount(character.className, character.level, character.ruleset) : 0;
  states.push(makeState({ id: "wild-shape", label: "Wild Shape Form", step: "feats", kind: "multiple", field: "wildShapeFormIds", required: wildShapeRequired, selected: wildShapes, validSelected: wildShapes.filter((id) => wildShapeOptions.some((option) => option.id === id)), options: wildShapeOptions }));

  const maneuverOptions = getBattleMasterManeuvers().map((item) => ({ id: item.id, name: item.name, detail: item.trigger }));
  const maneuvers = unique(character.maneuverIds ?? []);
  states.push(makeState({ id: "maneuvers", label: "Battle Master Maneuver", step: "feats", kind: "multiple", field: "maneuverIds", required: getManeuverChoiceCount(character.className, character.subclass, character.level, character.ruleset), selected: maneuvers, validSelected: maneuvers.filter((id) => maneuverOptions.some((option) => option.id === id)), options: maneuverOptions }));

  const companionOptions = getRangerCompanions(character.ruleset).map((item) => ({ id: item.id, name: item.name }));
  const companionSelected = character.companionId ? [character.companionId] : [];
  states.push(makeState({ id: "companion", label: "Beast Master Companion", step: "feats", kind: "single", field: "companionId", required: getCompanionChoiceCount(character.className, character.subclass, character.level), selected: companionSelected, validSelected: companionSelected.filter((id) => companionOptions.some((option) => option.id === id)), options: companionOptions }));

  const expertiseRequired = getExpertiseLimit(character.className, character.level, character.ruleset);
  const expertiseOptions = unique(character.skillProficiencies ?? []).map((skill) => ({ id: skill, name: skill }));
  const expertise = unique(character.expertiseSkills ?? []);
  states.push(makeState({ id: "expertise", label: "Expertise", step: "skills", kind: "multiple", field: "expertiseSkills", required: expertiseRequired, selected: expertise, validSelected: expertise.filter((id) => expertiseOptions.some((option) => option.id === id)), options: expertiseOptions }));

  const arcanumLevels = getMysticArcanumLevels(character.className, character.level, character.ruleset);
  const arcanumOptions = arcanumLevels.flatMap((level) => (rulesetData?.spells ?? []).filter((spell) => spell.level === level && spell.classes.some((name) => name.toLowerCase() === "warlock")).map((spell) => ({ id: spell.id, name: spell.name, detail: `Level ${level}`, group: String(level) })));
  const arcanum = unique(character.arcanumSpellIds ?? []);
  const validArcanum = arcanum.filter((id) => arcanumOptions.some((option) => option.id === id));
  const completedGroups = arcanumLevels.filter((level) => validArcanum.filter((id) => arcanumOptions.find((option) => option.id === id)?.group === String(level)).length === 1).length;
  states.push(makeState({ id: "arcanum", label: "Mystic Arcanum", step: "spells", kind: "grouped-single", field: "arcanumSpellIds", required: arcanumLevels.length, selected: arcanum, validSelected: validArcanum.slice(0, completedGroups), options: arcanumOptions }));

  return states.filter((state) => state.required > 0 || state.selected.length > 0);
}

export function getIncompleteUnifiedChoices(character: ChoiceCharacter, rulesetData: RulesetData | null) {
  return getUnifiedCharacterChoices(character, rulesetData).filter((state) => !state.complete);
}

export function applyUnifiedChoice(character: Character, state: UnifiedChoiceState, optionId: string): Character {
  const now = new Date().toISOString();
  if (state.field === "subclass") return { ...character, subclass: optionId, updatedAt: now };
  if (state.field === "companionId") return { ...character, companionId: optionId, updatedAt: now };
  if (state.field === "arcanumSpellIds") {
    const group = state.options.find((option) => option.id === optionId)?.group;
    const groupIds = new Set(state.options.filter((option) => option.group === group).map((option) => option.id));
    return { ...character, arcanumSpellIds: [...(character.arcanumSpellIds ?? []).filter((id) => !groupIds.has(id)), optionId], updatedAt: now };
  }
  if (!state.field) return character;
  const field = state.field;
  const selected = unique((character[field] ?? []) as string[]);
  const next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : selected.length < state.required ? [...selected, optionId] : selected;
  return { ...character, [field]: next, updatedAt: now };
}
