import type { AbilityKey, AbilityScores } from "../character/character.types";
import type { DndBackgroundData, DndRaceData, DndSubraceData } from "./ruleset.types";

export function mergeAbilityBonuses(...bonuses: Array<Partial<Record<AbilityKey, number>> | undefined>) {
  const result: Partial<Record<AbilityKey, number>> = {};
  for (const bonusSet of bonuses) for (const [key, value] of Object.entries(bonusSet ?? {})) result[key as AbilityKey] = (result[key as AbilityKey] ?? 0) + (value ?? 0);
  return result;
}

export function getOriginAbilityBonuses(
  ruleset: "dnd_2014" | "dnd_2024" | "homebrew",
  race: DndRaceData | null,
  subrace: DndSubraceData | null,
  background: DndBackgroundData | null,
  primary?: AbilityKey,
  secondary?: AbilityKey,
  tertiary?: AbilityKey,
  mode: "2-1" | "1-1-1" = "2-1",
  flexibleRacePrimary?: AbilityKey,
  flexibleRaceSecondary?: AbilityKey,
) {
  if (ruleset === "dnd_2014") {
    const fixed = mergeAbilityBonuses(race?.abilityBonuses, subrace?.abilityBonuses);
    if (race?.name === "Half-Elf" && flexibleRacePrimary && flexibleRaceSecondary && flexibleRacePrimary !== flexibleRaceSecondary && flexibleRacePrimary !== "cha" && flexibleRaceSecondary !== "cha") {
      return mergeAbilityBonuses(fixed, { [flexibleRacePrimary]: 1, [flexibleRaceSecondary]: 1 });
    }
    return fixed;
  }
  if (ruleset === "dnd_2024" && background) {
    const options = background.abilityOptions ?? [];
    if (mode === "1-1-1" && primary && secondary && tertiary && new Set([primary, secondary, tertiary]).size === 3 && [primary, secondary, tertiary].every((key) => options.includes(key))) {
      return { [primary]: 1, [secondary]: 1, [tertiary]: 1 };
    }
    if (primary && secondary && primary !== secondary && options.includes(primary) && options.includes(secondary)) return { [primary]: 2, [secondary]: 1 };
  }
  return {};
}

export function applyAbilityBonuses(scores: AbilityScores, bonuses: Partial<Record<AbilityKey, number>>): AbilityScores {
  return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Math.min(30, value + (bonuses[key as AbilityKey] ?? 0))])) as AbilityScores;
}
