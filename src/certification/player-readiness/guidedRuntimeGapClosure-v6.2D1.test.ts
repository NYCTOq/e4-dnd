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
type AutomationTier = "automatic" | "guided" | "table-ruling";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const projectRoot = process.cwd();

const AUTOMATIC_HINTS = [
  "critical",
  "armor",
  "proficiency",
  "resistance",
  "immunity",
  "speed",
  "initiative",
  "hit point",
  "temporary hit point",
  "saving throw",
  "attack roll",
  "damage",
  "spell",
  "cantrip",
  "extra attack",
  "expertise",
  "darkvision",
  "advantage",
  "disadvantage",
];

const TABLE_RULING_HINTS = [
  "illusion",
  "wish",
  "divination",
  "roleplay",
  "narrative",
  "dm",
  "game master",
  "interpret",
  "reality",
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

function classifyFeature(feature: unknown): AutomationTier {
  const text = featureText(feature);

  if (TABLE_RULING_HINTS.some((hint) => text.includes(hint))) {
    return "table-ruling";
  }

  if (AUTOMATIC_HINTS.some((hint) => text.includes(hint))) {
    return "automatic";
  }

  return "guided";
}

function buildRulesetGapMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const warnings: string[] = [];
  const entries = [];

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

    if (!Array.isArray(subclass.features) || subclass.features.length === 0) {
      blockers.push(`${subclass.name}: no features`);
      continue;
    }

    for (const feature of subclass.features) {
      const name = featureName(feature);
      const level = featureLevel(feature);
      const tier = classifyFeature(feature);
      const featureBlockers: string[] = [];

      if (!name) {
        featureBlockers.push("missing feature name");
      }

      if (level !== null && (level < selectionLevel || level > 20)) {
        featureBlockers.push(
          `invalid feature level ${level} for selection level ${selectionLevel}`,
        );
      }

      entries.push({
        ruleset,
        className: classData.name,
        subclassId: subclass.id,
        subclassName: subclass.name,
        selectionLevel,
        featureName: name,
        featureLevel: level,
        tier,
        playModePolicy:
          tier === "automatic"
            ? "resolve-and-persist"
            : tier === "guided"
              ? "show-guidance-and-persist"
              : "show-table-ruling-and-persist",
        blockers: featureBlockers,
        status: featureBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of featureBlockers) {
        blockers.push(`${subclass.name} · ${name || "UNKNOWN"}: ${blocker}`);
      }
    }
  }

  const tierCounts = {
    automatic: entries.filter((entry) => entry.tier === "automatic").length,
    guided: entries.filter((entry) => entry.tier === "guided").length,
    "table-ruling": entries.filter(
      (entry) => entry.tier === "table-ruling",
    ).length,
  };

  if (tierCounts.guided > 0) {
    warnings.push(
      `${tierCounts.guided} guided feature remains in the automation backlog`,
    );
  }

  if (tierCounts["table-ruling"] > 0) {
    warnings.push(
      `${tierCounts["table-ruling"]} table-ruling feature remains intentionally non-automatic`,
    );
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      subclasses: subclasses.length,
      features: entries.length,
      ...tierCounts,
    },
    blockers,
    warnings,
    entries,
  };
}

function writeReports(
  matrices: ReturnType<typeof buildRulesetGapMatrix>[],
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
      systems: [
        "featureIdentity",
        "featureLevel",
        "automationTier",
        "playModePolicy",
        "persistencePolicy",
      ],
    },
    summary: {
      total: entries.length,
      ready,
      blocked,
      automatic: entries.filter(
        (entry) => entry.tier === "automatic",
      ).length,
      guided: entries.filter(
        (entry) => entry.tier === "guided",
      ).length,
      tableRuling: entries.filter(
        (entry) => entry.tier === "table-ruling",
      ).length,
    },
    rulesets: matrices,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "GUIDED_RUNTIME_GAP_CLOSURE_v6.2D1.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Guided Runtime Gap Closure v6.2D1",
    "",
    `- Total features: ${payload.summary.total}`,
    `- Ready features: ${payload.summary.ready}`,
    `- Blocked features: ${payload.summary.blocked}`,
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
      `- Features: ${matrix.counts.features}`,
      `- Automatic: ${matrix.counts.automatic}`,
      `- Guided: ${matrix.counts.guided}`,
      `- Table ruling: ${matrix.counts["table-ruling"]}`,
      "",
    );

    if (matrix.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...matrix.blockers.map((entry) => `- ${entry}`), "");
    }

    if (matrix.warnings.length > 0) {
      lines.push("### Backlog", "");
      lines.push(...matrix.warnings.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "GUIDED_RUNTIME_GAP_CLOSURE_v6.2D1.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D1 guided runtime gap closure", () => {
  const matrices = RULESETS.map(buildRulesetGapMatrix);
  const report = writeReports(matrices);

  it("maps every subclass feature to a Play Mode runtime policy", () => {
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.ready).toBe(report.summary.total);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} has no blocked subclass runtime feature`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.subclasses).toBeGreaterThan(0);
      expect(matrix.counts.features).toBeGreaterThan(0);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.entries.every((entry) => entry.status === "ready"),
      ).toBe(true);
    });
  }

  it("keeps every feature in an explicit automation tier", () => {
    expect(
      matrices
        .flatMap((matrix) => matrix.entries)
        .every((entry) =>
          ["automatic", "guided", "table-ruling"].includes(entry.tier),
        ),
    ).toBe(true);
  });
});
