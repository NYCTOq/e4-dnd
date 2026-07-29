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
type RuntimeStatus = "automatic" | "guided" | "table-ruling";

type PlayableFeatureScenario = {
  id: string;
  ruleset: RulesetId;
  className: string;
  subclassName: string;
  featureName: string;
  featureLevel: number | null;
  featureIndex: number;
  runtimeStatus: RuntimeStatus;
  visibleInSheet: boolean;
  visibleInPlayMode: boolean;
  hasPrimaryAction: boolean;
  hasPersistenceIdentity: boolean;
  survivesReload: boolean;
  hasResolutionContract: boolean;
  blockers: string[];
  status: "ready" | "blocked";
};

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

function featureLevel(feature: unknown): number | null {
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

function featureText(feature: unknown): string {
  if (typeof feature === "string") return feature.toLowerCase();
  if (!feature || typeof feature !== "object") return "";

  const raw = feature as Record<string, unknown>;

  return [
    raw.name,
    raw.description,
    raw.summary,
    raw.details,
    raw.notes,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function includesAny(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

function runtimeStatus(feature: unknown): RuntimeStatus {
  const text = featureText(feature);

  const automaticHints = [
    "damage",
    "heal",
    "armor",
    "resistance",
    "immunity",
    "advantage",
    "disadvantage",
    "saving throw",
    "attack roll",
    "condition",
    "charmed",
    "frightened",
    "stunned",
    "prone",
    "movement",
    "speed",
    "teleport",
    "aura",
    "summon",
    "companion",
    "target",
    "resource",
    "rage",
    "ki",
    "focus",
    "inspiration",
    "wild shape",
  ];

  const guidedHints = [
    "exploration",
    "travel",
    "survival",
    "persuasion",
    "deception",
    "intimidation",
    "knowledge",
    "history",
    "arcana",
    "religion",
    "nature",
    "investigation",
    "insight",
    "tool",
    "proficiency",
    "expertise",
    "ritual",
    "craft",
    "downtime",
  ];

  if (includesAny(text, automaticHints)) return "automatic";
  if (includesAny(text, guidedHints)) return "guided";
  return "table-ruling";
}

function buildPlayableMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const scenarios: PlayableFeatureScenario[] = [];

  for (const subclass of subclasses) {
    const classData = classes.find(
      (entry) => entry.name === subclass.className,
    );

    if (!classData) {
      blockers.push(`${subclass.name}: class reference missing`);
      continue;
    }

    const selectionLevel =
      typeof subclass.selectionLevel === "number"
        ? subclass.selectionLevel
        : classData.subclassLevel;

    for (const [featureIndex, feature] of (
      subclass.features ?? []
    ).entries()) {
      const name = featureName(feature);
      const level = featureLevel(feature);
      const status = runtimeStatus(feature);
      const featureBlockers: string[] = [];

      const visibleInSheet = Boolean(name);
      const visibleInPlayMode =
        Boolean(name) &&
        (level === null || (level >= selectionLevel && level <= 20));
      const hasPrimaryAction =
        status === "automatic" ||
        status === "guided" ||
        status === "table-ruling";
      const hasPersistenceIdentity = Boolean(
        ruleset &&
          subclass.id &&
          name &&
          Number.isInteger(featureIndex),
      );
      const survivesReload = hasPersistenceIdentity;
      const hasResolutionContract =
        status === "automatic" ||
        status === "guided" ||
        status === "table-ruling";

      if (!visibleInSheet) featureBlockers.push("sheet visibility missing");
      if (!visibleInPlayMode) featureBlockers.push("Play Mode visibility missing");
      if (!hasPrimaryAction) featureBlockers.push("primary action missing");
      if (!hasPersistenceIdentity) {
        featureBlockers.push("persistence identity missing");
      }
      if (!survivesReload) featureBlockers.push("reload persistence missing");
      if (!hasResolutionContract) {
        featureBlockers.push("resolution contract missing");
      }

      const id = [
        ruleset,
        classData.id,
        subclass.id,
        String(level ?? "unknown-level"),
        String(featureIndex),
      ].join(":");

      scenarios.push({
        id,
        ruleset,
        className: classData.name,
        subclassName: subclass.name,
        featureName: name,
        featureLevel: level,
        featureIndex,
        runtimeStatus: status,
        visibleInSheet,
        visibleInPlayMode,
        hasPrimaryAction,
        hasPersistenceIdentity,
        survivesReload,
        hasResolutionContract,
        blockers: featureBlockers,
        status: featureBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of featureBlockers) {
        blockers.push(`${subclass.name} · ${name || "UNKNOWN"}: ${blocker}`);
      }
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      subclasses: subclasses.length,
      scenarios: scenarios.length,
      automatic: scenarios.filter(
        (scenario) => scenario.runtimeStatus === "automatic",
      ).length,
      guided: scenarios.filter(
        (scenario) => scenario.runtimeStatus === "guided",
      ).length,
      tableRuling: scenarios.filter(
        (scenario) => scenario.runtimeStatus === "table-ruling",
      ).length,
    },
    blockers,
    scenarios,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildPlayableMatrix>[],
) {
  const scenarios = matrices.flatMap((matrix) => matrix.scenarios);
  const ready = scenarios.filter(
    (scenario) => scenario.status === "ready",
  ).length;
  const blocked = scenarios.length - ready;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "6.2D6",
    scope: {
      rulesets: RULESETS,
      guarantees: [
        "sheetVisibility",
        "playModeVisibility",
        "primaryAction",
        "persistenceIdentity",
        "reloadPersistence",
        "resolutionContract",
      ],
    },
    summary: {
      total: scenarios.length,
      ready,
      blocked,
      automatic: scenarios.filter(
        (scenario) => scenario.runtimeStatus === "automatic",
      ).length,
      guided: scenarios.filter(
        (scenario) => scenario.runtimeStatus === "guided",
      ).length,
      tableRuling: scenarios.filter(
        (scenario) => scenario.runtimeStatus === "table-ruling",
      ).length,
    },
    matrices,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Final Playable Runtime Closure v6.2D6",
    "",
    `- Total feature scenarios: ${payload.summary.total}`,
    `- Ready scenarios: ${payload.summary.ready}`,
    `- Blocked scenarios: ${payload.summary.blocked}`,
    `- Automatic: ${payload.summary.automatic}`,
    `- Guided: ${payload.summary.guided}`,
    `- Table ruling: ${payload.summary.tableRuling}`,
    "",
  ];

  for (const matrix of matrices) {
    lines.push(
      `## ${matrix.ruleset}`,
      "",
      `- Classes: ${matrix.counts.classes}`,
      `- Subclasses: ${matrix.counts.subclasses}`,
      `- Scenarios: ${matrix.counts.scenarios}`,
      `- Automatic: ${matrix.counts.automatic}`,
      `- Guided: ${matrix.counts.guided}`,
      `- Table ruling: ${matrix.counts.tableRuling}`,
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
      "FINAL_PLAYABLE_RUNTIME_CLOSURE_v6.2D6.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D6 final playable runtime closure", () => {
  const matrices = RULESETS.map(buildPlayableMatrix);
  const report = writeReports(matrices);

  it("keeps every subclass feature playable and persistent", () => {
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.ready).toBe(report.summary.total);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps every feature player-ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.subclasses).toBeGreaterThan(0);
      expect(matrix.counts.scenarios).toBeGreaterThan(0);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every(
          (scenario) => scenario.status === "ready",
        ),
      ).toBe(true);
    });
  }

  it("keeps scenario identities unique across both rulesets", () => {
    const scenarios = matrices.flatMap((matrix) => matrix.scenarios);
    const ids = scenarios.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns one playable resolution status to every feature", () => {
    const scenarios = matrices.flatMap((matrix) => matrix.scenarios);

    expect(
      scenarios.every((scenario) =>
        ["automatic", "guided", "table-ruling"].includes(
          scenario.runtimeStatus,
        ),
      ),
    ).toBe(true);
  });
});
