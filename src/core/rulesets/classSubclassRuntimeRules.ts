export type ClassRuntimeRulesetId = "dnd_2014" | "dnd_2024";
export type FeatureActivation =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive"
  | "special";
export type FeatureRecovery = "short" | "long" | "both" | "manual";

export type LimitedUseRule =
  | { type: "fixed"; value: number }
  | { type: "proficiency-bonus" }
  | {
      type: "ability-modifier";
      abilityScore: number;
      minimum?: number;
    }
  | {
      type: "class-level-divisor";
      divisor: number;
      minimum?: number;
    }
  | { type: "class-level" };

export type RuntimeFeature = {
  id: string;
  classId: string;
  subclassId?: string;
  level: number;
  activation: FeatureActivation;
  currentUses?: number;
  maxUses?: number;
  maxUsesRule?: LimitedUseRule;
  recovery?: FeatureRecovery;
};

const integer = (value: unknown, fallback = 0): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.floor(value);
};

export function runtimeProficiencyBonus(level: number): number {
  const normalized = Math.min(20, Math.max(1, integer(level, 1)));
  return 2 + Math.floor((normalized - 1) / 4);
}

export function runtimeAbilityModifier(score: number): number {
  return Math.floor((integer(score, 10) - 10) / 2);
}

export function runtimeSubclassFeatureLevels(
  ruleset: ClassRuntimeRulesetId,
  classId: string,
): number[] {
  if (ruleset === "dnd_2024") {
    return [3, 6, 10, 14];
  }

  switch (String(classId).trim().toLowerCase()) {
    case "cleric":
      return [1, 2, 6, 8, 17];
    case "sorcerer":
      return [1, 6, 14, 18];
    case "warlock":
    case "wizard":
    case "druid":
      return [
        classId.trim().toLowerCase() === "warlock" ? 1 : 2,
        6,
        10,
        14,
      ];
    case "fighter":
      return [3, 7, 10, 15, 18];
    case "rogue":
      return [3, 9, 13, 17];
    default:
      return [3, 6, 11, 17];
  }
}

export function runtimeFeatureUnlocked(
  featureLevel: number,
  classLevel: number,
): boolean {
  return Math.max(0, integer(classLevel)) >=
    Math.max(1, integer(featureLevel, 1));
}

export function runtimeTotalCharacterLevel(
  classLevels: Record<string, number>,
): number {
  return Object.values(classLevels).reduce(
    (sum, level) => sum + Math.max(0, integer(level)),
    0,
  );
}

export function runtimeClassLevel(
  classLevels: Record<string, number>,
  classId: string,
): number {
  return Math.max(0, integer(classLevels[classId]));
}

export function runtimeResolveLimitedUses(
  rule: LimitedUseRule,
  context: {
    characterLevel: number;
    classLevel: number;
  },
): number {
  switch (rule.type) {
    case "fixed":
      return Math.max(0, integer(rule.value));
    case "proficiency-bonus":
      return runtimeProficiencyBonus(context.characterLevel);
    case "ability-modifier":
      return Math.max(
        integer(rule.minimum),
        runtimeAbilityModifier(rule.abilityScore),
      );
    case "class-level-divisor":
      return Math.max(
        integer(rule.minimum),
        Math.floor(
          Math.max(0, integer(context.classLevel)) /
            Math.max(1, integer(rule.divisor, 1)),
        ),
      );
    case "class-level":
      return Math.max(0, integer(context.classLevel));
  }
}

export function runtimeNormalizeActivation(
  activation: unknown,
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
  if (value === "passive" || value === "none") {
    return "passive";
  }

  return "special";
}

export function runtimeRecoverUses(
  current: number,
  maximum: number,
  recovery: FeatureRecovery,
  rest: "short" | "long",
): number {
  const max = Math.max(0, integer(maximum));
  const normalizedCurrent = Math.min(
    max,
    Math.max(0, integer(current)),
  );

  const shouldRecover =
    recovery === "both" ||
    recovery === rest ||
    (rest === "long" && recovery === "short");

  return shouldRecover ? max : normalizedCurrent;
}

export function normalizeRuntimeFeature(
  feature: Partial<RuntimeFeature>,
): RuntimeFeature {
  const maxUses =
    typeof feature.maxUses === "number"
      ? Math.max(0, integer(feature.maxUses))
      : undefined;

  return {
    id: String(feature.id ?? "").trim(),
    classId: String(feature.classId ?? "").trim(),
    ...(feature.subclassId
      ? { subclassId: String(feature.subclassId).trim() }
      : {}),
    level: Math.max(1, integer(feature.level, 1)),
    activation: runtimeNormalizeActivation(feature.activation),
    ...(typeof feature.currentUses === "number"
      ? {
          currentUses:
            maxUses === undefined
              ? Math.max(0, integer(feature.currentUses))
              : Math.min(
                  maxUses,
                  Math.max(0, integer(feature.currentUses)),
                ),
        }
      : {}),
    ...(maxUses === undefined ? {} : { maxUses }),
    ...(feature.maxUsesRule
      ? { maxUsesRule: structuredClone(feature.maxUsesRule) }
      : {}),
    ...(feature.recovery
      ? { recovery: feature.recovery }
      : {}),
  };
}

export function runtimeUnlockedFeatures(
  features: RuntimeFeature[],
  classLevels: Record<string, number>,
): RuntimeFeature[] {
  return features
    .map(normalizeRuntimeFeature)
    .filter((feature) =>
      runtimeFeatureUnlocked(
        feature.level,
        runtimeClassLevel(classLevels, feature.classId),
      ),
    );
}

export function runtimeRecoverFeature(
  feature: RuntimeFeature,
  rest: "short" | "long",
): RuntimeFeature {
  const normalized = normalizeRuntimeFeature(feature);

  if (
    normalized.maxUses === undefined ||
    normalized.currentUses === undefined ||
    !normalized.recovery
  ) {
    return normalized;
  }

  return {
    ...normalized,
    currentUses: runtimeRecoverUses(
      normalized.currentUses,
      normalized.maxUses,
      normalized.recovery,
      rest,
    ),
  };
}
