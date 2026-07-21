import type { CharacterDraft } from "../character/character.types";
import { getWeaponMastery, getWeaponMasteryChoiceCount } from "./equipmentRules";
import { getFightingStyleChoiceCount, getFightingStyles } from "./fightingStyleRules";
import type { RulesetData } from "./ruleset.types";

export type LevelOneFeatureChoiceReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

export function getLevelOneFeatureChoiceReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneFeatureChoiceReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden class feature seçimleri doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const classData = rulesetData.classes.find((item) => item.name === draft.className) ?? null;
  if (!classData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Class seçilmeden class feature seçimleri doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const styleLimit = getFightingStyleChoiceCount(draft.className, draft.level, draft.subclass);
  const selectedStyles = [...new Set(draft.fightingStyleIds ?? [])];
  const validStyles = new Set(getFightingStyles(draft.ruleset).map((item) => item.id));
  const stylesReady = selectedStyles.length === styleLimit && selectedStyles.every((id) => validStyles.has(id));
  checks.push(stylesReady);
  summary.push(`Fighting Style ${selectedStyles.length}/${styleLimit}`);
  if (!stylesReady) blockers.push(`${draft.className} için ${styleLimit} geçerli Fighting Style seçilmeli; şu anda ${selectedStyles.length} seçili.`);

  const masteryLimit = getWeaponMasteryChoiceCount(classData, draft.level, draft.ruleset);
  const selectedMasteries = [...new Set(draft.masteredWeaponIds ?? [])];
  const validMasteries = new Set(rulesetData.items.filter((item) => getWeaponMastery(item, draft.ruleset)).map((item) => item.id));
  const masteriesReady = selectedMasteries.length === masteryLimit && selectedMasteries.every((id) => validMasteries.has(id));
  checks.push(masteriesReady);
  summary.push(`Weapon Mastery ${selectedMasteries.length}/${masteryLimit}`);
  if (!masteriesReady) blockers.push(`${draft.className} için ${masteryLimit} geçerli Weapon Mastery seçilmeli; şu anda ${selectedMasteries.length} seçili.`);

  const duplicateFree = selectedStyles.length === (draft.fightingStyleIds ?? []).length
    && selectedMasteries.length === (draft.masteredWeaponIds ?? []).length;
  checks.push(duplicateFree);
  if (!duplicateFree) blockers.push("Class feature seçimlerinde tekrar eden kayıtlar var.");

  if (styleLimit === 0) notices.push("Bu levelda Fighting Style seçimi gerekmiyor.");
  if (masteryLimit === 0) notices.push("Bu edition/class/level için Weapon Mastery seçimi gerekmiyor.");
  if (draft.level > 1) notices.push(`Kontrol mevcut level ${draft.level} progression değerlerini kullanıyor.`);

  return {
    applicable: true,
    ready: blockers.length === 0,
    blockers,
    notices,
    completedChecks: checks.filter(Boolean).length,
    totalChecks: checks.length,
    summary,
  };
}
