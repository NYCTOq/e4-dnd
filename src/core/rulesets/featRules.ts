import type { AbilityScores } from "../character/character.types";
import type { DndFeatData } from "./ruleset.types";

const STANDARD_FEAT_LEVELS = [4, 8, 12, 16, 19] as const;

export function getGeneralFeatSlotCount(level: number, className: string, ruleset: "dnd_2014" | "dnd_2024" | "homebrew") {
  const safeLevel = Math.min(20, Math.max(1, Math.floor(level)));
  const levels: number[] = [...STANDARD_FEAT_LEVELS];
  const normalizedClass = className.trim().toLowerCase();

  if (normalizedClass === "fighter") levels.push(6, 14);
  if (normalizedClass === "rogue") levels.push(10);

  if (ruleset === "dnd_2024") {
    return levels.filter((entry) => entry <= safeLevel && entry < 19).length + (safeLevel >= 19 ? 1 : 0);
  }

  return levels.filter((entry) => entry <= safeLevel).length;
}

export function isFeatEligible(
  feat: DndFeatData,
  context: {
    level: number;
    className: string;
    abilities: AbilityScores;
    canCastSpells: boolean;
  },
) {
  const prerequisite = feat.prerequisite;
  if (!prerequisite) return { eligible: true, reasons: [] as string[] };

  const reasons: string[] = [];
  if (prerequisite.minimumLevel && context.level < prerequisite.minimumLevel) {
    reasons.push(`Level ${prerequisite.minimumLevel} gerekli`);
  }
  if (prerequisite.spellcasting && !context.canCastSpells) {
    reasons.push("Spellcasting gerekli");
  }
  if (prerequisite.classNames?.length && !prerequisite.classNames.some((item) => item.toLowerCase() === context.className.toLowerCase())) {
    reasons.push(`${prerequisite.classNames.join(" / ")} class gerekli`);
  }
  for (const [ability, minimum] of Object.entries(prerequisite.abilityMinimums ?? {})) {
    if ((context.abilities[ability as keyof AbilityScores] ?? 0) < (minimum ?? 0)) {
      reasons.push(`${ability.toUpperCase()} ${minimum} gerekli`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

export function getGrantedOriginFeatName(ruleset: string, originFeat?: string) {
  return ruleset === "dnd_2024" ? originFeat?.trim() ?? "" : "";
}
