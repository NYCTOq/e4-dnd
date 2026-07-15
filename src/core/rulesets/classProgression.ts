import type { ClassLevelData, DndClassData } from "./ruleset.types";

export function getClassLevel(classData: DndClassData, level: number): ClassLevelData {
  const safeLevel = Math.min(20, Math.max(1, Math.floor(level || 1)));
  return classData.levels.find((entry) => entry.level === safeLevel) ?? classData.levels[0];
}

export function getFeaturesThroughLevel(classData: DndClassData, level: number): string[] {
  const safeLevel = Math.min(20, Math.max(1, Math.floor(level || 1)));
  return classData.levels
    .filter((entry) => entry.level <= safeLevel)
    .flatMap((entry) => entry.features);
}

export function getNewFeaturesAtLevel(classData: DndClassData, level: number): string[] {
  return getClassLevel(classData, level).features;
}

export function formatSpellSlots(slots?: number[]): string {
  if (!slots?.length) return "—";
  return slots.map((count, index) => `${index + 1}:${count}`).join(" · ");
}
