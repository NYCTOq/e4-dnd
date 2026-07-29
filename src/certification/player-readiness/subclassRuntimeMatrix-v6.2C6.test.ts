import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUBCLASS_EXPANSION_2014,
  SUBCLASS_EXPANSION_2024,
} from "../../core/rulesets/subclassExpansion";
import type {
  DndClassData,
  DndSubclassData,
} from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
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

function normalizeFeatureName(feature: unknown): string {
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

function normalizeFeatureLevel(feature: unknown): number | null {
  if (
    feature &&
    typeof feature === "object" &&
    "level" in feature &&
    typeof (feature as { level?: unknown }).level === "number"
  ) {
    return (feature as { level: number }).level;
  }

  return null;
}

function buildRulesetSubclassMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const warnings: string[] = [];
  const scenarios = [];

  for (const subclass of subclasses) {
    const classData = classes.find(
      (entry) => entry.name === subclass.className,
    );

    if (!classData) {
      blockers.push(
        `${subclass.name}: referenced class ${subclass.className} missing`,
      );
      continue;
    }

    const selectionLevel =
      typeof subclass.selectionLevel === "number"
        ? subclass.selectionLevel
        : classData.subclassLevel;

    const featureRows = Array.isArray(subclass.features)
      ? subclass.features.map((feature) => ({
          name: normalizeFeatureName(feature),
          level: normalizeFeatureLevel(feature),
        }))
      : [];

    const featureLevels = featureRows
      .map((feature) => feature.level)
      .filter((level): level is number => typeof level === "number")
      .sort((a, b) => a - b);

    const subclassBlockers: string[] = [];
    const subclassWarnings: string[] = [];

    if (!subclass.id || !subclass.name) {
      subclassBlockers.push("invalid subclass identity");
    }

    if (selectionLevel < 1 || selectionLevel > 20) {
      subclassBlockers.push(
        `invalid selection level ${selectionLevel}`,
      );
    }

    if (featureRows.length === 0) {
      subclassBlockers.push("no subclass features");
    }

    if (featureRows.some((feature) => !feature.name)) {
      subclassWarnings.push("feature with missing display name");
    }

    if (
      featureLevels.some(
        (level) => level < selectionLevel || level > 20,
      )
    ) {
      subclassBlockers.push("feature level outside valid progression");
    }

    if (
      featureLevels.length > 0 &&
      !featureLevels.some((level) => level === selectionLevel)
    ) {
      subclassWarnings.push(
        "no feature exactly at subclass selection level",
      );
    }

    const checkpointLevels = [
      selectionLevel,
      Math.min(20, selectionLevel + 3),
      Math.min(20, selectionLevel + 7),
      20,
    ].filter(
      (level, index, values) => values.indexOf(level) === index,
    );

    for (const level of checkpointLevels) {
      const unlockedFeatures = featureRows.filter(
        (feature) =>
          feature.level === null || feature.level <= level,
      );

      const lifecycle = {
        classReference: Boolean(classData.id),
        selectable: level >= selectionLevel,
        featureVisibility:
          level < selectionLevel || unlockedFeatures.length > 0,
        progressionConsistency:
          featureLevels.every(
            (featureLevel) =>
              featureLevel >= selectionLevel &&
              featureLevel <= 20,
          ),
        playModeVisibility:
          level < selectionLevel ||
          unlockedFeatures.some((feature) => Boolean(feature.name)),
        persistenceIdentity: Boolean(
          subclass.id && subclass.className && subclass.name,
        ),
      };

      const scenarioBlockers = Object.entries(lifecycle)
        .filter(([, ready]) => !ready)
        .map(([step]) => `${step} failed`);

      scenarios.push({
        id: `${ruleset}-${subclass.id}-l${level}`,
        ruleset,
        className: classData.name,
        subclassId: subclass.id,
        subclassName: subclass.name,
        level,
        selectionLevel,
        unlockedFeatureCount: unlockedFeatures.length,
        unlockedFeatures: unlockedFeatures.map((feature) => ({
          name: feature.name,
          level: feature.level,
        })),
        lifecycle,
        blockers: scenarioBlockers,
        warnings: subclassWarnings,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${subclass.name} L${level}: ${blocker}`);
      }
    }

    for (const blocker of subclassBlockers) {
      blockers.push(`${subclass.name}: ${blocker}`);
    }

    for (const warning of subclassWarnings) {
      warnings.push(`${subclass.name}: ${warning}`);
    }
  }

  for (const classData of classes) {
    const count = subclasses.filter(
      (entry) => entry.className === classData.name,
    ).length;

    if (count === 0) {
      blockers.push(`${classData.name}: no subclass options`);
    } else if (count < 2) {
      warnings.push(`${classData.name}: only ${count} subclass option`);
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      subclasses: subclasses.length,
      scenarios: scenarios.length,
    },
    blockers,
    warnings,
    scenarios,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildRulesetSubclassMatrix>[],
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
      systems: [
        "classReference",
        "selectionLevel",
        "featureUnlock",
        "progressionConsistency",
        "playModeVisibility",
        "persistenceIdentity",
      ],
    },
    summary: {
      ready,
      blocked,
      total: scenarios.length,
      structuralBlockers: blockers.length,
      subclassCount: matrices.reduce(
        (sum, matrix) => sum + matrix.counts.subclasses,
        0,
      ),
    },
    rulesets: matrices,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "SUBCLASS_RUNTIME_MATRIX_v6.2C6.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Subclass Runtime Matrix v6.2C6",
    "",
    `- Subclasses: ${payload.summary.subclassCount}`,
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
      `- Subclasses: ${matrix.counts.subclasses}`,
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
      "SUBCLASS_RUNTIME_MATRIX_v6.2C6.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C6 subclass runtime matrix", () => {
  const matrices = RULESETS.map(buildRulesetSubclassMatrix);
  const report = writeReports(matrices);

  it("keeps every generated subclass runtime scenario ready", () => {
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.subclassCount).toBeGreaterThan(0);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps every subclass runtime-ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.subclasses).toBeGreaterThan(0);
      expect(matrix.counts.scenarios).toBeGreaterThan(
        matrix.counts.subclasses,
      );
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every(
          (scenario) => scenario.status === "ready",
        ),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    it(`${ruleset} gives every class at least one subclass`, () => {
      const matrix = matrices.find(
        (entry) => entry.ruleset === ruleset,
      );

      expect(matrix).toBeDefined();
      expect(
        matrix?.blockers.some((message) =>
          message.includes("no subclass options"),
        ),
      ).toBe(false);
    });
  }
});
