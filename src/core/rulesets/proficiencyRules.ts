import type { DndBackgroundData, DndClassData } from "./ruleset.types";

export const ALL_SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History",
  "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival",
] as const;

export function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function getGrantedSkills(background: DndBackgroundData | null) {
  return uniqueStrings(background?.skillProficiencies ?? []);
}

export function getAvailableClassSkills(classData: DndClassData | null, background: DndBackgroundData | null) {
  const granted = new Set(getGrantedSkills(background));
  return (classData?.skillChoices.from ?? []).filter((skill) => !granted.has(skill));
}

export function normalizeClassSkillChoices(selected: string[], classData: DndClassData | null, background: DndBackgroundData | null) {
  const allowed = new Set(getAvailableClassSkills(classData, background));
  return uniqueStrings(selected).filter((skill) => allowed.has(skill)).slice(0, classData?.skillChoices.choose ?? 0);
}

export function buildFinalSkillProficiencies(selected: string[], classData: DndClassData | null, background: DndBackgroundData | null) {
  return uniqueStrings([...getGrantedSkills(background), ...normalizeClassSkillChoices(selected, classData, background)]);
}

export function normalizeExpertise(expertise: string[], proficientSkills: string[], limit: number) {
  const proficient = new Set(proficientSkills);
  return uniqueStrings(expertise).filter((skill) => proficient.has(skill)).slice(0, Math.max(0, limit));
}

export function getExpertiseLimit(className: string, level: number, ruleset = "dnd_2014") {
  const normalized = className.trim().toLowerCase();
  if (normalized === "rogue") return level >= 6 ? 4 : 2;
  if (normalized === "bard") return ruleset === "dnd_2024" ? (level >= 9 ? 4 : level >= 2 ? 2 : 0) : (level >= 10 ? 4 : level >= 3 ? 2 : 0);
  return 0;
}
