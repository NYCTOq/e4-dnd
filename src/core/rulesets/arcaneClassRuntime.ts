import { getBardCombatFeatures, getBardicInspirationDie, getInspirationRecovery } from "./bardRules";
import { getInvocationChoiceCount } from "./invocationRules";
import { getMetamagicChoiceCount } from "./metamagicRules";
import { getMysticArcanumLevels, getPactMagicSlots } from "./pactMagicRules";
import { getSorcererCombatFeatures } from "./sorcererRules";
import { getArcaneRecoveryBudget, getWizardCombatFeatures } from "./wizardRules";
import type { RulesetId } from "../character/character.types";

export type ArcaneRecoveryType = "long" | "short" | null;

export type ArcaneClassRuntime = {
  className: string;
  ruleset: RulesetId;
  bardicInspirationDie: number | null;
  bardicInspirationUses: number;
  bardicInspirationRecovery: ArcaneRecoveryType;
  sorceryPointsMax: number;
  metamagicChoices: number;
  pactSlotLevel: number;
  pactSlotMax: number;
  invocationChoices: number;
  mysticArcanumLevels: number[];
  arcaneRecoveryBudget: number;
  spellMastery: boolean;
  signatureSpells: boolean;
  notes: string[];
};

const clampLevel = (level: number) => Math.max(1, Math.min(20, Math.floor(level)));

export function getArcaneClassRuntime(
  className: string,
  level: number,
  ruleset: RulesetId,
  spellcastingAbilityModifier = 0,
): ArcaneClassRuntime {
  const key = className.trim().toLowerCase();
  const safeLevel = clampLevel(level);
  const notes: string[] = [];

  let bardicInspirationDie: number | null = null;
  let bardicInspirationUses = 0;
  let bardicInspirationRecovery: ArcaneRecoveryType = null;
  let sorceryPointsMax = 0;
  let metamagicChoices = 0;
  let pactSlotLevel = 0;
  let pactSlotMax = 0;
  let invocationChoices = 0;
  let mysticArcanumLevels: number[] = [];
  let arcaneRecoveryBudget = 0;
  let spellMastery = false;
  let signatureSpells = false;

  if (key === "bard") {
    const features = getBardCombatFeatures(safeLevel, ruleset);
    bardicInspirationDie = getBardicInspirationDie(safeLevel);
    bardicInspirationUses = Math.max(1, spellcastingAbilityModifier);
    bardicInspirationRecovery = getInspirationRecovery(safeLevel);
    if (features.songOfRest) notes.push(`Song of Rest d${features.songOfRest}`);
    if (features.magicalSecrets) notes.push("Magical Secrets available");
    if (features.superiorInspiration) notes.push("Superior Inspiration available");
  }

  if (key === "sorcerer") {
    const features = getSorcererCombatFeatures(safeLevel);
    sorceryPointsMax = features.fontOfMagic ? safeLevel : 0;
    metamagicChoices = getMetamagicChoiceCount("Sorcerer", safeLevel, ruleset);
    if (features.fontOfMagic) notes.push("Font of Magic available");
    if (features.sorcerousRestoration) notes.push("Sorcerous Restoration available");
  }

  if (key === "warlock") {
    const pactSlot = getPactMagicSlots("Warlock", safeLevel)[0];
    pactSlotLevel = pactSlot?.level ?? 0;
    pactSlotMax = pactSlot?.max ?? 0;
    invocationChoices = getInvocationChoiceCount("Warlock", safeLevel, ruleset);
    mysticArcanumLevels = getMysticArcanumLevels("Warlock", safeLevel, ruleset);
    if (mysticArcanumLevels.length) notes.push(`Mystic Arcanum ${mysticArcanumLevels.join("/")}`);
    if (safeLevel >= 20) notes.push("Eldritch Master available");
  }

  if (key === "wizard") {
    const features = getWizardCombatFeatures(safeLevel);
    arcaneRecoveryBudget = getArcaneRecoveryBudget(safeLevel);
    spellMastery = features.spellMastery;
    signatureSpells = features.signatureSpells;
    if (features.memorizeSpell) notes.push("Memorize Spell available");
    if (spellMastery) notes.push("Spell Mastery available");
    if (signatureSpells) notes.push("Signature Spells available");
  }

  return {
    className,
    ruleset,
    bardicInspirationDie,
    bardicInspirationUses,
    bardicInspirationRecovery,
    sorceryPointsMax,
    metamagicChoices,
    pactSlotLevel,
    pactSlotMax,
    invocationChoices,
    mysticArcanumLevels,
    arcaneRecoveryBudget,
    spellMastery,
    signatureSpells,
    notes,
  };
}
