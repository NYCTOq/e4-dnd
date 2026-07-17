import type { AbilityKey, Character } from "../character/character.types";
import type { DndFeatData, RulesetData } from "./ruleset.types";
import { getUnifiedCharacterChoices, type UnifiedChoiceState } from "./unifiedCharacterChoices";

export type LevelUpChoiceStatus = "complete" | "pending" | "blocked";

export interface LevelUpFeatChoiceState {
  featId: string;
  label: string;
  required: number;
  selected: string[];
  options: string[];
  complete: boolean;
}

export interface LevelUpChoiceCompletionReport {
  status: LevelUpChoiceStatus;
  complete: boolean;
  unifiedChoices: UnifiedChoiceState[];
  pendingChoices: UnifiedChoiceState[];
  featChoice: LevelUpFeatChoiceState | null;
  blockers: string[];
  warnings: string[];
  summary: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getFeatChoiceState(
  feat: DndFeatData | null | undefined,
  selected: string[] = [],
): LevelUpFeatChoiceState | null {
  if (!feat) return null;

  const required = Math.max(0, feat.choiceCount ?? (feat.choiceType || feat.abilityOptions?.length ? 1 : 0));
  if (!required) return null;

  const options = feat.choiceType === "ability" || feat.abilityOptions?.length
    ? (feat.abilityOptions ?? []).map((ability) => ability as string)
    : [];
  const validSelected = unique(selected).filter((choice) => !options.length || options.includes(choice));

  return {
    featId: feat.id,
    label: `${feat.name} alt seçimi`,
    required,
    selected: validSelected,
    options,
    complete: validSelected.length === required,
  };
}

export function getLevelUpChoiceCompletion(
  projectedCharacter: Character,
  rulesetData: RulesetData | null,
  selectedFeat?: DndFeatData | null,
  featSelections: string[] = [],
): LevelUpChoiceCompletionReport {
  const unifiedChoices = getUnifiedCharacterChoices(projectedCharacter, rulesetData);
  const pendingChoices = unifiedChoices.filter((choice) => !choice.complete);
  const featChoice = getFeatChoiceState(selectedFeat, featSelections);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!rulesetData) blockers.push("Ruleset verisi yüklenemedi; level-up seçimleri doğrulanamaz.");
  if (featChoice && !featChoice.complete) blockers.push(`${featChoice.label}: ${featChoice.selected.length}/${featChoice.required}.`);

  for (const choice of pendingChoices) {
    if (!choice.options.length) blockers.push(`${choice.label} için geçerli seçenek bulunamadı.`);
    else warnings.push(`${choice.message} Level-up sonrası Choice Debt Resolver üzerinden tamamlanabilir.`);
  }

  const complete = blockers.length === 0 && pendingChoices.length === 0;
  const status: LevelUpChoiceStatus = blockers.length ? "blocked" : complete ? "complete" : "pending";
  return {
    status,
    complete,
    unifiedChoices,
    pendingChoices,
    featChoice,
    blockers,
    warnings,
    summary: blockers.length
      ? `${blockers.length} blocker nedeniyle level-up tamamlanamaz.`
      : pendingChoices.length
        ? `${pendingChoices.length} seçim borcu level-up sonrasında tamamlanmalı.`
        : "Level-up için bütün zorunlu seçimler tamamlandı.",
  };
}

export function applyFeatAbilityChoice(
  abilities: Character["abilities"],
  feat: DndFeatData | null | undefined,
  choice: string | undefined,
): Character["abilities"] {
  if (!feat || !choice || !(feat.abilityOptions ?? []).includes(choice as AbilityKey)) return { ...abilities };
  const ability = choice as AbilityKey;
  return { ...abilities, [ability]: Math.min(20, abilities[ability] + 1) };
}
