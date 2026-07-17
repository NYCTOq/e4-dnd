import type { Character } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getIncompleteUnifiedChoices, type UnifiedChoiceStep } from "./unifiedCharacterChoices";

export type ChoiceDebt = { id: string; label: string; required: number; current: number; step: UnifiedChoiceStep; message: string };

export function getCharacterChoiceDebt(character: Character, rulesetData: RulesetData | null): ChoiceDebt[] {
  return getIncompleteUnifiedChoices(character, rulesetData).map((state) => ({
    id: state.id,
    label: state.label,
    required: state.required,
    current: state.validSelected.length,
    step: state.step,
    message: state.message,
  }));
}
