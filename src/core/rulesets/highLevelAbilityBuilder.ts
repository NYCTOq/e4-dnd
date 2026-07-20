import type { AbilityKey, AbilityScores, CharacterDraft } from "../character/character.types";

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
export const STANDARD_ARRAY_VALUES = [15, 14, 13, 12, 10, 8] as const;
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export function getPointBuySpent(scores: AbilityScores) {
  return ABILITY_KEYS.reduce((total, key) => total + (POINT_BUY_COST[scores[key]] ?? 99), 0);
}

export function getPointBuyRemaining(scores: AbilityScores) {
  return 27 - getPointBuySpent(scores);
}

export function isStandardArrayAssignment(scores: AbilityScores) {
  return [...Object.values(scores)].sort((a, b) => b - a).join(",") === [...STANDARD_ARRAY_VALUES].sort((a, b) => b - a).join(",");
}

export function getAsiBudget(level: number, className: string, _ruleset: CharacterDraft["ruleset"], featCount: number) {
  const standard = [4, 8, 12, 16, 19];
  const normalized = className.trim().toLowerCase();
  if (normalized === "fighter") standard.push(6, 14);
  if (normalized === "rogue") standard.push(10);
  const slots = standard.filter((entry) => entry <= Math.max(1, Math.min(20, level))).length;
  const consumedByFeats = Math.min(slots, Math.max(0, featCount));
  return Math.max(0, (slots - consumedByFeats) * 2);
}

export function getSpentAsi(increases: Partial<Record<AbilityKey, number>> | undefined) {
  return ABILITY_KEYS.reduce((total, key) => total + Math.max(0, Math.floor(increases?.[key] ?? 0)), 0);
}

export function applyAbilityLayers(
  base: AbilityScores,
  origin: Partial<Record<AbilityKey, number>>,
  asi: Partial<Record<AbilityKey, number>> | undefined,
): AbilityScores {
  return Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, Math.min(20, base[key] + (origin[key] ?? 0) + (asi?.[key] ?? 0))]),
  ) as AbilityScores;
}


export function getFeatSelectionAsiError(draft: CharacterDraft, nextFeatCount: number) {
  const nextBudget = getAsiBudget(draft.level, draft.className, draft.ruleset, nextFeatCount);
  const spent = getSpentAsi(draft.abilityScoreIncreases);
  if (spent <= nextBudget) return null;
  return `Bu feat bir ASI/Feat slotunu kullanır. Önce Level ASI dağılımından ${spent - nextBudget} puanı geri almalısın.`;
}

export function getHighLevelAbilityError(draft: CharacterDraft, asiBudget: number) {
  const spent = getSpentAsi(draft.abilityScoreIncreases);
  if (spent !== asiBudget) return `Level seçimlerinde ${spent}/${asiBudget} ASI puanı kullanıldı; bütün puanlar dağıtılmalı veya feat seçilerek bütçe tüketilmeli.`;
  for (const key of ABILITY_KEYS) {
    const value = draft.abilityScoreIncreases?.[key] ?? 0;
    if (!Number.isInteger(value) || value < 0) return `${key.toUpperCase()} ASI artışı negatif veya kesirli olamaz.`;
  }
  return null;
}

export function updateAbilityIncrease(
  current: Partial<Record<AbilityKey, number>> | undefined,
  key: AbilityKey,
  delta: number,
  budget: number,
) {
  const next = { ...(current ?? {}) };
  const currentValue = next[key] ?? 0;
  const candidate = Math.max(0, currentValue + delta);
  next[key] = candidate;
  if (getSpentAsi(next) > budget) return current ?? {};
  return next;
}
