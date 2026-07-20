export type WizardEdition = "dnd_2014" | "dnd_2024";

const clampLevel = (level: number) => Math.max(1, Math.min(20, Math.floor(level)));

const PREPARED_2024 = [0,4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25] as const;

export function getWizardCantripCount(level: number) {
  const safe = clampLevel(level);
  if (safe >= 10) return 5;
  if (safe >= 4) return 4;
  return 3;
}

export function getWizardSpellbookMinimum(level: number) {
  return 6 + (clampLevel(level) - 1) * 2;
}

export function getWizardPreparedSpellLimit(level: number, edition: WizardEdition, intelligenceModifier = 3) {
  const safe = clampLevel(level);
  if (edition === "dnd_2024") return PREPARED_2024[safe];
  return Math.max(1, safe + Math.floor(intelligenceModifier));
}

export function getWizardMaxSpellLevel(level: number) {
  return Math.min(9, Math.ceil(clampLevel(level) / 2));
}

export function getArcaneRecoveryBudget(level: number) {
  return Math.ceil(clampLevel(level) / 2);
}

export function canRecoverWizardSlot(slotLevel: number, spent: number, budgetRemaining: number) {
  return Number.isInteger(slotLevel) && slotLevel >= 1 && slotLevel <= 5 && spent > 0 && budgetRemaining >= slotLevel;
}

export function getWizardSubclassLevel(edition: WizardEdition) {
  return edition === "dnd_2024" ? 3 : 2;
}

export function getWizardSubclassFeatureLevels(edition: WizardEdition) {
  return edition === "dnd_2024" ? [3,6,10,14] : [2,6,10,14];
}

export function getWizardCombatFeatures(level: number, edition: WizardEdition = "dnd_2024") {
  const safe = clampLevel(level);
  return {
    spellcasting: safe >= 1,
    arcaneRecovery: safe >= 1,
    ritualAdept: edition === "dnd_2024" && safe >= 1,
    scholar: edition === "dnd_2024" && safe >= 2,
    subclass: safe >= getWizardSubclassLevel(edition),
    memorizeSpell: edition === "dnd_2024" && safe >= 5,
    spellMastery: safe >= 18,
    epicBoon: edition === "dnd_2024" && safe >= 19,
    signatureSpells: safe >= 20,
  };
}
