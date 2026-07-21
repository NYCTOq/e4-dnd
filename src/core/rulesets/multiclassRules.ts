import type {
  AbilityKey,
  AbilityScores,
  CharacterClassLevel,
  CharacterHitDiePool,
  CharacterSpellSlot,
  RulesetId,
} from "../character/character.types";
import type { DndClassData } from "./ruleset.types";

type AbilityRequirement = { allOf?: AbilityKey[]; anyOf?: AbilityKey[]; minimum: number };

const requirements: Record<string, AbilityRequirement[]> = {
  barbarian: [{ allOf: ["str"], minimum: 13 }],
  bard: [{ allOf: ["cha"], minimum: 13 }],
  cleric: [{ allOf: ["wis"], minimum: 13 }],
  druid: [{ allOf: ["wis"], minimum: 13 }],
  fighter: [{ anyOf: ["str", "dex"], minimum: 13 }],
  monk: [{ allOf: ["dex", "wis"], minimum: 13 }],
  paladin: [{ allOf: ["str", "cha"], minimum: 13 }],
  ranger: [{ allOf: ["dex", "wis"], minimum: 13 }],
  rogue: [{ allOf: ["dex"], minimum: 13 }],
  sorcerer: [{ allOf: ["cha"], minimum: 13 }],
  warlock: [{ allOf: ["cha"], minimum: 13 }],
  wizard: [{ allOf: ["int"], minimum: 13 }],
};

const hitDice: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};

const slots: Record<number, number[]> = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
  7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

const proficiencyGains2014: Record<string, string[]> = {
  barbarian: ["Shields", "Simple weapons", "Martial weapons"],
  bard: ["Light armor", "One skill", "One musical instrument"],
  cleric: ["Light armor", "Medium armor", "Shields"],
  druid: ["Light armor", "Medium armor", "Shields"],
  fighter: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
  monk: ["Simple weapons", "Shortswords"],
  paladin: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
  ranger: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons", "One Ranger skill"],
  rogue: ["Light armor", "One Rogue skill", "Thieves' tools"],
  sorcerer: [],
  warlock: ["Light armor", "Simple weapons"],
  wizard: [],
};

const proficiencyGains2024: Record<string, string[]> = {
  barbarian: ["Shields", "Simple weapons", "Martial weapons"],
  bard: ["Light armor", "One skill", "One musical instrument"],
  cleric: ["Light armor", "Medium armor", "Shields"],
  druid: ["Light armor", "Shields"],
  fighter: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
  monk: ["Simple weapons", "Martial weapons with the Light property"],
  paladin: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons"],
  ranger: ["Light armor", "Medium armor", "Shields", "Simple weapons", "Martial weapons", "One Ranger skill"],
  rogue: ["Light armor", "One Rogue skill", "Thieves' tools"],
  sorcerer: [],
  warlock: ["Light armor", "Simple weapons"],
  wizard: [],
};

export function normalizeClassLevels(
  value: CharacterClassLevel[] | undefined,
  className: string,
  totalLevel: number,
) {
  const valid = (value ?? [])
    .filter((item) => item && typeof item.className === "string" && item.className.trim() && item.level > 0)
    .map((item) => ({ ...item, className: item.className.trim(), level: Math.max(1, Math.min(20, Math.floor(item.level))) }));
  if (!valid.length) return [{ className, level: Math.max(1, Math.min(20, totalLevel)) }];
  const merged = new Map<string, CharacterClassLevel>();
  for (const item of valid) {
    const previous = merged.get(item.className);
    merged.set(item.className, previous
      ? { ...previous, level: previous.level + item.level, subclass: item.subclass ?? previous.subclass }
      : item);
  }
  const normalized = [...merged.values()];
  const total = normalized.reduce((sum, item) => sum + item.level, 0);
  return total === totalLevel ? normalized : [{ className, level: Math.max(1, Math.min(20, totalLevel)) }];
}

export function getClassLevel(levels: CharacterClassLevel[], className: string) {
  return levels.find((item) => item.className === className)?.level ?? 0;
}

export function getMulticlassEligibility(className: string, abilities: AbilityScores) {
  const classRequirements = requirements[className.toLowerCase()] ?? [];
  const missing: string[] = [];
  for (const requirement of classRequirements) {
    if (requirement.allOf) {
      for (const ability of requirement.allOf) {
        if (abilities[ability] < requirement.minimum) missing.push(`${ability.toUpperCase()} ${requirement.minimum}`);
      }
    }
    if (requirement.anyOf && !requirement.anyOf.some((ability) => abilities[ability] >= requirement.minimum)) {
      missing.push(`${requirement.anyOf.map((ability) => ability.toUpperCase()).join(" veya ")} ${requirement.minimum}`);
    }
  }
  return { eligible: missing.length === 0, missing };
}

export function getMulticlassTransitionEligibility(
  levels: CharacterClassLevel[],
  targetClassName: string,
  abilities: AbilityScores,
) {
  if (getClassLevel(levels, targetClassName) > 0) return { eligible: true, missing: [] as string[] };
  const classNames = [...new Set([...levels.map((item) => item.className), targetClassName])];
  const missing = classNames.flatMap((className) =>
    getMulticlassEligibility(className, abilities).missing.map((entry) => `${className}: ${entry}`),
  );
  return { eligible: missing.length === 0, missing };
}

