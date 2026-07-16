import type { DndClassData } from "./ruleset.types";
import type { RulesetId } from "../character/character.types";

export type ProgressionAudit = { ready: boolean; issues: string[]; coveredLevels: number };

export function getClassAsiLevels(className: string, ruleset: RulesetId) {
  const levels = ruleset === "dnd_2024" ? [4, 8, 12, 16] : [4, 8, 12, 16, 19];
  const key = className.trim().toLowerCase();
  if (key === "fighter") levels.push(6, 14);
  if (key === "rogue") levels.push(10);
  return [...new Set(levels)].sort((a, b) => a - b);
}

export function enrichClassProgression(classData: DndClassData, ruleset: RulesetId): DndClassData {
  const asiLevels = new Set(getClassAsiLevels(classData.name, ruleset));
  return {
    ...classData,
    levels: classData.levels.map((row) => {
      const features = [...row.features];
      if (asiLevels.has(row.level) && !features.some((feature) => /ability score|feat/i.test(feature))) features.push("Ability Score Improvement / Feat");
      if (ruleset === "dnd_2024" && row.level === 19 && !features.some((feature) => /epic boon/i.test(feature))) features.push("Epic Boon");
      return { ...row, features };
    }),
  };
}

export function auditClassProgression(classData: DndClassData, ruleset: RulesetId): ProgressionAudit {
  const issues: string[] = [];
  const levels = new Set(classData.levels.map((row) => row.level));
  const missing = Array.from({ length: 20 }, (_, index) => index + 1).filter((level) => !levels.has(level));
  if (missing.length) issues.push(`Eksik level satırları: ${missing.join(", ")}`);
  if (!classData.levels.some((row) => row.level === classData.subclassLevel)) issues.push("Subclass seçim seviyesi progression içinde yok.");
  for (const level of getClassAsiLevels(classData.name, ruleset)) {
    if (!classData.levels.find((row) => row.level === level)?.features.some((feature) => /ability score|feat/i.test(feature))) issues.push(`Level ${level} ASI/feat işareti eksik.`);
  }
  if (!classData.levels.find((row) => row.level === 20)?.features.length) issues.push("Level 20 capstone özelliği eksik.");
  if (classData.spellProgression !== "none" && !classData.levels.some((row) => row.spellSlots?.some((slot) => slot > 0) || row.pactMagic)) issues.push("Spell slot progression eksik.");
  return { ready: issues.length === 0, issues, coveredLevels: levels.size };
}
