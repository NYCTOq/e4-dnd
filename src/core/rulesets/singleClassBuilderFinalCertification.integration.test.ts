import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { certifyBarbarianBuilder, summarizeBarbarianCertification } from "./barbarianBuilderCertification";
import { certifyBardBuilder, summarizeBardCertification } from "./bardBuilderCertification";
import { certifyClericBuilder, summarizeClericCertification } from "./clericBuilderCertification";
import { certifyDruidBuilder, summarizeDruidCertification } from "./druidBuilderCertification";
import { certifyFighterBuilder, summarizeFighterCertification } from "./fighterBuilderCertification";
import { certifyMonkBuilder, summarizeMonkCertification } from "./monkBuilderCertification";
import { certifyPaladinBuilder, summarizePaladinCertification } from "./paladinBuilderCertification";
import { certifyRangerBuilder, summarizeRangerCertification } from "./rangerBuilderCertification";
import { certifyRogueBuilder, summarizeRogueCertification } from "./rogueBuilderCertification";
import { certifySorcererBuilder, summarizeSorcererCertification } from "./sorcererBuilderCertification";
import { certifyWarlockBuilder, summarizeWarlockCertification } from "./warlockBuilderCertification";
import { certifyWizardBuilder, summarizeWizardCertification } from "./wizardBuilderCertification";

type Edition = "2014" | "2024";
type RulesetId = `dnd_${Edition}`;
type CertificationSummary = { ready: boolean; scenarioCount: number; blockerCount: number };

const load = <T,>(path: string): T =>
  JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;

function loadEdition(edition: Edition) {
  const ruleset = `dnd_${edition}` as RulesetId;
  const classes = load<DndClassData[]>(`public/data/${ruleset}/classes.json`);
  const races = load<DndRaceData[]>(`public/data/${ruleset}/races.json`);
  const baseSubclasses = load<DndSubclassData[]>(`public/data/${ruleset}/subclasses.json`);
  const expansion = edition === "2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024;
  const subclasses = [
    ...baseSubclasses,
    ...expansion.filter((item) => !baseSubclasses.some((existing) => existing.id === item.id)),
  ];
  return { ruleset, classes, races, subclasses };
}

function requireClass(classes: DndClassData[], id: string) {
  const classData = classes.find((item) => item.id === id);
  if (!classData) throw new Error(`Certification class missing: ${id}`);
  return classData;
}

function certifyEdition(edition: Edition) {
  const { ruleset, classes, races, subclasses } = loadEdition(edition);
  const summaries: Array<{ classId: string; summary: CertificationSummary }> = [
    { classId: "barbarian", summary: summarizeBarbarianCertification(certifyBarbarianBuilder(ruleset, requireClass(classes, "barbarian"), races, subclasses)) },
    { classId: "bard", summary: summarizeBardCertification(certifyBardBuilder(ruleset, requireClass(classes, "bard"), races, subclasses)) },
    { classId: "cleric", summary: summarizeClericCertification(certifyClericBuilder(ruleset, requireClass(classes, "cleric"), races, subclasses)) },
    { classId: "druid", summary: summarizeDruidCertification(certifyDruidBuilder(ruleset, requireClass(classes, "druid"), races, subclasses)) },
    { classId: "fighter", summary: summarizeFighterCertification(certifyFighterBuilder(ruleset, requireClass(classes, "fighter"), races, subclasses)) },
    { classId: "monk", summary: summarizeMonkCertification(certifyMonkBuilder(ruleset, requireClass(classes, "monk"), races, subclasses)) },
    { classId: "paladin", summary: summarizePaladinCertification(certifyPaladinBuilder(ruleset, requireClass(classes, "paladin"), races, subclasses)) },
    { classId: "ranger", summary: summarizeRangerCertification(certifyRangerBuilder(ruleset, requireClass(classes, "ranger"), races, subclasses)) },
    { classId: "rogue", summary: summarizeRogueCertification(certifyRogueBuilder(ruleset, requireClass(classes, "rogue"), races, subclasses)) },
    { classId: "sorcerer", summary: summarizeSorcererCertification(certifySorcererBuilder(ruleset, requireClass(classes, "sorcerer"), races, subclasses)) },
    { classId: "warlock", summary: summarizeWarlockCertification(certifyWarlockBuilder(ruleset, requireClass(classes, "warlock"), races, subclasses)) },
    { classId: "wizard", summary: summarizeWizardCertification(certifyWizardBuilder(ruleset, requireClass(classes, "wizard"), races, subclasses)) },
  ];
  return {
    ruleset,
    raceCount: races.length,
    summaries,
    scenarioCount: summaries.reduce((total, item) => total + item.summary.scenarioCount, 0),
    blockerCount: summaries.reduce((total, item) => total + item.summary.blockerCount, 0),
  };
}

describe("single-class builder final certification", () => {
  it.each(["2014", "2024"] as const)("certifies all %s race/species × subclass × level scenarios", (edition) => {
    const result = certifyEdition(edition);
    expect(result.raceCount).toBe(edition === "2014" ? 9 : 10);
    expect(result.summaries).toHaveLength(12);
    expect(result.summaries.filter((item) => !item.summary.ready)).toEqual([]);
    expect(result.blockerCount).toBe(0);
    expect(result.scenarioCount).toBeGreaterThan(9_000);
  });

  it("keeps subclass selection at each class's official unlock level", () => {
    for (const edition of ["2014", "2024"] as const) {
      const { classes, subclasses } = loadEdition(edition);
      for (const classData of classes) {
        const classSubclasses = subclasses.filter(
          (subclass) => subclass.className.toLowerCase() === classData.name.toLowerCase(),
        );
        expect(classSubclasses.length, `${edition} ${classData.name} has no subclasses`).toBeGreaterThan(0);
        for (const subclass of classSubclasses) {
          expect(subclass.selectionLevel, `${edition} ${subclass.name}`).toBe(classData.subclassLevel);
          expect(
            subclass.features.every((feature) => feature.level >= subclass.selectionLevel),
            `${edition} ${subclass.name} exposes a feature before selection`,
          ).toBe(true);
        }
      }
    }
  });
});
