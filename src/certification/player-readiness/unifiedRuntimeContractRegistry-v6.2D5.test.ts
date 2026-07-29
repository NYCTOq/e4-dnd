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

type NumericEngine =
  | "damage"
  | "defense"
  | "healing"
  | "resource"
  | "advantage"
  | "rest"
  | "guidance";

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

type NarrativeEngine =
  | "exploration"
  | "social"
  | "knowledge"
  | "utility"
  | "illusion"
  | "downtime"
  | "narrative"
  | "table-ruling";

type RuntimeContractEntry = {
  runtimeId: string;
  ruleset: RulesetId;
  className: string;
  subclassId: string;
  subclassName: string;
  selectionLevel: number;
  featureName: string;
  featureLevel: number | null;
  featureIndex: number;
  numericEngine: NumericEngine;
  battlefieldEngine: BattlefieldEngine;
  narrativeEngine: NarrativeEngine;
  playModeActions: string[];
  persistenceKey: string;
  runtimeStatus: "automatic" | "guided" | "table-ruling";
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

function numericEngine(feature: unknown): NumericEngine {
  const text = featureText(feature);

  if (includesAny(text, ["damage", "critical", "strike", "smite", "frenzy"])) {
    return "damage";
  }
  if (includesAny(text, ["armor", "ward", "resistance", "immunity", "defense"])) {
    return "defense";
  }
  if (includesAny(text, ["heal", "healing", "hit point", "restore", "recovery"])) {
    return "healing";
  }
  if (includesAny(text, ["channel divinity", "inspiration", "focus", "ki", "rage", "wild shape"])) {
    return "resource";
  }
  if (includesAny(text, ["advantage", "disadvantage", "saving throw", "attack roll"])) {
    return "advantage";
  }
  if (includesAny(text, ["short rest", "long rest", "per rest", "regain", "recharge"])) {
    return "rest";
  }

  return "guidance";
}

function battlefieldEngine(feature: unknown): BattlefieldEngine {
  const text = featureText(feature);

  if (includesAny(text, ["charmed", "frightened", "poisoned", "stunned", "prone", "restrained"])) {
    return "condition";
  }
  if (includesAny(text, ["concentration", "concentrating"])) {
    return "concentration";
  }
  if (includesAny(text, ["movement", "speed", "teleport", "step", "fly", "swim", "climb"])) {
    return "movement";
  }
  if (includesAny(text, ["aura", "radius", "emanation", "nearby"])) {
    return "aura";
  }
  if (includesAny(text, ["summon", "conjure", "manifest", "specter"])) {
    return "summon";
  }
  if (includesAny(text, ["companion", "familiar", "beast", "steed", "thrall"])) {
    return "companion";
  }
  if (includesAny(text, ["area", "zone", "terrain", "wall", "cloud", "field"])) {
    return "zone";
  }
  if (includesAny(text, ["target", "creature you can see", "range", "line of sight"])) {
    return "targeting";
  }

  return "guided";
}

function narrativeEngine(feature: unknown): NarrativeEngine {
  const text = featureText(feature);

  if (includesAny(text, ["exploration", "travel", "terrain", "track", "survival", "forage"])) {
    return "exploration";
  }
  if (includesAny(text, ["persuasion", "deception", "intimidation", "social", "language", "telepathy"])) {
    return "social";
  }
  if (includesAny(text, ["arcana", "history", "religion", "nature", "investigation", "insight", "lore"])) {
    return "knowledge";
  }
  if (includesAny(text, ["tool", "proficiency", "expertise", "ritual", "craft", "disguise", "stealth"])) {
    return "utility";
  }
  if (includesAny(text, ["illusion", "illusory", "phantasmal", "image", "shadow", "reality"])) {
    return "illusion";
  }
  if (includesAny(text, ["downtime", "crafting", "training", "research"])) {
    return "downtime";
  }
  if (includesAny(text, ["divination", "wish", "fate", "destiny", "memory", "dream", "prophecy"])) {
    return "narrative";
  }

  return "table-ruling";
}

function buildRuntimeRegistry(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const entries: RuntimeContractEntry[] = [];

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
      const numeric = numericEngine(feature);
      const battlefield = battlefieldEngine(feature);
      const narrative = narrativeEngine(feature);
      const featureBlockers: string[] = [];

      if (!name) {
        featureBlockers.push("missing feature name");
      }

      if (level !== null && (level < selectionLevel || level > 20)) {
        featureBlockers.push(`invalid feature level ${level}`);
      }

      const runtimeStatus =
        numeric !== "guidance" || battlefield !== "guided"
          ? "automatic"
          : narrative !== "table-ruling"
            ? "guided"
            : "table-ruling";

      const runtimeId = [
        ruleset,
        subclass.id,
        String(level ?? "unknown-level"),
        String(featureIndex),
      ].join(":");

      entries.push({
        runtimeId,
        ruleset,
        className: classData.name,
        subclassId: subclass.id,
        subclassName: subclass.name,
        selectionLevel,
        featureName: name,
        featureLevel: level,
        featureIndex,
        numericEngine: numeric,
        battlefieldEngine: battlefield,
        narrativeEngine: narrative,
        playModeActions: [
          numeric === "guidance"
            ? "show-numeric-guidance"
            : `execute-${numeric}`,
          battlefield === "guided"
            ? "show-battlefield-guidance"
            : `execute-${battlefield}`,
          narrative === "table-ruling"
            ? "open-table-ruling-checklist"
            : `open-${narrative}-guidance`,
        ],
        persistenceKey: [
          "runtime",
          runtimeId,
          name || "unknown-feature",
        ]
          .join(":")
          .toLowerCase()
          .replace(/[^a-z0-9:_-]+/g, "-"),
        runtimeStatus,
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
      features: entries.length,
      automatic: entries.filter(
        (entry) => entry.runtimeStatus === "automatic",
      ).length,
      guided: entries.filter(
        (entry) => entry.runtimeStatus === "guided",
      ).length,
      tableRuling: entries.filter(
        (entry) => entry.runtimeStatus === "table-ruling",
      ).length,
    },
    blockers,
    entries,
  };
}

function writeReports(
  registries: ReturnType<typeof buildRuntimeRegistry>[],
) {
  const entries = registries.flatMap((registry) => registry.entries);
  const ready = entries.filter((entry) => entry.status === "ready").length;
  const blocked = entries.length - ready;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    schemaVersion: "6.2D5",
    scope: {
      rulesets: RULESETS,
      contractLayers: [
        "numeric",
        "battlefield",
        "narrative",
        "playMode",
        "persistence",
      ],
    },
    summary: {
      total: entries.length,
      ready,
      blocked,
      automatic: entries.filter(
        (entry) => entry.runtimeStatus === "automatic",
      ).length,
      guided: entries.filter(
        (entry) => entry.runtimeStatus === "guided",
      ).length,
      tableRuling: entries.filter(
        (entry) => entry.runtimeStatus === "table-ruling",
      ).length,
    },
    registries,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "UNIFIED_RUNTIME_CONTRACT_REGISTRY_v6.2D5.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Unified Runtime Contract Registry v6.2D5",
    "",
    `- Total features: ${payload.summary.total}`,
    `- Ready features: ${payload.summary.ready}`,
    `- Blocked features: ${payload.summary.blocked}`,
    `- Automatic: ${payload.summary.automatic}`,
    `- Guided: ${payload.summary.guided}`,
    `- Table ruling: ${payload.summary.tableRuling}`,
    "",
  ];

  for (const registry of registries) {
    lines.push(
      `## ${registry.ruleset}`,
      "",
      `- Classes: ${registry.counts.classes}`,
      `- Subclasses: ${registry.counts.subclasses}`,
      `- Features: ${registry.counts.features}`,
      `- Automatic: ${registry.counts.automatic}`,
      `- Guided: ${registry.counts.guided}`,
      `- Table ruling: ${registry.counts.tableRuling}`,
      "",
    );

    if (registry.blockers.length > 0) {
      lines.push("### Blockers", "");
      lines.push(...registry.blockers.map((entry) => `- ${entry}`), "");
    }
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "UNIFIED_RUNTIME_CONTRACT_REGISTRY_v6.2D5.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2D5 unified runtime contract registry", () => {
  const registries = RULESETS.map(buildRuntimeRegistry);
  const report = writeReports(registries);

  it("consolidates every subclass feature into one runtime registry", () => {
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.ready).toBe(report.summary.total);
  });

  for (const registry of registries) {
    it(`${registry.ruleset} keeps every unified contract ready`, () => {
      expect(registry.counts.classes).toBe(12);
      expect(registry.counts.subclasses).toBeGreaterThan(0);
      expect(registry.counts.features).toBeGreaterThan(0);
      expect(registry.blockers).toEqual([]);
      expect(
        registry.entries.every((entry) => entry.status === "ready"),
      ).toBe(true);
    });
  }

  it("keeps runtime and persistence identities unique", () => {
    const entries = registries.flatMap((registry) => registry.entries);
    const runtimeIds = entries.map((entry) => entry.runtimeId);
    const persistenceKeys = entries.map((entry) => entry.persistenceKey);

    expect(new Set(runtimeIds).size).toBe(runtimeIds.length);
    expect(new Set(persistenceKeys).size).toBe(persistenceKeys.length);
  });

  it("assigns all three runtime contract layers to every feature", () => {
    const entries = registries.flatMap((registry) => registry.entries);

    expect(
      entries.every(
        (entry) =>
          entry.numericEngine &&
          entry.battlefieldEngine &&
          entry.narrativeEngine &&
          entry.playModeActions.length === 3,
      ),
    ).toBe(true);
  });
});
