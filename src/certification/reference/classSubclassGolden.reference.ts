import type { RulesetData } from "../../core/rulesets/ruleset.types";

export type ClassSubclassGoldenProfile = {
  id: string;
  edition: Extract<RulesetData["id"], "dnd_2014" | "dnd_2024">;
  classId: string;
  className: string;
  subclassId: string;
  subclassName: string;
  level: number;
};

const legacy = [
  ["barbarian", "Barbarian", "path-of-the-berserker", "Path of the Berserker", 3],
  ["bard", "Bard", "college-of-lore", "College of Lore", 3],
  ["cleric", "Cleric", "life-domain", "Life Domain", 1],
  ["druid", "Druid", "circle-of-the-land", "Circle of the Land", 2],
  ["fighter", "Fighter", "champion", "Champion", 3],
  ["monk", "Monk", "way-of-the-open-hand", "Way of the Open Hand", 3],
  ["paladin", "Paladin", "oath-of-devotion", "Oath of Devotion", 3],
  ["ranger", "Ranger", "hunter", "Hunter", 3],
  ["rogue", "Rogue", "thief", "Thief", 3],
  ["sorcerer", "Sorcerer", "draconic-bloodline", "Draconic Bloodline", 1],
  ["warlock", "Warlock", "the-fiend", "The Fiend", 1],
  ["wizard", "Wizard", "school-of-evocation", "School of Evocation", 2],
] as const;

const revised = [
  ["barbarian", "Barbarian", "path-of-the-berserker-2024", "Path of the Berserker", 3],
  ["bard", "Bard", "college-of-lore-2024", "College of Lore", 3],
  ["cleric", "Cleric", "life-domain-2024", "Life Domain", 3],
  ["druid", "Druid", "circle-of-the-land-2024", "Circle of the Land", 3],
  ["fighter", "Fighter", "champion-2024", "Champion", 3],
  ["monk", "Monk", "warrior-of-the-open-hand", "Warrior of the Open Hand", 3],
  ["paladin", "Paladin", "oath-of-devotion-2024", "Oath of Devotion", 3],
  ["ranger", "Ranger", "hunter-2024", "Hunter", 3],
  ["rogue", "Rogue", "thief-2024", "Thief", 3],
  ["sorcerer", "Sorcerer", "draconic-sorcery", "Draconic Sorcery", 3],
  ["warlock", "Warlock", "fiend-patron-2024", "Fiend Patron", 3],
  ["wizard", "Wizard", "evoker", "Evoker", 3],
] as const;

const profiles = (
  edition: ClassSubclassGoldenProfile["edition"],
  rows: readonly (readonly [string, string, string, string, number])[],
): ClassSubclassGoldenProfile[] => rows.map(([classId, className, subclassId, subclassName, level]) => ({
  id: `${edition}-${classId}-${subclassId}`,
  edition,
  classId,
  className,
  subclassId,
  subclassName,
  level,
}));

export const CLASS_SUBCLASS_GOLDEN_PROFILES: readonly ClassSubclassGoldenProfile[] = [
  ...profiles("dnd_2014", legacy),
  ...profiles("dnd_2024", revised),
];

