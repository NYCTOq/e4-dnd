import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DndClassData } from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const LEVEL_SPLITS = [
  [1, 1],
  [3, 2],
  [5, 3],
  [8, 4],
  [10, 10],
] as const;

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

function casterContribution(
  classData: DndClassData,
  level: number,
): number {
  if (classData.spellProgression === "none") return 0;
  if (classData.spellProgression === "half") {
    return Math.floor(level / 2);
  }
  if (classData.spellProgression === "pact") {
    return 0;
  }
  return level;
}

function buildRulesetMulticlassMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const blockers: string[] = [];
  const warnings: string[] = [];
  const scenarios = [];

  if (classes.length !== 12) {
    blockers.push(`Expected 12 classes, found ${classes.length}`);
  }

  const classPairs = [];

  for (let left = 0; left < classes.length; left += 1) {
    for (let right = left + 1; right < classes.length; right += 1) {
      classPairs.push([classes[left], classes[right]] as const);
    }
  }

  for (const [primaryClass, secondaryClass] of classPairs) {
    for (const [primaryLevel, secondaryLevel] of LEVEL_SPLITS) {
      const totalLevel = primaryLevel + secondaryLevel;
      const primaryFeatures = primaryClass.levels
        .filter((entry) => entry.level <= primaryLevel)
        .flatMap((entry) => entry.features.map(featureName))
        .filter(Boolean);
      const secondaryFeatures = secondaryClass.levels
        .filter((entry) => entry.level <= secondaryLevel)
        .flatMap((entry) => entry.features.map(featureName))
        .filter(Boolean);

      const primaryCasterContribution = casterContribution(
        primaryClass,
        primaryLevel,
      );
      const secondaryCasterContribution = casterContribution(
        secondaryClass,
        secondaryLevel,
      );
      const combinedCasterLevel =
        primaryCasterContribution + secondaryCasterContribution;

      const hasPactMagic =
        primaryClass.spellProgression === "pact" ||
        secondaryClass.spellProgression === "pact";

      const lifecycle = {
        primaryProgression:
          primaryClass.levels.some(
            (entry) => entry.level === primaryLevel,
          ),
        secondaryProgression:
          secondaryClass.levels.some(
            (entry) => entry.level === secondaryLevel,
          ),
        totalLevelCap: totalLevel <= 20,
        savingThrowOwnership:
          primaryClass.savingThrows.length === 2,
        multiclassSkillIntegrity:
          primaryClass.skillChoices.choose > 0 &&
          secondaryClass.skillChoices.from.length > 0,
        featureVisibility:
          primaryFeatures.length > 0 &&
          secondaryFeatures.length > 0,
        casterCombination:
          combinedCasterLevel >= 0 &&
          combinedCasterLevel <= totalLevel,
        pactMagicSeparation:
          !hasPactMagic ||
          primaryClass.spellProgression === "pact" ||
          secondaryClass.spellProgression === "pact",
        persistenceIdentity:
          Boolean(primaryClass.id && secondaryClass.id),
        levelUpContinuity:
          primaryLevel >= 1 &&
          secondaryLevel >= 1 &&
          totalLevel >= 2,
      };

      const scenarioBlockers = Object.entries(lifecycle)
        .filter(([, ready]) => !ready)
        .map(([step]) => `${step} failed`);

      scenarios.push({
        id: `${ruleset}-${primaryClass.id}-${primaryLevel}-${secondaryClass.id}-${secondaryLevel}`,
        ruleset,
        primaryClass: primaryClass.name,
        primaryLevel,
        secondaryClass: secondaryClass.name,
        secondaryLevel,
        totalLevel,
        primarySpellProgression: primaryClass.spellProgression,
        secondarySpellProgression: secondaryClass.spellProgression,
        combinedCasterLevel,
        hasPactMagic,
        primaryFeatureCount: primaryFeatures.length,
        secondaryFeatureCount: secondaryFeatures.length,
        lifecycle,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(
          `${primaryClass.name} ${primaryLevel} / ${secondaryClass.name} ${secondaryLevel}: ${blocker}`,
        );
      }
    }
  }

  if (classPairs.length !== 66) {
    blockers.push(`Expected 66 class pairs, found ${classPairs.length}`);
  }

  if (
    !classes.some((entry) => entry.spellProgression === "pact")
  ) {
    warnings.push("No Pact Magic class detected");
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      classPairs: classPairs.length,
      levelSplits: LEVEL_SPLITS.length,
      scenarios: scenarios.length,
    },
    blockers,
    warnings,
    scenarios,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildRulesetMulticlassMatrix>[],
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
      classPairsPerRuleset: 66,
      levelSplits: LEVEL_SPLITS,
      expectedScenarios:
        RULESETS.length * 66 * LEVEL_SPLITS.length,
      systems: [
        "primaryProgression",
        "secondaryProgression",
        "savingThrowOwnership",
        "skillIntegrity",
        "featureVisibility",
        "casterCombination",
        "pactMagicSeparation",
        "persistenceIdentity",
        "levelUpContinuity",
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
      "MULTICLASS_RUNTIME_MATRIX_v6.2C8.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Multiclass Runtime Matrix v6.2C8",
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
      `- Class pairs: ${matrix.counts.classPairs}`,
      `- Level splits: ${matrix.counts.levelSplits}`,
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
      "MULTICLASS_RUNTIME_MATRIX_v6.2C8.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C8 multiclass runtime matrix", () => {
  const matrices = RULESETS.map(buildRulesetMulticlassMatrix);
  const report = writeReports(matrices);

  it("covers 660 integrated multiclass scenarios", () => {
    expect(report.summary.total).toBe(660);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all multiclass scenarios ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.classPairs).toBe(66);
      expect(matrix.counts.scenarios).toBe(330);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every(
          (scenario) => scenario.status === "ready",
        ),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const [primaryLevel, secondaryLevel] of LEVEL_SPLITS) {
      it(`${ruleset} keeps every class pair valid at ${primaryLevel}/${secondaryLevel}`, () => {
        const matrix = matrices.find(
          (entry) => entry.ruleset === ruleset,
        );
        const scenarios = matrix?.scenarios.filter(
          (entry) =>
            entry.primaryLevel === primaryLevel &&
            entry.secondaryLevel === secondaryLevel,
        );

        expect(scenarios).toHaveLength(66);
        expect(
          scenarios?.every(
            (scenario) => scenario.status === "ready",
          ),
        ).toBe(true);
      });
    }
  }
});
