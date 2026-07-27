export type LevelUpRuleset = "dnd_2014" | "dnd_2024";

export type LevelUpClassState = {
  classId: string;
  classLevel: number;
  hitDie: number;
};

export type LevelUpCharacterState = {
  level: number;
  ruleset: LevelUpRuleset;
  constitutionScore: number;
  maxHp: number;
  classes: LevelUpClassState[];
};

export type LevelUpMilestone = {
  level: number;
  proficiencyBonus: number;
  grantsAsi: boolean;
  grantsSubclass: boolean;
  cantripTier: number;
  spellTier: number;
};

export function runtimeClampLevel(level: number): number {
  return Math.min(20, Math.max(1, Math.floor(level)));
}

export function runtimeProgressionPb(level: number): number {
  const normalized = runtimeClampLevel(level);
  return 2 + Math.floor((normalized - 1) / 4);
}

export function runtimeAbilityModifier(score: number): number {
  return Math.floor((Math.floor(score) - 10) / 2);
}

export function runtimeAsiLevel(
  classId: string,
  classLevel: number,
): boolean {
  const level = runtimeClampLevel(classLevel);
  const normalizedClass = classId.trim().toLowerCase();

  if (normalizedClass === "fighter") {
    return [4, 6, 8, 12, 14, 16, 19].includes(level);
  }

  if (normalizedClass === "rogue") {
    return [4, 8, 10, 12, 16, 19].includes(level);
  }

  return [4, 8, 12, 16, 19].includes(level);
}

export function runtimeSubclassUnlockLevel(
  classId: string,
  ruleset: LevelUpRuleset,
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

export function runtimeGainsSubclass(
  classId: string,
  ruleset: LevelUpRuleset,
  previousLevel: number,
  nextLevel: number,
): boolean {
  const unlock = runtimeSubclassUnlockLevel(
    classId,
    ruleset,
  );

  return previousLevel < unlock && nextLevel >= unlock;
}

export function runtimeLevelUpHpGain(
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
    base + runtimeAbilityModifier(constitutionScore),
  );
}

export function runtimeTotalLevel(
  classLevels: Record<string, number>,
): number {
  return Object.values(classLevels).reduce(
    (sum, level) =>
      sum + Math.max(0, Math.floor(level)),
    0,
  );
}

export function runtimeNextLevel(
  currentLevel: number,
): number {
  return Math.min(
    20,
    runtimeClampLevel(currentLevel) + 1,
  );
}

export function runtimeCanLevelUp(
  currentLevel: number,
): boolean {
  return runtimeClampLevel(currentLevel) < 20;
}

export function runtimeSpellTier(
  casterLevel: number,
): number {
  const level = Math.max(0, Math.floor(casterLevel));
  if (level <= 0) return 0;
  return Math.min(9, Math.ceil(level / 2));
}

export function runtimeCantripTier(
  level: number,
): number {
  const normalized = runtimeClampLevel(level);

  if (normalized >= 17) return 4;
  if (normalized >= 11) return 3;
  if (normalized >= 5) return 2;
  return 1;
}

export function runtimeBuildMilestone(
  classId: string,
  ruleset: LevelUpRuleset,
  previousLevel: number,
  nextLevel: number,
): LevelUpMilestone {
  const level = runtimeClampLevel(nextLevel);

  return {
    level,
    proficiencyBonus: runtimeProgressionPb(level),
    grantsAsi: runtimeAsiLevel(classId, level),
    grantsSubclass: runtimeGainsSubclass(
      classId,
      ruleset,
      previousLevel,
      level,
    ),
    cantripTier: runtimeCantripTier(level),
    spellTier: runtimeSpellTier(level),
  };
}

export function runtimeApplySingleClassLevelUp(
  character: LevelUpCharacterState,
  classId: string,
): LevelUpCharacterState {
  if (!runtimeCanLevelUp(character.level)) {
    return structuredClone(character);
  }

  const next = structuredClone(character);
  const classEntry = next.classes.find(
    (entry) => entry.classId === classId,
  );

  if (!classEntry) return next;

  const hpGain = runtimeLevelUpHpGain(
    classEntry.hitDie,
    next.constitutionScore,
  );

  classEntry.classLevel = Math.min(
    20,
    classEntry.classLevel + 1,
  );

  next.level = runtimeNextLevel(next.level);
  next.maxHp = Math.max(1, next.maxHp + hpGain);

  return next;
}
