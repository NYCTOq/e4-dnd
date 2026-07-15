import type { AbilityKey, AbilityScores } from "../character/character.types";
import type { DndBackgroundData, DndRaceData, DndSubraceData } from "./ruleset.types";

export function mergeAbilityBonuses(...bonuses: Array<Partial<Record<AbilityKey, number>> | undefined>) {
  const result: Partial<Record<AbilityKey, number>> = {};
  for (const bonusSet of bonuses) for (const [key, value] of Object.entries(bonusSet ?? {})) result[key as AbilityKey] = (result[key as AbilityKey] ?? 0) + (value ?? 0);
  return result;
}

export function getOriginAbilityBonuses(ruleset: "dnd_2014" | "dnd_2024" | "homebrew", race: DndRaceData | null, subrace: DndSubraceData | null, background: DndBackgroundData | null, primary?: AbilityKey, secondary?: AbilityKey) {
  if (ruleset === "dnd_2014") return mergeAbilityBonuses(race?.abilityBonuses, subrace?.abilityBonuses);
  if (ruleset === "dnd_2024" && background && primary && secondary && primary !== secondary && background.abilityOptions?.includes(primary) && background.abilityOptions.includes(secondary)) return { [primary]: 2, [secondary]: 1 };
  return {};
}

export function applyAbilityBonuses(scores: AbilityScores, bonuses: Partial<Record<AbilityKey, number>>): AbilityScores {
  return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Math.min(30, value + (bonuses[key as AbilityKey] ?? 0))])) as AbilityScores;
}
