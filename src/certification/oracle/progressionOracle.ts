import { PROFICIENCY_BY_LEVEL } from "../reference/progression.reference";

export function expectedProficiencyBonus(level: number) {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError(`Level must be an integer from 1 to 20. Received: ${level}`);
  }
  return PROFICIENCY_BY_LEVEL[level];
}

export function expectedHpAtLevel(params: {
  level: number;
  hitDie: number;
  constitutionModifier: number;
  useAverage: boolean;
  ancestryHpPerLevel?: number;
}) {
  const { level, hitDie, constitutionModifier, useAverage, ancestryHpPerLevel = 0 } = params;
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError("Level must be between 1 and 20.");
  }

  const firstLevel = hitDie + constitutionModifier + ancestryHpPerLevel;
  if (level === 1) return firstLevel;

  const laterDie = useAverage ? Math.floor(hitDie / 2) + 1 : hitDie;
  const laterLevels = (level - 1) * (laterDie + constitutionModifier + ancestryHpPerLevel);
  return firstLevel + laterLevels;
}

export function expectedSubclassAvailable(
  ruleset: "dnd_2014" | "dnd_2024",
  characterLevel: number,
  subclassLevel2014: number,
  subclassLevel2024: number,
) {
  const unlock = ruleset === "dnd_2014" ? subclassLevel2014 : subclassLevel2024;
  return characterLevel >= unlock;
}
