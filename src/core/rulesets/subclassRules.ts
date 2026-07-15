import type { DndSpellData, DndSubclassData, SubclassFeatureData } from "./ruleset.types";

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

export function getAlwaysPreparedSpells(subclassData: DndSubclassData | null | undefined, highestSpellLevel: number, spells: readonly DndSpellData[]) {
  if (!subclassData?.bonusSpells?.length || highestSpellLevel < 1) return [];
  const names = new Set(subclassData.bonusSpells.map((name) => name.trim().toLowerCase()));
  return spells.filter((spell) => spell.level > 0 && spell.level <= highestSpellLevel && (names.has(spell.name.toLowerCase()) || names.has(spell.id.toLowerCase())));
}
