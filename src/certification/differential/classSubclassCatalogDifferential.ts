import type { DndSubclassData, RulesetData } from "../../core/rulesets/ruleset.types";
import { CANONICAL_CLASS_IDS, CANONICAL_SUBCLASS_LEVELS } from "../reference/classSubclassCatalog.reference";

export type CatalogReferenceIssue = {
  edition: RulesetData["id"];
  category: "class" | "progression" | "subclass" | "spell";
  entity: string;
  reason: string;
};

export type ClassCatalogDifferentialRow = {
  classId: string;
  className2014: string;
  className2024: string;
  subclassLevel2014: number;
  subclassLevel2024: number;
  progressionRows2014: number;
  progressionRows2024: number;
  featureDifferences: number;
  subclasses2014: number;
  subclasses2024: number;
  sharedSubclassNames: string[];
  editionOnly2014: string[];
  editionOnly2024: string[];
};

const key = (value: string) => value.trim().toLowerCase();
const duplicateValues = (values: readonly string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values.map(key)) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
};

function subclassesFor(data: RulesetData, className: string) {
  return data.subclasses.filter((entry) => key(entry.className) === key(className));
}

function validateSubclass(
  subclass: DndSubclassData,
  data: RulesetData,
  classNames: ReadonlySet<string>,
  spellNames: ReadonlySet<string>,
): CatalogReferenceIssue[] {
  const issues: CatalogReferenceIssue[] = [];
  const add = (reason: string, category: CatalogReferenceIssue["category"] = "subclass") =>
    issues.push({ edition: data.id, category, entity: subclass.name, reason });
  if (subclass.ruleset !== data.id) add(`ruleset is ${subclass.ruleset}`);
  if (!classNames.has(key(subclass.className))) add(`parent class '${subclass.className}' is missing`);
  if (subclass.selectionLevel < 1 || subclass.selectionLevel > 20) add(`selection level ${subclass.selectionLevel} is outside 1-20`);
  if (!subclass.features.length) add("feature progression is empty");
  for (const feature of subclass.features) {
    if (feature.level < subclass.selectionLevel || feature.level > 20) {
      add(`feature '${feature.name}' has invalid level ${feature.level}`);
    }
  }
  for (const spell of subclass.bonusSpells ?? []) {
    if (!spellNames.has(key(spell))) add(`bonus spell '${spell}' is missing`, "spell");
  }
  return issues;
}

export function validateClassSubclassReferences(data: RulesetData): CatalogReferenceIssue[] {
  const issues: CatalogReferenceIssue[] = [];
  const classNames = new Set(data.classes.map((entry) => key(entry.name)));
  const spellNames = new Set(data.spells.map((entry) => key(entry.name)));
  const add = (category: CatalogReferenceIssue["category"], entity: string, reason: string) =>
    issues.push({ edition: data.id, category, entity, reason });

  for (const id of duplicateValues(data.classes.map((entry) => entry.id))) add("class", id, "duplicate class id");
  for (const name of duplicateValues(data.classes.map((entry) => entry.name))) add("class", name, "duplicate class name");
  for (const id of duplicateValues(data.subclasses.map((entry) => entry.id))) add("subclass", id, "duplicate subclass id");
  for (const name of duplicateValues(data.subclasses.map((entry) => entry.name))) add("subclass", name, "duplicate subclass name");

  for (const classId of CANONICAL_CLASS_IDS) {
    const klass = data.classes.find((entry) => entry.id === classId);
    if (!klass) {
      add("class", classId, "canonical class is missing");
      continue;
    }
    if (key(klass.name) !== classId) add("class", klass.name, `canonical id/name mismatch for '${classId}'`);
    if (klass.levels.length !== 20 || klass.levels.some((row, index) => row.level !== index + 1)) {
      add("progression", klass.name, "level 1-20 progression is not contiguous");
    }
    const expectedLevel = CANONICAL_SUBCLASS_LEVELS[data.id][classId];
    if (expectedLevel !== undefined && klass.subclassLevel !== expectedLevel) {
      add("class", klass.name, `subclass level ${klass.subclassLevel}; expected ${expectedLevel}`);
    }
  }

  for (const subclass of data.subclasses) {
    issues.push(...validateSubclass(subclass, data, classNames, spellNames));
    const parent = data.classes.find((entry) => key(entry.name) === key(subclass.className));
    if (parent && subclass.selectionLevel !== parent.subclassLevel) {
      add("subclass", subclass.name, `selection level ${subclass.selectionLevel}; parent ${parent.name} expects ${parent.subclassLevel}`);
    }
  }
  return issues;
}

export function buildClassSubclassCatalogDifferential(data2014: RulesetData, data2024: RulesetData) {
  const rows: ClassCatalogDifferentialRow[] = CANONICAL_CLASS_IDS.map((classId) => {
    const legacy = data2014.classes.find((entry) => entry.id === classId)!;
    const revised = data2024.classes.find((entry) => entry.id === classId)!;
    const legacySubclasses = subclassesFor(data2014, legacy.name);
    const revisedSubclasses = subclassesFor(data2024, revised.name);
    const legacyNames = new Map(legacySubclasses.map((entry) => [key(entry.name), entry.name]));
    const revisedNames = new Map(revisedSubclasses.map((entry) => [key(entry.name), entry.name]));
    return {
      classId,
      className2014: legacy.name,
      className2024: revised.name,
      subclassLevel2014: legacy.subclassLevel,
      subclassLevel2024: revised.subclassLevel,
      progressionRows2014: legacy.levels.length,
      progressionRows2024: revised.levels.length,
      featureDifferences: legacy.levels.filter((row, index) =>
        JSON.stringify(row.features) !== JSON.stringify(revised.levels[index]?.features ?? [])
      ).length,
      subclasses2014: legacySubclasses.length,
      subclasses2024: revisedSubclasses.length,
      sharedSubclassNames: [...legacyNames.keys()].filter((name) => revisedNames.has(name)).map((name) => legacyNames.get(name)!).sort(),
      editionOnly2014: [...legacyNames.keys()].filter((name) => !revisedNames.has(name)).map((name) => legacyNames.get(name)!).sort(),
      editionOnly2024: [...revisedNames.keys()].filter((name) => !legacyNames.has(name)).map((name) => revisedNames.get(name)!).sort(),
    };
  });
  const referenceIssues = [
    ...validateClassSubclassReferences(data2014),
    ...validateClassSubclassReferences(data2024),
  ];
  return {
    package: "v5.120B",
    version: "5.120.1",
    status: referenceIssues.length ? "BLOCKED" : "GREEN",
    matchedClasses: rows.length,
    comparedProgressionRows: rows.reduce((total, row) => total + row.progressionRows2014 + row.progressionRows2024, 0),
    rows,
    referenceIssues,
    nextPackage: "v5.120C",
    nextTarget: "Golden Class and Subclass Integration",
  } as const;
}

