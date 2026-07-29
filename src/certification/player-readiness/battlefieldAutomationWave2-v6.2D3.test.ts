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

type BattlefieldEngine =
  | "condition"
  | "concentration"
  | "movement"
  | "aura"
  | "summon"
  | "companion"
  | "zone"
  | "targeting"
  | "guided";

type BattlefieldEntry = {
  ruleset: RulesetId;
  className: string;
  subclassId: string;
  subclassName: string;
  featureName: string;
  featureLevel: number | null;
  featureIndex: number;
  engine: BattlefieldEngine;
  runtimeContract: string;
  playModeAction: string;
  persistenceKey: string;
  blockers: string[];
  status: "ready" | "blocked";
};

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const projectRoot = process.cwd();

const ENGINE_HINTS: Array<{
  engine: BattlefieldEngine;
  hints: string[];
}> = [
  {
    engine: "condition",
    hints: [
      "condition",
      "charmed",
      "frightened",
      "poisoned",
      "stunned",
      "prone",
      "restrained",
      "blinded",
      "deafened",
      "paralyzed",
      "incapacitated",
      "unconscious",
    ],
  },
  {
    engine: "concentration",
    hints: [
      "concentration",
      "maintain spell",
      "concentrating",
    ],
  },
  {
    engine: "movement",
    hints: [
      "movement",
      "speed",
      "teleport",
      "step",
      "dash",
      "fly",
      "swim",
      "climb",
      "move",
      "position",
    ],
  },
  {
    engine: "aura",
    hints: [
      "aura",
      "within 10 feet",
      "within 30 feet",
      "emanation",
      "radius",
      "nearby",
    ],
  },
  {
    engine: "summon",
    hints: [
      "summon",
      "conjure",
      "create creature",
      "manifest",
      "specter",
      "phantasmal creature",
    ],
  },
  {
    engine: "companion",
    hints: [
      "companion",
      "familiar",
      "beast",
      "steed",
      "thrall",
      "wild companion",
    ],
  },
  {
    engine: "zone",
    hints: [
      "area",
      "zone",
      "terrain",
      "ground",
      "wall",
      "cloud",
      "field",
      "sanctuary",
    ],
  },
  {
    engine: "targeting",
    hints: [
      "target",
      "creature you can see",
      "enemy",
      "ally",
      "range",
      "line of sight",
      "line of effect",
    ],
  },
];

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

function routeFeature(feature: unknown): BattlefieldEngine {
  const text = featureText(feature);

  for (const entry of ENGINE_HINTS) {
    if (entry.hints.some((hint) => text.includes(hint))) {
      return entry.engine;
    }
  }

  return "guided";
}

function buildRulesetBattlefieldWave(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const warnings: string[] = [];
  const entries: BattlefieldEntry[] = [];

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
      const engine = routeFeature(feature);
      const featureBlockers: string[] = [];

      if (!name) {
        featureBlockers.push("missing feature name");
      }

      if (level !== null && (level < selectionLevel || level > 20)) {
        featureBlockers.push(`invalid level ${level}`);
      }

      entries.push({
        ruleset,
        className: classData.name,
        subclassId: subclass.id,
        subclassName: subclass.name,
        featureName: name,
        featureLevel: level,
        featureIndex,
        engine,
        runtimeContract:
          engine === "guided"
            ? "show-battlefield-guidance-and-persist"
            : `resolve-with-${engine}-engine-and-persist`,
        playModeAction:
          engine === "guided"
            ? "open-battlefield-guidance"
            : `execute-${engine}`,
        persistenceKey: [
          ruleset,
          subclass.id,
          String(level ?? "unknown-level"),
          String(featureIndex),
          engine,
          name || "unknown-feature",
        ]
          .join(":")
          .toLowerCase()
          .replace(/[^a-z0-9:_-]+/g, "-"),
        blockers: featureBlockers,
        status: featureBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of featureBlockers) {
        blockers.push(`${subclass.name} · ${name || "UNKNOWN"}: ${blocker}`);
      }
    }
  }

  const engines: BattlefieldEngine[] = [
    "condition",
    "concentration",
    "movement",
    "aura",
    "summon",
    "companion",
    "zone",
    "targeting",
    "guided",
  ];

  const engineCounts = Object.fromEntries(
    engines.map((engine) => [
      engine,
      entries.filter((entry) => entry.engine === engine).length,
    ]),
  );

  if (Number(engineCounts.guided ?? 0) > 0) {
    warnings.push(
      `${engineCounts.guided} feature remains guided after battlefield automation wave`,
    );
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      subclasses: subclasses.length,
      features: entries.length,
      engines: engineCounts,
    },
    blockers,
    warnings,
    entries,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildRulesetBattlefieldWave>[],
) {
  const entries = matrices.flatMap((matrix) => matrix.entries);
  const ready = entries.filter((entry) => entry.status === "ready").length;
  const blocked = entries.length - ready;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      rulesets: RULESETS,
      runtimeEngines: [
        "condition",
        "concentration",
        "movement",
        "aura",
        "summon",
        "companion",
        "zone",
        "targeting",
        "guided",
      ],
    },
    summary: {
      total: entries.length,
      ready,
      blocked,
      automated: entries.filter((entry) => entry.engine !== "guided").length,
      guided: entries.filter((entry) => entry.engine === "guided").length,
    },
    rulesets: matrices,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "BATTLEFIELD_AUTOMATION_WAVE2_v6.2D3.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Battlefield Automation Wave 2 v6.2D3",
    "",
    `- Total features: ${payload.summary.total}`,
    `- Ready features: ${payload.summary.ready}`,
    `- Blocked features: ${payload.summary.blocked}`,
    `- Routed to battlefield engines: ${payload.summary.automated}`,
    `- Remaining guided: ${payload.summary.guided}`,
    "",
  ];

  for (const matrix of matrices) {
    lines.push(
      `## ${matrix.ruleset}`,
      "",
      `- Classes: ${matrix.counts.classes}`,
      `- Subclasses: ${matrix.counts.subclasses}`,
      `- Features: ${matrix.counts.features}`,
      "",
      "### Engine Distribution",
      "",
    );

    for (const [engine, count] of Object.entries(
      matrix.counts.engines,
    )) {
      lines.push(`- ${engine}: ${count}`);
    }

    lines.push("");

    if (matrix.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...matrix.blockers.map((entry) => `- ${entry}`), "");
    }

    if (matrix.warnings.length > 0) {
      lines.push("### Remaining Backlog", "");
      lines.push(...matrix.warnings.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "BATTLEFIELD_AUTOMATION_WAVE2_v6.2D3.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D3 battlefield automation wave 2", () => {
  const matrices = RULESETS.map(buildRulesetBattlefieldWave);
  const report = writeReports(matrices);

  it("routes every subclass feature to a battlefield engine or guidance", () => {
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.ready).toBe(report.summary.total);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps every battlefield route valid`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.subclasses).toBeGreaterThan(0);
      expect(matrix.counts.features).toBeGreaterThan(0);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.entries.every((entry) => entry.status === "ready"),
      ).toBe(true);
    });
  }

  it("creates a unique persistence key for every battlefield feature", () => {
    const entries = matrices.flatMap((matrix) => matrix.entries);
    const keys = entries.map((entry) => entry.persistenceKey);

    expect(keys.every((key) => key.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
