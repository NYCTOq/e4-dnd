import type { Character } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";
import { getCharacterChoiceDebt } from "./choiceDebt";
import { getClassLevel, getMulticlassTransitionEligibility, normalizeClassLevels } from "./multiclassRules";
import { isAsiMilestone } from "../../features/characters/levelUpCalculator";

export type AdvancementReadiness = {
  ready: boolean;
  nextLevel: number;
  targetClassName: string;
  nextClassLevel: number;
  subclassRequired: boolean;
  subclassOptions: string[];
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
};

export function getLevelUpAdvancementReadiness({
  character,
  rulesetData,
  targetClassName,
  selectedSubclassName,
  milestoneChoiceComplete,
}: {
  character: Character;
  rulesetData: RulesetData | null;
  targetClassName: string;
  selectedSubclassName?: string;
  milestoneChoiceComplete: boolean;
}): AdvancementReadiness {
  const blockers: string[] = [];
  const notices: string[] = [];
  const nextLevel = Math.min(20, character.level + 1);
  const classLevels = normalizeClassLevels(character.classLevels, character.className, character.level);
  const targetClass = rulesetData?.classes.find((item) => item.name === targetClassName);
  const currentClassLevel = getClassLevel(classLevels, targetClassName);
  const nextClassLevel = currentClassLevel + 1;
  const existingSubclass = classLevels.find((item) => item.className === targetClassName)?.subclass
    ?? (targetClassName === character.className ? character.subclass : "");
  const subclassOptions = (rulesetData?.subclasses ?? [])
    .filter((item) => item.className === targetClassName)
    .map((item) => item.name);
  const subclassRequired = Boolean(targetClass && nextClassLevel >= targetClass.subclassLevel && !existingSubclass);

  if (character.level >= 20) blockers.push("Karakter zaten level 20 sınırında.");
  if (!rulesetData) blockers.push("Ruleset verisi yüklenemedi.");
  if (!targetClass) blockers.push("Hedef class katalogda bulunamadı.");

  if (currentClassLevel === 0) {
    const eligibility = getMulticlassTransitionEligibility(classLevels, targetClassName, character.abilities);
    if (!eligibility.eligible) blockers.push(`Multiclass prerequisite eksik: ${eligibility.missing.join(", ")}.`);
  }

  if (subclassRequired) {
    if (!subclassOptions.length) blockers.push(`${targetClassName} için geçerli subclass bulunamadı.`);
    else if (!selectedSubclassName || !subclassOptions.includes(selectedSubclassName)) {
      blockers.push(`${targetClassName} level ${nextClassLevel} için subclass seçilmeli.`);
    }
  }

  if (isAsiMilestone(nextClassLevel, targetClassName) && !milestoneChoiceComplete) {
    blockers.push(`Class level ${nextClassLevel} için ASI veya Feat seçimi tamamlanmalı.`);
  }

  if (rulesetData) {
    const projected = { ...character, level: nextLevel };
    const debts = getCharacterChoiceDebt(projected, rulesetData);
    for (const debt of debts) notices.push(debt.message);
  }

  if (targetClass?.levels.some((row) => row.level === nextClassLevel && row.features.length > 0)) {
    notices.push(`${targetClassName} class feature ilerlemesi uygulanacak.`);
  }
  if (targetClass?.spellProgression && targetClass.spellProgression !== "none") {
    notices.push("Spell slot ve spell seçim limitleri yeni class level sonrasında yeniden hesaplanacak.");
  }
  if (nextLevel === 19 && character.ruleset === "dnd_2024") {
    notices.push("Level 19 Epic Boon uygunluğunu kontrol et.");
  }

  const totalChecks = 6;
  const completedChecks = totalChecks - Math.min(totalChecks, blockers.length);
  return {
    ready: blockers.length === 0,
    nextLevel,
    targetClassName,
    nextClassLevel,
    subclassRequired,
    subclassOptions,
    blockers,
    notices: [...new Set(notices)],
    completedChecks,
    totalChecks,
  };
}
