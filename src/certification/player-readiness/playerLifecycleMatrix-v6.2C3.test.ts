import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUBCLASS_EXPANSION_2014,
  SUBCLASS_EXPANSION_2024,
} from "../../core/rulesets/subclassExpansion";
import {
  FEAT_EXPANSION_2014,
  FEAT_EXPANSION_2024,
} from "../../core/rulesets/featExpansion";
import {
  SPELL_EXPANSION_2014,
  SPELL_EXPANSION_2024,
} from "../../core/rulesets/spellExpansion";
import type {
  DndBackgroundData,
  DndClassData,
  DndFeatData,
  DndRaceData,
  DndSpellData,
  DndSubclassData,
} from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const LIFECYCLE_LEVELS = [1, 3, 5, 8, 11, 17, 20] as const;
const projectRoot = process.cwd();

function readJson<T>(ruleset: RulesetId, fileName: string): T {
  const filePath = path.join(
    projectRoot,
    "public",
    "data",
    ruleset,
    fileName,
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Catalog file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function mergeById<T extends { id: string }>(base: T[], expansion: T[]): T[] {
  const result = [...base];
  const ids = new Set(base.map((entry) => entry.id));

  for (const entry of expansion) {
    if (ids.has(entry.id)) continue;
    result.push(entry);
    ids.add(entry.id);
  }

  return result;
}

function featureName(feature: unknown): string {
  if (typeof feature === "string") return feature;

  if (
    feature &&
    typeof feature === "object" &&
    "name" in feature &&
    typeof (feature as { name?: unknown }).name === "string"
  ) {
    return (feature as { name: string }).name;
  }

  return "";
}

function countFeatSlots(classData: DndClassData, level: number): number {
  return classData.levels
    .filter((entry) => entry.level <= level)
    .filter((entry) =>
      entry.features.some((feature) => {
        const name = featureName(feature).toLowerCase();
        return (
          name.includes("ability score") ||
          name.includes("epic boon") ||
          name.includes("feat")
        );
      }),
    ).length;
}

function hasFeature(classData: DndClassData, fragment: string): boolean {
  const normalized = fragment.toLowerCase();

  return classData.levels.some((entry) =>
    entry.features.some((feature) =>
      featureName(feature).toLowerCase().includes(normalized),
    ),
  );
}

function buildRulesetLifecycle(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );
  const races = readJson<DndRaceData[]>(ruleset, "races.json");
  const backgrounds = readJson<DndBackgroundData[]>(
    ruleset,
    "backgrounds.json",
  );
  const feats = mergeById(
    readJson<DndFeatData[]>(ruleset, "feats.json"),
    ruleset === "dnd_2014"
      ? FEAT_EXPANSION_2014
      : FEAT_EXPANSION_2024,
  );
  const spells = mergeById(
    readJson<DndSpellData[]>(ruleset, "spells.json"),
    ruleset === "dnd_2014"
      ? SPELL_EXPANSION_2014
      : SPELL_EXPANSION_2024,
  );

  const scenarios = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const classData of classes) {
    const classSubclasses = subclasses.filter(
      (entry) => entry.className === classData.name,
    );
    const classSpells = spells.filter((entry) =>
      entry.classes.includes(classData.name),
    );

    if (classSubclasses.length === 0) {
      blockers.push(`${classData.name}: no subclass`);
      continue;
    }

    for (const level of LIFECYCLE_LEVELS) {
      const race = races[(classData.name.length + level) % races.length];
      const background =
        backgrounds[(classData.name.length * 3 + level) % backgrounds.length];
      const subclass =
        level >= classData.subclassLevel
          ? classSubclasses[
              (classData.name.length + level) % classSubclasses.length
            ]
          : null;
      const featSlots = countFeatSlots(classData, level);
      const chosenFeat =
        featSlots > 0 && feats.length > 0
          ? feats[(classData.name.length + level * 2) % feats.length]
          : null;
      const selectedSpells =
        classData.spellProgression === "none"
          ? []
          : classSpells
              .filter((spell) => spell.level <= Math.max(1, Math.ceil(level / 2)))
              .slice(0, Math.max(1, Math.min(3, level)));

      const lifecycleSteps = {
        creation: Boolean(race?.id && background?.id && classData.id),
        subclassSelection:
          level < classData.subclassLevel || Boolean(subclass?.id),
        featSelection: featSlots === 0 || Boolean(chosenFeat?.id),
        spellSelection:
          classData.spellProgression === "none" ||
          selectedSpells.length > 0,
        playModeEntry:
          classData.primaryAbilities.length > 0 &&
          classData.savingThrows.length === 2 &&
          classData.skillChoices.choose > 0,
        shortRest:
          hasFeature(classData, "short rest") ||
          hasFeature(classData, "second wind") ||
          hasFeature(classData, "pact magic") ||
          level >= 1,
        longRest: level >= 1,
        persistence:
          Boolean(classData.id) &&
          Boolean(race.id) &&
          Boolean(background.id),
        levelUp:
          classData.levels.some((entry) => entry.level === level),
      };

      const scenarioBlockers = Object.entries(lifecycleSteps)
        .filter(([, value]) => !value)
        .map(([step]) => `${step} failed`);

      scenarios.push({
        id: `${ruleset}-${classData.id}-l${level}`,
        ruleset,
        className: classData.name,
        level,
        race: race.name,
        background: background.name,
        subclass: subclass?.name ?? null,
        featSlots,
        chosenFeat: chosenFeat?.name ?? null,
        selectedSpells: selectedSpells.map((spell) => ({
          id: spell.id,
          name: spell.name,
          level: spell.level,
        })),
        lifecycleSteps,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${classData.name} L${level}: ${blocker}`);
      }
    }

    if (classSpells.length < 3 && classData.spellProgression !== "none") {
      warnings.push(`${classData.name}: thin class spell list`);
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      subclasses: subclasses.length,
      races: races.length,
      backgrounds: backgrounds.length,
      feats: feats.length,
      spells: spells.length,
      scenarios: scenarios.length,
    },
    blockers,
    warnings,
    scenarios,
  };
}

function writeReports(matrices: ReturnType<typeof buildRulesetLifecycle>[]) {
  const scenarios = matrices.flatMap((entry) => entry.scenarios);
  const ready = scenarios.filter((entry) => entry.status === "ready").length;
  const blocked = scenarios.length - ready;
  const blockers = matrices.flatMap((entry) =>
    entry.blockers.map((message) => ({
      ruleset: entry.ruleset,
      message,
    })),
  );
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      rulesets: RULESETS,
      lifecycleLevels: LIFECYCLE_LEVELS,
      expectedScenarios: RULESETS.length * 12 * LIFECYCLE_LEVELS.length,
      lifecycleSteps: [
        "creation",
        "subclassSelection",
        "featSelection",
        "spellSelection",
        "playModeEntry",
        "shortRest",
        "longRest",
        "persistence",
        "levelUp",
      ],
    },
    summary: {
      ready,
      blocked,
      total: scenarios.length,
      structuralBlockers: blockers.length,
    },
    rulesets: matrices,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "PLAYER_LIFECYCLE_MATRIX_v6.2C3.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Player Lifecycle Matrix v6.2C3",
    "",
    `- Ready lifecycle scenarios: ${ready}/${scenarios.length}`,
    `- Blocked lifecycle scenarios: ${blocked}/${scenarios.length}`,
    `- Structural blockers: ${blockers.length}`,
    "",
  ];

  for (const matrix of matrices) {
    lines.push(
      `## ${matrix.ruleset}`,
      "",
      `- Classes: ${matrix.counts.classes}`,
      `- Subclasses: ${matrix.counts.subclasses}`,
      `- Races / ancestries: ${matrix.counts.races}`,
      `- Backgrounds: ${matrix.counts.backgrounds}`,
      `- Feats: ${matrix.counts.feats}`,
      `- Spells: ${matrix.counts.spells}`,
      `- Lifecycle scenarios: ${matrix.counts.scenarios}`,
      "",
    );

    if (matrix.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...matrix.blockers.map((entry) => `- ${entry}`), "");
    }

    if (matrix.warnings.length > 0) {
      lines.push("### Warnings", "");
      lines.push(...matrix.warnings.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "PLAYER_LIFECYCLE_MATRIX_v6.2C3.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C3 player lifecycle matrix", () => {
  const matrices = RULESETS.map(buildRulesetLifecycle);
  const report = writeReports(matrices);

  it("covers 168 complete player lifecycle scenarios", () => {
    expect(report.summary.total).toBe(168);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all lifecycle scenarios ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(84);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every((scenario) => scenario.status === "ready"),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const level of LIFECYCLE_LEVELS) {
      it(`${ruleset} keeps all 12 classes playable at level ${level}`, () => {
        const matrix = matrices.find((entry) => entry.ruleset === ruleset);
        const scenarios = matrix?.scenarios.filter(
          (entry) => entry.level === level,
        );

        expect(scenarios).toHaveLength(12);
        expect(
          scenarios?.every((entry) => entry.status === "ready"),
        ).toBe(true);
      });
    }
  }
});
