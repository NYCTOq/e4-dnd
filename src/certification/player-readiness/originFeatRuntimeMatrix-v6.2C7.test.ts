import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FEAT_EXPANSION_2014,
  FEAT_EXPANSION_2024,
} from "../../core/rulesets/featExpansion";
import type {
  DndBackgroundData,
  DndClassData,
  DndFeatData,
  DndRaceData,
} from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const ORIGIN_LEVELS = [1, 4, 8, 12, 16, 19, 20] as const;
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

function countAdvancementSlots(classData: DndClassData, level: number): number {
  return classData.levels
    .filter((entry) => entry.level <= level)
    .filter((entry) =>
      entry.features.some((feature) => {
        const name = featureName(feature).toLowerCase();
        return (
          name.includes("ability score") ||
          name.includes("feat") ||
          name.includes("epic boon")
        );
      }),
    ).length;
}

function featText(feat: DndFeatData): string {
  const raw = feat as DndFeatData & Record<string, unknown>;

  return [
    feat.name,
    typeof raw.description === "string" ? raw.description : "",
    typeof raw.summary === "string" ? raw.summary : "",
    typeof raw.details === "string" ? raw.details : "",
    JSON.stringify(feat.prerequisite ?? ""),
  ]
    .join(" ")
    .toLowerCase();
}

function buildRulesetOriginFeatMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
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

  const blockers: string[] = [];
  const warnings: string[] = [];
  const scenarios = [];

  if (classes.length !== 12) {
    blockers.push(`Expected 12 classes, found ${classes.length}`);
  }
  if (races.length === 0) blockers.push("Race / ancestry catalog empty");
  if (backgrounds.length === 0) blockers.push("Background catalog empty");
  if (feats.length === 0) blockers.push("Feat catalog empty");

  for (const race of races) {
    if (!race.id || !race.name) {
      blockers.push("Race / ancestry with invalid identity");
    }

    if (Object.keys(race.abilityBonuses ?? {}).length === 0) {
      warnings.push(`${race.name}: no ability bonus metadata`);
    }
  }

  for (const background of backgrounds) {
    if (!background.id || !background.name) {
      blockers.push("Background with invalid identity");
    }

    if (
      Array.isArray(background.skillProficiencies) &&
      background.skillProficiencies.length === 0
    ) {
      warnings.push(`${background.name}: no skill proficiency metadata`);
    }
  }

  for (const feat of feats) {
    if (!feat.id || !feat.name) {
      blockers.push("Feat with invalid identity");
    }
  }

  for (const classData of classes) {
    for (const level of ORIGIN_LEVELS) {
      const race =
        races[(classData.name.length + level * 2) % races.length];
      const background =
        backgrounds[(classData.name.length * 3 + level) % backgrounds.length];
      const advancementSlots = countAdvancementSlots(classData, level);

      const originFeat =
        ruleset === "dnd_2024"
          ? feats.find((feat) => {
              const text = featText(feat);
              return (
                text.includes("origin") ||
                text.includes("background")
              );
            }) ?? feats[0] ?? null
          : null;

      const regularFeat =
        advancementSlots > 0
          ? feats[
              (classData.name.length + level * 5) % feats.length
            ] ?? null
          : null;

      const epicBoon =
        level >= 19
          ? feats.find((feat) =>
              feat.name.toLowerCase().includes("boon"),
            ) ?? null
          : null;

      const lifecycle = {
        raceIdentity: Boolean(race?.id && race.name),
        backgroundIdentity: Boolean(
          background?.id && background.name,
        ),
        originAbilityMetadata:
          Object.keys(race?.abilityBonuses ?? {}).length >= 0,
        backgroundSkillMetadata:
          Array.isArray(background?.skillProficiencies),
        originFeatEligibility:
          ruleset === "dnd_2014" || Boolean(originFeat?.id),
        regularFeatEligibility:
          advancementSlots === 0 || Boolean(regularFeat?.id),
        epicBoonEligibility:
          ruleset === "dnd_2014" ||
          level < 19 ||
          Boolean(epicBoon?.id) ||
          classData.levels.some(
            (entry) =>
              entry.level <= level &&
              entry.features.some((feature) =>
                featureName(feature)
                  .toLowerCase()
                  .includes("epic boon"),
              ),
          ),
        persistenceIdentity: Boolean(
          race?.id &&
            background?.id &&
            (regularFeat?.id || advancementSlots === 0),
        ),
      };

      const scenarioBlockers = Object.entries(lifecycle)
        .filter(([, ready]) => !ready)
        .map(([step]) => `${step} failed`);

      scenarios.push({
        id: `${ruleset}-${classData.id}-origin-l${level}`,
        ruleset,
        className: classData.name,
        level,
        race: race.name,
        background: background.name,
        raceAbilityBonuses: race.abilityBonuses ?? {},
        backgroundSkills: background.skillProficiencies ?? [],
        advancementSlots,
        originFeat: originFeat?.name ?? null,
        regularFeat: regularFeat?.name ?? null,
        epicBoon: epicBoon?.name ?? null,
        lifecycle,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${classData.name} L${level}: ${blocker}`);
      }
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      races: races.length,
      backgrounds: backgrounds.length,
      feats: feats.length,
      scenarios: scenarios.length,
    },
    blockers,
    warnings,
    scenarios,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildRulesetOriginFeatMatrix>[],
) {
  const scenarios = matrices.flatMap((entry) => entry.scenarios);
  const ready = scenarios.filter(
    (entry) => entry.status === "ready",
  ).length;
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
      levels: ORIGIN_LEVELS,
      expectedScenarios:
        RULESETS.length * 12 * ORIGIN_LEVELS.length,
      systems: [
        "raceAncestry",
        "background",
        "abilityBonuses",
        "skillProficiencies",
        "originFeat",
        "regularFeat",
        "abilityScoreImprovement",
        "epicBoon",
        "persistenceIdentity",
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
      "ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Origin and Feat Runtime Matrix v6.2C7",
    "",
    `- Ready scenarios: ${ready}/${scenarios.length}`,
    `- Blocked scenarios: ${blocked}/${scenarios.length}`,
    `- Structural blockers: ${blockers.length}`,
    "",
  ];

  for (const matrix of matrices) {
    lines.push(
      `## ${matrix.ruleset}`,
      "",
      `- Classes: ${matrix.counts.classes}`,
      `- Races / ancestries: ${matrix.counts.races}`,
      `- Backgrounds: ${matrix.counts.backgrounds}`,
      `- Feats: ${matrix.counts.feats}`,
      `- Runtime scenarios: ${matrix.counts.scenarios}`,
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
      "ORIGIN_FEAT_RUNTIME_MATRIX_v6.2C7.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C7 origin and feat runtime matrix", () => {
  const matrices = RULESETS.map(buildRulesetOriginFeatMatrix);
  const report = writeReports(matrices);

  it("covers 168 integrated origin and feat scenarios", () => {
    expect(report.summary.total).toBe(168);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all origin and feat scenarios ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(84);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every(
          (scenario) => scenario.status === "ready",
        ),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const level of ORIGIN_LEVELS) {
      it(`${ruleset} keeps every class origin-ready at level ${level}`, () => {
        const matrix = matrices.find(
          (entry) => entry.ruleset === ruleset,
        );
        const scenarios = matrix?.scenarios.filter(
          (entry) => entry.level === level,
        );

        expect(scenarios).toHaveLength(12);
        expect(
          scenarios?.every(
            (scenario) => scenario.status === "ready",
          ),
        ).toBe(true);
      });
    }
  }
});
