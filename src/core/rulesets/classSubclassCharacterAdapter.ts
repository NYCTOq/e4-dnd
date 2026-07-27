import {
  normalizeRuntimeFeature,
  runtimeClassLevel,
  runtimeProficiencyBonus,
  runtimeRecoverFeature,
  runtimeResolveLimitedUses,
  runtimeSubclassFeatureLevels,
  runtimeTotalCharacterLevel,
  runtimeUnlockedFeatures,
  type ClassRuntimeRulesetId,
  type RuntimeFeature,
} from "./classSubclassRuntimeRules";

export type CharacterClassEntry = {
  classId: string;
  level: number;
  subclassId?: string;
};

export type ClassCompatibleCharacter = Record<string, unknown> & {
  id?: string;
  name?: string;
  ruleset?: string;
  level?: number;
  classId?: string;
  subclassId?: string;
  classes?: CharacterClassEntry[];
  classFeatures?: RuntimeFeature[];
};

export type ClassRuntimeSnapshot = {
  ruleset: ClassRuntimeRulesetId;
  characterLevel: number;
  proficiencyBonus: number;
  classLevels: Record<string, number>;
  unlockedFeatures: RuntimeFeature[];
};

const int = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

export function resolveClassRuleset(
  character: ClassCompatibleCharacter,
): ClassRuntimeRulesetId {
  return character.ruleset === "dnd_2024" ? "dnd_2024" : "dnd_2014";
}

export function characterClassEntries(
  character: ClassCompatibleCharacter,
): CharacterClassEntry[] {
  if (Array.isArray(character.classes) && character.classes.length > 0) {
    return character.classes
      .filter((entry) => entry && typeof entry.classId === "string")
      .map((entry) => ({
        classId: entry.classId.trim(),
        level: Math.max(0, int(entry.level)),
        ...(entry.subclassId
          ? { subclassId: entry.subclassId.trim() }
          : {}),
      }));
  }

  const classId = String(character.classId ?? "").trim();
  if (!classId) return [];

  return [
    {
      classId,
      level: Math.max(0, int(character.level, 1)),
      ...(character.subclassId
        ? { subclassId: String(character.subclassId).trim() }
        : {}),
    },
  ];
}

export function characterClassLevels(
  character: ClassCompatibleCharacter,
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const entry of characterClassEntries(character)) {
    result[entry.classId] = (result[entry.classId] ?? 0) + entry.level;
  }

  return result;
}

export function buildClassRuntimeSnapshot(
  character: ClassCompatibleCharacter,
): ClassRuntimeSnapshot {
  const classLevels = characterClassLevels(character);
  const characterLevel =
    runtimeTotalCharacterLevel(classLevels) ||
    Math.max(1, int(character.level, 1));

  const features = Array.isArray(character.classFeatures)
    ? character.classFeatures.map(normalizeRuntimeFeature)
    : [];

  const unlocked = runtimeUnlockedFeatures(features, classLevels).map(
    (feature) => {
      if (!feature.maxUsesRule) return feature;

      const maximum = runtimeResolveLimitedUses(feature.maxUsesRule, {
        characterLevel,
        classLevel: runtimeClassLevel(classLevels, feature.classId),
      });

      return {
        ...feature,
        maxUses: maximum,
        currentUses:
          typeof feature.currentUses === "number"
            ? Math.min(maximum, Math.max(0, feature.currentUses))
            : maximum,
      };
    },
  );

  return {
    ruleset: resolveClassRuleset(character),
    characterLevel,
    proficiencyBonus: runtimeProficiencyBonus(characterLevel),
    classLevels,
    unlockedFeatures: unlocked,
  };
}

export function subclassUnlockState(
  character: ClassCompatibleCharacter,
): Record<string, number[]> {
  const ruleset = resolveClassRuleset(character);
  const result: Record<string, number[]> = {};

  for (const entry of characterClassEntries(character)) {
    result[entry.classId] = runtimeSubclassFeatureLevels(
      ruleset,
      entry.classId,
    ).filter((level) => level <= entry.level);
  }

  return result;
}

export function applyClassFeatureRest<
  T extends ClassCompatibleCharacter,
>(character: T, rest: "short" | "long"): T {
  const next = structuredClone(character);

  if (!Array.isArray(next.classFeatures)) {
    next.classFeatures = [];
    return next;
  }

  next.classFeatures = next.classFeatures.map((feature) =>
    runtimeRecoverFeature(feature, rest),
  );

  return next;
}

export function serializeClassCompatibleCharacter(
  character: ClassCompatibleCharacter,
): string {
  return JSON.stringify(character);
}

export function deserializeClassCompatibleCharacter<
  T extends ClassCompatibleCharacter,
>(payload: string): T {
  const parsed: unknown = JSON.parse(payload);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid class-compatible character payload.");
  }

  return parsed as T;
}
