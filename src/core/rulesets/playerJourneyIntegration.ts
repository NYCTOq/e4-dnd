import type { Character } from "../character/character.types";

export interface PlayerJourneyIntegrationSnapshot {
  hpMissing: number;
  tempHp: number;
  spentSpellSlots: number;
  spentPactSlots: number;
  spentResources: number;
  spentHitDice: number;
  activeConditionCount: number;
  activeEffectCount: number;
  shortRestRecoveryCount: number;
  longRestRecoveryCount: number;
  manualRecoveryCount: number;
  restRecommendation: "none" | "short" | "long";
  restReason: string;
  sheetReady: boolean;
  playReady: boolean;
}

export function getPlayerJourneyIntegrationSnapshot(character: Character): PlayerJourneyIntegrationSnapshot {
  const hpMissing = Math.max(0, character.maxHp - character.currentHp);
  const spentSpellSlots = (character.spellSlots ?? []).reduce((sum, slot) => sum + Math.max(0, slot.used), 0);
  const spentPactSlots = (character.pactMagicSlots ?? []).reduce((sum, slot) => sum + Math.max(0, slot.used), 0);
  const spentResources = (character.resources ?? []).reduce((sum, resource) => sum + Math.max(0, resource.used), 0);
  const spentHitDice = (character.hitDice ?? []).reduce((sum, pool) => sum + Math.max(0, pool.used), 0);
  const shortRestRecoveryCount = (character.resources ?? []).filter((resource) => !resource.unlimited && resource.used > 0 && (resource.recovery === "short" || Boolean(resource.shortRecoveryAmount))).length + (spentPactSlots > 0 ? 1 : 0);
  const longRestRecoveryCount = (character.resources ?? []).filter((resource) => !resource.unlimited && resource.used > 0 && (resource.recovery === "short" || resource.recovery === "long")).length + (spentSpellSlots > 0 ? 1 : 0) + (spentHitDice > 0 ? 1 : 0);
  const manualRecoveryCount = (character.resources ?? []).filter((resource) => !resource.unlimited && resource.used > 0 && resource.recovery === "manual").length;
  const needsLongRest = hpMissing > Math.max(1, Math.floor(character.maxHp / 2)) || spentSpellSlots > 0 || character.exhaustion > 0 || spentHitDice > 0;
  const needsShortRest = !needsLongRest && (hpMissing > 0 || shortRestRecoveryCount > 0);
  const restRecommendation = needsLongRest ? "long" : needsShortRest ? "short" : "none";
  const restReason = restRecommendation === "long"
    ? `${hpMissing} HP eksik · ${spentSpellSlots} normal slot · ${spentHitDice} Hit Die harcanmış`
    : restRecommendation === "short"
      ? `${hpMissing} HP eksik · ${shortRestRecoveryCount} kısa dinlenme kaynağı hazır`
      : "HP, slot ve yenilenebilir kaynaklar hazır";
  const sheetReady = character.maxHp > 0 && character.armorClass > 0 && character.level > 0;
  const playReady = sheetReady && character.currentHp >= 0 && (character.resources ?? []).every((resource) => resource.used >= 0 && resource.used <= resource.max);
  return {
    hpMissing, tempHp: Math.max(0, character.tempHp), spentSpellSlots, spentPactSlots, spentResources, spentHitDice,
    activeConditionCount: (character.conditions ?? []).length, activeEffectCount: (character.activeSpellEffects ?? []).length,
    shortRestRecoveryCount, longRestRecoveryCount, manualRecoveryCount, restRecommendation, restReason, sheetReady, playReady,
  };
}
