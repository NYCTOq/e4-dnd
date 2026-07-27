export type ClassRulesetId = "dnd_2014" | "dnd_2024";
export type FeatureActivation =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive"
  | "special";
export type RecoveryType = "short" | "long" | "both" | "manual";

export type ClassFeatureReference = {
  id: string;
  classId: string;
  subclassId?: string;
  level: number;
  activation: FeatureActivation;
  maxUses?: number;
  maxUsesFormula?: LimitedUseFormula;
  recovery?: RecoveryType;
};

export type LimitedUseFormula =
  | { type: "fixed"; value: number }
  | { type: "proficiency-bonus" }
  | { type: "ability-modifier"; abilityScore: number; minimum?: number }
  | { type: "class-level-divisor"; divisor: number; minimum?: number }
  | { type: "class-level" };

export function proficiencyBonus(characterLevel: number): number {
  const level = Math.min(20, Math.max(1, Math.floor(characterLevel)));
  return 2 + Math.floor((level - 1) / 4);
}

export function abilityModifier(score: number): number {
  return Math.floor((Math.floor(score) - 10) / 2);
}

export function subclassFeatureLevels(
  ruleset: ClassRulesetId,
  classId: string,
): number[] {
  if (ruleset === "dnd_2024") {
    return [3, 6, 10, 14];
  }

  const normalized = classId.trim().toLowerCase();

  if (normalized === "cleric") return [1, 2, 6, 8, 17];
  if (normalized === "sorcerer") return [1, 6, 14, 18];
  if (normalized === "warlock") return [1, 6, 10, 14];
  if (normalized === "wizard") return [2, 6, 10, 14];
  if (normalized === "druid") return [2, 6, 10, 14];
  if (normalized === "fighter") return [3, 7, 10, 15, 18];
  if (normalized === "rogue") return [3, 9, 13, 17];

  return [3, 6, 11, 17];
}

export function isFeatureUnlocked(
  featureLevel: number,
  classLevel: number,
): boolean {
  return Math.max(0, Math.floor(classLevel)) >=
    Math.max(1, Math.floor(featureLevel));
}

export function unlockedFeatures(
  features: ClassFeatureReference[],
  classLevels: Record<string, number>,
): ClassFeatureReference[] {
  return features.filter((feature) =>
    isFeatureUnlocked(
      feature.level,
      classLevels[feature.classId] ?? 0,
    ),
  );
}

export function resolveLimitedUses(
  formula: LimitedUseFormula,
  context: {
    characterLevel: number;
    classLevel: number;
  },
): number {
  switch (formula.type) {
    case "fixed":
      return Math.max(0, Math.floor(formula.value));
    case "proficiency-bonus":
      return proficiencyBonus(context.characterLevel);
    case "ability-modifier":
      return Math.max(
        formula.minimum ?? 0,
        abilityModifier(formula.abilityScore),
      );
    case "class-level-divisor":
      return Math.max(
        formula.minimum ?? 0,
        Math.floor(
          Math.max(0, context.classLevel) /
            Math.max(1, formula.divisor),
        ),
      );
    case "class-level":
      return Math.max(0, Math.floor(context.classLevel));
  }
}

export function recoverFeatureUses(
  current: number,
  maximum: number,
  recovery: RecoveryType,
  rest: "short" | "long",
): number {
  const max = Math.max(0, Math.floor(maximum));
  const value = Math.min(max, Math.max(0, Math.floor(current)));

  const recovers =
    recovery === "both" ||
    recovery === rest ||
    (rest === "long" && recovery === "short");

  return recovers ? max : value;
}

export function normalizeActivation(
  activation: string | undefined,
): FeatureActivation {
  const value = String(activation ?? "").trim().toLowerCase();

  if (value === "action") return "action";
  if (
    value === "bonus action" ||
    value === "bonus-action" ||
    value === "bonus_action"
  ) {
    return "bonus-action";
  }
  if (value === "reaction") return "reaction";
  if (value === "passive" || value === "none") return "passive";

  return "special";
}

export function totalCharacterLevel(
  classLevels: Record<string, number>,
): number {
  return Object.values(classLevels).reduce(
    (sum, level) => sum + Math.max(0, Math.floor(level)),
    0,
  );
}

export function classLevel(
  classLevels: Record<string, number>,
  classId: string,
): number {
  return Math.max(
    0,
    Math.floor(classLevels[classId] ?? 0),
  );
}
