import { buildClassSubclassRuntimeClosureReport } from "../../core/rulesets/classSubclassRuntimeClosure";
import { getLevel20Certification } from "../../core/rulesets/level20Certification";
import type { RulesetData } from "../../core/rulesets/ruleset.types";

export type CatalogIntegrityEdition = {
  edition: RulesetData["id"];
  classes: number;
  subclasses: number;
  progressionRows: number;
  invalidClassProgressions: string[];
  orphanSubclasses: string[];
  invalidSelectionLevels: string[];
  missingBonusSpells: string[];
  runtimeBlockers: string[];
  runtimeWarnings: string[];
};

export function inspectClassSubclassCatalog(data: RulesetData): CatalogIntegrityEdition {
  const classNames = new Set(data.classes.map((entry) => entry.name.toLowerCase()));
  const spellNames = new Set(data.spells.map((entry) => entry.name.toLowerCase()));
  const invalidClassProgressions = data.classes
    .filter((entry) => entry.levels.length !== 20 ||
      entry.levels.some((level, index) => level.level !== index + 1))
    .map((entry) => entry.name);
  const orphanSubclasses = data.subclasses
    .filter((entry) => !classNames.has(entry.className.toLowerCase()))
    .map((entry) => entry.name);
  const invalidSelectionLevels = data.subclasses
    .filter((entry) => entry.selectionLevel < 1 || entry.selectionLevel > 20 ||
      !entry.features.some((feature) => feature.level >= entry.selectionLevel))
    .map((entry) => entry.name);
  const missingBonusSpells = data.subclasses.flatMap((entry) =>
    (entry.bonusSpells ?? [])
      .filter((spell) => !spellNames.has(spell.toLowerCase()))
      .map((spell) => `${entry.name}: ${spell}`)
  );
  const runtime = buildClassSubclassRuntimeClosureReport(data);
  return {
    edition: data.id,
    classes: data.classes.length,
    subclasses: data.subclasses.length,
    progressionRows: data.classes.reduce((total, entry) => total + entry.levels.length, 0),
    invalidClassProgressions,
    orphanSubclasses,
    invalidSelectionLevels,
    missingBonusSpells,
    runtimeBlockers: runtime.blockers,
    runtimeWarnings: runtime.warnings,
  };
}

export function buildClassSubclassCatalogDiscovery(rulesets: readonly RulesetData[]) {
  const editions = rulesets.map(inspectClassSubclassCatalog);
  const blockers = editions.flatMap((entry) => [
    ...entry.invalidClassProgressions.map((name) => `${entry.edition}: invalid progression ${name}`),
    ...entry.orphanSubclasses.map((name) => `${entry.edition}: orphan subclass ${name}`),
    ...entry.invalidSelectionLevels.map((name) => `${entry.edition}: invalid selection ${name}`),
    ...entry.missingBonusSpells.map((name) => `${entry.edition}: missing bonus spell ${name}`),
    ...entry.runtimeBlockers.map((name) => `${entry.edition}: ${name}`),
  ]);
  const level20 = rulesets.map((ruleset) => getLevel20Certification(ruleset));
  return {
    package: "v5.120A",
    version: "5.120.0",
    status: rulesets.length === 2 && editions.every((entry) => entry.classes === 12)
      ? "READY_FOR_CLOSURE"
      : "BLOCKED",
    editions,
    blockers,
    level20Scores: level20.map((entry) => entry.score),
    nextPackage: "v5.120B",
    nextTarget: "Catalog Differential and Reference Integrity",
  } as const;
}