export function addClassLevel(levels: CharacterClassLevel[], className: string, subclass?: string) {
  const found = levels.find((item) => item.className === className);
  return found
    ? levels.map((item) => item.className === className
      ? { ...item, level: item.level + 1, subclass: subclass ?? item.subclass }
      : item)
    : [...levels, { className, level: 1, subclass }];
}

function getProgression(item: CharacterClassLevel, classes: DndClassData[]) {
  const data = classes.find((candidate) => candidate.name === item.className);
  if (data?.spellProgression && data.spellProgression !== "none") return data.spellProgression;
  const subclass = item.subclass?.toLowerCase() ?? "";
  if (item.className.toLowerCase() === "fighter" && subclass.includes("eldritch knight")) return "third";
  if (item.className.toLowerCase() === "rogue" && subclass.includes("arcane trickster")) return "third";
  return "none";
}

export function getCombinedCasterLevel(
  levels: CharacterClassLevel[],
  classes: DndClassData[],
  ruleset: RulesetId = "dnd_2014",
) {
  return Math.min(20, levels.reduce((sum, item) => {
    const progression = getProgression(item, classes);
    if (progression === "full") return sum + item.level;
    if (progression === "half") return sum + (ruleset === "dnd_2024" ? Math.ceil(item.level / 2) : Math.floor(item.level / 2));
    if (progression === "third") return sum + Math.floor(item.level / 3);
    return sum;
  }, 0));
}

export function getMulticlassSpellSlots(
  levels: CharacterClassLevel[],
  classes: DndClassData[],
  current: CharacterSpellSlot[] = [],
  ruleset: RulesetId = "dnd_2014",
) {
  const casterLevel = getCombinedCasterLevel(levels, classes, ruleset);
  const currentMap = new Map(current.map((item) => [item.level, item]));
  return (slots[casterLevel] ?? []).map((max, index) => ({
    level: index + 1,
    max,
    used: Math.min(max, currentMap.get(index + 1)?.used ?? 0),
  }));
}

export function getMulticlassPactMagicSlots(
  levels: CharacterClassLevel[],
  classes: DndClassData[],
  current: CharacterSpellSlot[] = [],
) {
  const pactClass = levels
    .map((level) => ({ level, data: classes.find((item) => item.name === level.className) }))
    .find((item) => item.data?.spellProgression === "pact");
  if (!pactClass?.data) return [];
  const pact = pactClass.data.levels.find((row) => row.level === pactClass.level.level)?.pactMagic;
  if (!pact) return [];
  return [{ level: pact.slotLevel, max: pact.slots, used: Math.min(pact.slots, current[0]?.used ?? 0) }];
}

export function getMulticlassHitDice(levels: CharacterClassLevel[], current: CharacterHitDiePool[] = []) {
  const grouped = new Map<number, number>();
  for (const item of levels) {
    const die = hitDice[item.className.toLowerCase()] ?? 8;
    grouped.set(die, (grouped.get(die) ?? 0) + item.level);
  }
  return [...grouped]
    .sort((a, b) => b[0] - a[0])
    .map(([die, max]) => ({ die, max, used: Math.min(max, current.find((item) => item.die === die)?.used ?? 0) }));
}

export function getMulticlassAttacksPerAction(levels: CharacterClassLevel[]) {
  let attacks = 1;
  for (const item of levels) {
    const key = item.className.toLowerCase();
    if (key === "fighter") attacks = Math.max(attacks, item.level >= 20 ? 4 : item.level >= 11 ? 3 : item.level >= 5 ? 2 : 1);
    else if (["barbarian", "monk", "paladin", "ranger"].includes(key) && item.level >= 5) attacks = Math.max(attacks, 2);
  }
  return attacks;
}

export function getMulticlassProficiencyGains(className: string, ruleset: RulesetId) {
  const table = ruleset === "dnd_2024" ? proficiencyGains2024 : proficiencyGains2014;
  return [...(table[className.toLowerCase()] ?? [])];
}

export function getMulticlassConflictSummary(levels: CharacterClassLevel[]) {
  const warnings: string[] = [];
  const extraAttackSources = levels.filter((item) => {
    const key = item.className.toLowerCase();
    return key === "fighter" ? item.level >= 5 : ["barbarian", "monk", "paladin", "ranger"].includes(key) && item.level >= 5;
  });
  if (extraAttackSources.length > 1) warnings.push("Extra Attack kaynakları birleşmez; yalnız en yüksek saldırı sayısı kullanılır.");
  const unarmoredSources = levels.filter((item) => {
    const key = item.className.toLowerCase();
    return (key === "barbarian" || key === "monk") && item.level >= 1;
  });
  if (unarmoredSources.length > 1) warnings.push("Unarmored Defense formülleri birleşmez; tek bir AC hesaplama yöntemi seçilir.");
  return warnings;
}
