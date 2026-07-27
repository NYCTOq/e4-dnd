import {
  runtimeApplySingleClassLevelUp,
  runtimeBuildMilestone,
  runtimeProgressionPb,
  runtimeCantripTier,
  runtimeSpellTier,
  runtimeTotalLevel,
  type LevelUpRuleset,
} from "./levelUpProgressionRules";

export type AbilityKey =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type CharacterClassEntry = {
  classId: string;
  classLevel: number;
  hitDie: number;
  subclassId?: string | null;
  [key: string]: unknown;
};

export type LevelUpHistoryEntry = {
  fromLevel: number;
  toLevel: number;
  classId: string;
  hpGained: number;
  grantsAsi: boolean;
  grantsSubclass: boolean;
  selectedFeatId?: string | null;
  abilityIncreases?: Partial<Record<AbilityKey, number>>;
};

export type LevelUpCompatibleCharacter = Record<string, unknown> & {
  id?: string;
  name?: string;
  level?: number;
  ruleset?: LevelUpRuleset;
  maxHp?: number;
  currentHp?: number;
  proficiencyBonus?: number;
  cantripTier?: number;
  spellTier?: number;
  constitution?: number;
  abilities?: Partial<Record<AbilityKey, number>>;
  classes?: CharacterClassEntry[];
  feats?: string[];
  pendingSubclassChoice?: boolean;
  levelUpHistory?: LevelUpHistoryEntry[];
};

export type LevelUpChoice = {
  classId: string;
  selectedFeatId?: string | null;
  abilityIncreases?: Partial<Record<AbilityKey, number>>;
};

const int = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

function resolveConstitutionScore(
  character: LevelUpCompatibleCharacter,
): number {
  if (typeof character.abilities?.constitution === "number") {
    return int(character.abilities.constitution, 10);
  }

  return int(character.constitution, 10);
}

function normalizeClasses(
  classes: CharacterClassEntry[] | undefined,
): CharacterClassEntry[] {
  if (!Array.isArray(classes)) return [];

  return classes
    .filter((entry) => entry && typeof entry.classId === "string")
    .map((entry) => ({
      ...entry,
      classId: entry.classId.trim().toLowerCase(),
      classLevel: Math.max(0, int(entry.classLevel)),
      hitDie: Math.max(1, int(entry.hitDie, 8)),
    }));
}

export function normalizeLevelUpCharacter<
  T extends LevelUpCompatibleCharacter,
>(character: T): T {
  const next = structuredClone(character);
  const classes = normalizeClasses(next.classes);
  const classLevels = Object.fromEntries(
    classes.map((entry) => [entry.classId, entry.classLevel]),
  );

  const derivedLevel = runtimeTotalLevel(classLevels);
  const level = Math.min(
    20,
    Math.max(1, int(next.level, derivedLevel || 1)),
  );

  next.level = level;
  next.ruleset =
    next.ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014";
  next.classes = classes;
  next.maxHp = Math.max(1, int(next.maxHp, 1));
  next.currentHp = Math.min(
    next.maxHp,
    Math.max(0, int(next.currentHp, next.maxHp)),
  );
  next.proficiencyBonus = runtimeProgressionPb(level);
  next.cantripTier = runtimeCantripTier(level);
  next.spellTier = runtimeSpellTier(level);
  next.feats = Array.isArray(next.feats)
    ? [...new Set(next.feats.map(String))]
    : [];
  next.levelUpHistory = Array.isArray(next.levelUpHistory)
    ? next.levelUpHistory
    : [];

  return next;
}

export function applyAbilityIncreases<
  T extends LevelUpCompatibleCharacter,
>(
  character: T,
  increases: Partial<Record<AbilityKey, number>>,
): T {
  const next = structuredClone(character);
  const abilities = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    ...next.abilities,
  };

  for (const [ability, amount] of Object.entries(increases)) {
    if (typeof amount !== "number") continue;

    const key = ability as AbilityKey;
    abilities[key] = Math.min(
      30,
      Math.max(1, int(abilities[key], 10) + int(amount)),
    );
  }

  next.abilities = abilities;
  return next;
}

