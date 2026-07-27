export type ProgressionRuleset = "dnd_2014" | "dnd_2024";

export function clampCharacterLevel(level: number): number {
  return Math.min(20, Math.max(1, Math.floor(level)));
}

export function progressionProficiencyBonus(level: number): number {
  const normalized = clampCharacterLevel(level);
  return 2 + Math.floor((normalized - 1) / 4);
}

export function abilityScoreModifier(score: number): number {
  return Math.floor((Math.floor(score) - 10) / 2);
}

export function canTakeAbilityScoreImprovement(
  classId: string,
  classLevel: number,
): boolean {
  const level = clampCharacterLevel(classLevel);
  const normalizedClass = classId.trim().toLowerCase();

  if (normalizedClass === "fighter") {
    return [4, 6, 8, 12, 14, 16, 19].includes(level);
  }

  if (normalizedClass === "rogue") {
    return [4, 8, 10, 12, 16, 19].includes(level);
  }

  return [4, 8, 12, 16, 19].includes(level);
}

export function subclassUnlockLevel(
  classId: string,
  ruleset: ProgressionRuleset,
): number {
  const normalizedClass = classId.trim().toLowerCase();

  if (ruleset === "dnd_2024") return 3;

  if (["cleric", "sorcerer", "warlock"].includes(normalizedClass)) {
    return 1;
  }

  if (["druid", "wizard"].includes(normalizedClass)) {
    return 2;
  }

  return 3;
}

export function gainsSubclassAtLevel(
  classId: string,
  ruleset: ProgressionRuleset,
  previousLevel: number,
  nextLevel: number,
): boolean {
  const unlock = subclassUnlockLevel(classId, ruleset);
  return previousLevel < unlock && nextLevel >= unlock;
}

export function hitPointsGainedOnLevelUp(
  hitDie: number,
  constitutionScore: number,
  fixedAverage = true,
): number {
  const die = Math.max(1, Math.floor(hitDie));
  const base = fixedAverage
    ? Math.floor(die / 2) + 1
    : die;

  return Math.max(
    1,
    base + abilityScoreModifier(constitutionScore),
  );
}

export function totalCharacterLevel(
  classLevels: Record<string, number>,
): number {
  return Object.values(classLevels).reduce(
    (sum, level) =>
      sum + Math.max(0, Math.floor(level)),
    0,
  );
}

export function nextCharacterLevel(
  currentLevel: number,
): number {
  return Math.min(20, clampCharacterLevel(currentLevel) + 1);
}

export function canLevelUp(currentLevel: number): boolean {
  return clampCharacterLevel(currentLevel) < 20;
}

export function spellSlotProgressionTier(
  casterLevel: number,
): number {
  const level = Math.max(0, Math.floor(casterLevel));
  if (level <= 0) return 0;
  return Math.min(9, Math.ceil(level / 2));
}

export function cantripScalingTier(level: number): number {
  const normalized = clampCharacterLevel(level);
  if (normalized >= 17) return 4;
  if (normalized >= 11) return 3;
  if (normalized >= 5) return 2;
  return 1;
}
