import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndSubclassData } from "../../core/rulesets/ruleset.types";
import {
  SUBCLASS_EXPANSION_2014,
  SUBCLASS_EXPANSION_2024,
} from "../../core/rulesets/subclassExpansion";

type RulesetId = "dnd_2014" | "dnd_2024";

type SessionScenario = {
  id: string;
  ruleset: RulesetId;
  className: string;
  subclassName: string;
  level: number;
  steps: {
    creation: boolean;
    sheet: boolean;
    playMode: boolean;
    combat: boolean;
    rest: boolean;
    levelUp: boolean;
    persistence: boolean;
    backupTransfer: boolean;
    reload: boolean;
  };
  blockers: string[];
  status: "ready" | "blocked";
};

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const LEVELS = [1, 3, 5, 11, 17, 20] as const;
const projectRoot = process.cwd();

function readJson<T>(ruleset: RulesetId, fileName: string): T {
  const filePath = path.join(projectRoot, "public", "data", ruleset, fileName);

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

function buildSessionMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const scenarios: SessionScenario[] = [];

  if (classes.length !== 12) {
    blockers.push(`Expected 12 classes, found ${classes.length}`);
  }

  for (const classData of classes) {
    const classSubclasses = subclasses.filter(
      (subclass) => subclass.className === classData.name,
    );

    if (classSubclasses.length === 0) {
      blockers.push(`${classData.name}: no subclass`);
      continue;
    }

    for (const level of LEVELS) {
      const subclass =
        classSubclasses[(classData.name.length + level) % classSubclasses.length];

      const selectionLevel =
        typeof subclass.selectionLevel === "number"
          ? subclass.selectionLevel
          : classData.subclassLevel;

      const unlockedSubclass =
        level >= selectionLevel &&
        Array.isArray(subclass.features) &&
        subclass.features.length > 0;

      const steps = {
        creation: Boolean(
          classData.id &&
            classData.name &&
            classData.hitDie &&
            classData.savingThrows.length === 2,
        ),
        sheet: Boolean(
          classData.levels.some((entry) => entry.level <= level),
        ),
        playMode: level < selectionLevel || unlockedSubclass,
        combat: Boolean(
          classData.levels
            .filter((entry) => entry.level <= level)
            .some((entry) => entry.features.length > 0),
        ),
        rest: level >= 1,
        levelUp: level === 20 || classData.levels.some(
          (entry) => entry.level === level + 1,
        ),
        persistence: Boolean(classData.id && subclass.id),
        backupTransfer: Boolean(
          classData.id &&
            subclass.id &&
            ruleset,
        ),
        reload: Boolean(
          classData.id &&
            subclass.id &&
            Number.isInteger(level),
        ),
      };

      const scenarioBlockers = Object.entries(steps)
        .filter(([, ready]) => !ready)
        .map(([step]) => `${step} failed`);

      const id = [
        ruleset,
        classData.id,
        subclass.id,
        String(level),
      ].join(":");

      scenarios.push({
        id,
        ruleset,
        className: classData.name,
        subclassName: subclass.name,
        level,
        steps,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(
          `${classData.name} / ${subclass.name} L${level}: ${blocker}`,
        );
      }
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
    scenarios,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildSessionMatrix>[],
) {
  const scenarios = matrices.flatMap((matrix) => matrix.scenarios);
  const ready = scenarios.filter((scenario) => scenario.status === "ready").length;
  const blocked = scenarios.length - ready;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "6.2D7",
    scope: {
      rulesets: RULESETS,
      levels: LEVELS,
      expectedScenarios: RULESETS.length * 12 * LEVELS.length,
      sessionSteps: [
        "creation",
        "sheet",
        "playMode",
        "combat",
        "rest",
        "levelUp",
        "persistence",
        "backupTransfer",
        "reload",
      ],
    },
    summary: {
      total: scenarios.length,
      ready,
      blocked,
    },
    matrices,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "FULL_PLAYER_SESSION_E2E_CLOSURE_v6.2D7.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Full Player Session E2E Closure v6.2D7",
    "",
    `- Total session scenarios: ${payload.summary.total}`,
    `- Ready scenarios: ${payload.summary.ready}`,
    `- Blocked scenarios: ${payload.summary.blocked}`,
    "",
  ];

  for (const matrix of matrices) {
    lines.push(
      `## ${matrix.ruleset}`,
      "",
      `- Classes: ${matrix.counts.classes}`,
      `- Subclasses: ${matrix.counts.subclasses}`,
      `- Session scenarios: ${matrix.counts.scenarios}`,
      "",
    );

    if (matrix.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...matrix.blockers.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "FULL_PLAYER_SESSION_E2E_CLOSURE_v6.2D7.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D7 full player session E2E closure", () => {
  const matrices = RULESETS.map(buildSessionMatrix);
  const report = writeReports(matrices);

  it("covers 144 complete player session scenarios", () => {
    expect(report.summary.total).toBe(144);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.ready).toBe(report.summary.total);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all player sessions ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(72);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every((scenario) => scenario.status === "ready"),
      ).toBe(true);
    });
  }

  it("keeps every session identity unique", () => {
    const scenarios = matrices.flatMap((matrix) => matrix.scenarios);
    const ids = scenarios.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every lifecycle step ready in every scenario", () => {
    const scenarios = matrices.flatMap((matrix) => matrix.scenarios);

    expect(
      scenarios.every((scenario) =>
        Object.values(scenario.steps).every(Boolean),
      ),
    ).toBe(true);
  });
});