export function applyFeatSelection<
  T extends LevelUpCompatibleCharacter,
>(
  character: T,
  featId: string,
): T {
  const next = structuredClone(character);
  const feats = Array.isArray(next.feats) ? next.feats.map(String) : [];

  if (!feats.includes(featId)) {
    feats.push(featId);
  }

  next.feats = feats;
  return next;
}

export function applyCharacterLevelUp<
  T extends LevelUpCompatibleCharacter,
>(
  character: T,
  choice: LevelUpChoice,
): T {
  const normalized = normalizeLevelUpCharacter(character);
  const classes = normalizeClasses(normalized.classes);
  const normalizedClassId = choice.classId
    .trim()
    .toLowerCase();

  const classEntry = classes.find(
    (entry) => entry.classId === normalizedClassId,
  );

  const previousLevel = Math.min(
    20,
    Math.max(1, int(normalized.level, 1)),
  );

  if (!classEntry || previousLevel >= 20) {
    return normalized;
  }

  const previousMaxHp = Math.max(
    1,
    int(normalized.maxHp, 1),
  );
  const ruleset = normalized.ruleset ?? "dnd_2014";

  const runtimeCharacter = runtimeApplySingleClassLevelUp(
    {
      level: previousLevel,
      ruleset,
      constitutionScore:
        resolveConstitutionScore(normalized),
      maxHp: previousMaxHp,
      classes,
    },
    classEntry.classId,
  );

  const runtimeClasses =
    runtimeCharacter.classes as CharacterClassEntry[];

  let next = {
    ...structuredClone(normalized),
    level: runtimeCharacter.level,
    maxHp: runtimeCharacter.maxHp,
    currentHp: Math.min(
      runtimeCharacter.maxHp,
      int(normalized.currentHp, previousMaxHp) +
        (runtimeCharacter.maxHp - previousMaxHp),
    ),
    classes: runtimeClasses,
    proficiencyBonus:
      runtimeProgressionPb(runtimeCharacter.level),
    cantripTier:
      runtimeCantripTier(runtimeCharacter.level),
    spellTier:
      runtimeSpellTier(runtimeCharacter.level),
  } as T;

  const nextClassEntry = runtimeClasses.find(
    (entry) => entry.classId === classEntry.classId,
  );

  const nextClassLevel =
    nextClassEntry?.classLevel ??
    classEntry.classLevel + 1;

  const milestone = runtimeBuildMilestone(
    classEntry.classId,
    ruleset,
    classEntry.classLevel,
    nextClassLevel,
  );

  if (milestone.grantsAsi) {
    if (choice.selectedFeatId) {
      next = applyFeatSelection(
        next,
        choice.selectedFeatId,
      );
    } else if (choice.abilityIncreases) {
      next = applyAbilityIncreases(
        next,
        choice.abilityIncreases,
      );
    }
  }

  next.pendingSubclassChoice =
    milestone.grantsSubclass &&
    !nextClassEntry?.subclassId;

  const history: LevelUpHistoryEntry[] =
    Array.isArray(next.levelUpHistory)
      ? next.levelUpHistory
      : [];

  const historyEntry: LevelUpHistoryEntry = {
    fromLevel: previousLevel,
    toLevel: runtimeCharacter.level,
    classId: classEntry.classId,
    hpGained:
      runtimeCharacter.maxHp - previousMaxHp,
    grantsAsi: milestone.grantsAsi,
    grantsSubclass: milestone.grantsSubclass,
    selectedFeatId:
      choice.selectedFeatId ?? null,
    abilityIncreases:
      choice.abilityIncreases,
  };

  next.levelUpHistory = [
    ...history,
    historyEntry,
  ];

  return next;
}

export function serializeLevelUpCharacter(
  character: LevelUpCompatibleCharacter,
): string {
  return JSON.stringify(character);
}

export function deserializeLevelUpCharacter<
  T extends LevelUpCompatibleCharacter,
>(payload: string): T {
  const parsed: unknown = JSON.parse(payload);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid level-up character payload.");
  }

  return normalizeLevelUpCharacter(parsed as T);
}
