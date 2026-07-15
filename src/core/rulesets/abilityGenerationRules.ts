import type { AbilityScores } from "../character/character.types";

export type AbilityGenerationMethod = "standard-array" | "point-buy" | "rolled";
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

function permutations(values: readonly number[]): number[][] {
  if (values.length <= 1) return [values.slice()];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((rest) => [value, ...rest]));
}

export function getAbilityBudgetError(method: AbilityGenerationMethod, abilities: AbilityScores, asiPoints: number) {
  const scores = Object.values(abilities);
  if (scores.some((score) => !Number.isInteger(score))) return "Ability skorları tam sayı olmalı.";

  if (method === "rolled") {
    return scores.some((score) => score < 3 || score > 20) ? "Rolled/Manual skorlarda her değer 3–20 arasında olmalı." : null;
  }

  if (method === "standard-array") {
    const reachable = permutations(STANDARD_ARRAY).some((base) => scores.every((score, index) => score >= base[index]) && scores.reduce((total, score, index) => total + score - base[index], 0) <= asiPoints);
    return reachable ? null : `Standard Array dağılımı ${asiPoints} kullanılabilir ASI puanıyla bu skorlara ulaşamaz.`;
  }

  const baseScores = scores.map((score) => Math.min(15, score));
  if (baseScores.some((score) => score < 8) || baseScores.reduce((total, score) => total + (POINT_BUY_COST[score] ?? 99), 0) > 27) return "Point Buy başlangıç skorları 8–15 aralığında ve toplam 27 puan içinde olmalı.";
  const spentAsi = scores.reduce((total, score) => total + Math.max(0, score - 15), 0);
  return spentAsi <= asiPoints ? null : `Point Buy sonrası artışlar kullanılabilir ${asiPoints} ASI puanını aşıyor.`;
}

export function getStandardArrayAbilities(): AbilityScores {
  return { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
}
