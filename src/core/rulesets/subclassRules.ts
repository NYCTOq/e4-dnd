import type { DndSubclassData, SubclassFeatureData } from "./ruleset.types";

export function getSubclassesForClass(subclasses: DndSubclassData[], className: string) {
  return subclasses.filter((item) => item.className === className);
}

export function getUnlockedSubclassFeatures(subclassData: DndSubclassData | null | undefined, level: number): SubclassFeatureData[] {
  if (!subclassData) return [];
  return subclassData.features.filter((feature) => feature.level <= level).sort((a, b) => a.level - b.level);
}

export function isSubclassAvailable(subclassData: DndSubclassData, level: number) {
  return level >= subclassData.selectionLevel;
}
