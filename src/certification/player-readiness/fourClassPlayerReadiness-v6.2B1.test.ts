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
  DndClassData,
  DndFeatData,
  DndSpellData,
  DndSubclassData,
} from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";
type TargetClass = "Cleric" | "Fighter" | "Rogue" | "Wizard";

const TARGET_CLASSES: TargetClass[] = [
  "Cleric",
  "Fighter",
  "Rogue",
  "Wizard",
];

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

function expectedLevels(): number[] {
  return Array.from({ length: 20 }, (_, index) => index + 1);
}

function buildRulesetEvidence(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const subclasses = mergeById(
    readJson<DndSubclassData[]>(ruleset, "subclasses.json"),
    ruleset === "dnd_2014"
      ? SUBCLASS_EXPANSION_2014
      : SUBCLASS_EXPANSION_2024,
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

  return TARGET_CLASSES.map((className) => {
    const classData = classes.find((entry) => entry.name === className);

    if (!classData) {
      return {
        ruleset,
        className,
        status: "blocked",
        blockers: [`Missing class catalog entry: ${className}`],
      };
    }

    const classSubclasses = subclasses
      .filter((entry) => entry.className === className)
      .sort((a, b) => a.name.localeCompare(b.name));

    const classSpells = spells
      .filter((entry) => entry.classes.includes(className))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

    const levelsFound = [...new Set(classData.levels.map((entry) => entry.level))]
      .sort((a, b) => a - b);
    const missingLevels = expectedLevels().filter(
      (level) => !levelsFound.includes(level),
    );

    const featureLevels = classData.levels
      .filter((entry) => Array.isArray(entry.features) && entry.features.length > 0)
      .map((entry) => entry.level);

    const blockers: string[] = [];
    const warnings: string[] = [];

    if (missingLevels.length > 0) {
      blockers.push(`Missing progression levels: ${missingLevels.join(", ")}`);
    }

    if (classSubclasses.length === 0) {
      blockers.push("No selectable subclass");
    }

    if (
      classSubclasses.some(
        (entry) =>
          !Array.isArray(entry.features) ||
          entry.features.length === 0,
      )
    ) {
      blockers.push("At least one subclass has no feature progression");
    }

    if (
      classSubclasses.some(
        (entry) =>
          typeof entry.selectionLevel !== "number" ||
          entry.selectionLevel < 1 ||
          entry.selectionLevel > 20,
      )
    ) {
      blockers.push("At least one subclass has an invalid selection level");
    }

    if (classData.primaryAbilities.length === 0) {
      blockers.push("Primary ability configuration is empty");
    }

    if (classData.savingThrows.length !== 2) {
      blockers.push(
        `Expected two saving throw proficiencies, found ${classData.savingThrows.length}`,
      );
    }

    if (
      !classData.skillChoices ||
      classData.skillChoices.choose <= 0 ||
      classData.skillChoices.from.length === 0
    ) {
      blockers.push("Skill choice configuration is incomplete");
    }

    if (featureLevels.length === 0) {
      blockers.push("Class progression has no feature-bearing level");
    }

    const isCaster = classData.spellProgression !== "none";

    if (isCaster && classSpells.length === 0) {
      blockers.push("Spellcasting class has no class spell list");
    }

    if (className === "Cleric" || className === "Wizard") {
      const spellLevels = new Set(classSpells.map((entry) => entry.level));

      for (let spellLevel = 0; spellLevel <= 9; spellLevel += 1) {
        if (!spellLevels.has(spellLevel)) {
          warnings.push(`No class spell at spell level ${spellLevel}`);
        }
      }
    }

    if (
      className === "Fighter" &&
      !classData.levels.some((entry) =>
        entry.features.some((feature) =>
          featureName(feature).toLowerCase().includes("extra attack"),
        ),
      )
    ) {
      blockers.push("Fighter progression has no Extra Attack feature");
    }

    if (
      className === "Rogue" &&
      !classData.levels.some((entry) =>
        entry.features.some((feature) =>
          featureName(feature).toLowerCase().includes("sneak attack"),
        ),
      )
    ) {
      blockers.push("Rogue progression has no Sneak Attack feature");
    }

    if (classSubclasses.length < 2) {
      warnings.push(
        `Only ${classSubclasses.length} subclass option is currently available`,
      );
    }

    if (feats.length < 5) {
      warnings.push(`Ruleset feat catalog is thin: ${feats.length} feats`);
    }

    return {
      ruleset,
      className,
      status: blockers.length === 0 ? "ready" : "blocked",
      classId: classData.id,
      hitDie: classData.hitDie,
      primaryAbilities: classData.primaryAbilities,
      savingThrows: classData.savingThrows,
      skillChoiceCount: classData.skillChoices.choose,
      skillPoolSize: classData.skillChoices.from.length,
      spellProgression: classData.spellProgression,
      subclassSelectionLevel: classData.subclassLevel,
      subclasses: classSubclasses.map((entry) => ({
        id: entry.id,
        name: entry.name,
        selectionLevel: entry.selectionLevel,
        featureLevels: entry.features.map((feature) => feature.level),
      })),
      spellCount: classSpells.length,
      spellLevelDistribution: Object.fromEntries(
        Array.from({ length: 10 }, (_, level) => [
          String(level),
          classSpells.filter((entry) => entry.level === level).length,
        ]),
      ),
      featCatalogCount: feats.length,
      levelsFound,
      featureLevels,
      blockers,
      warnings,
    };
  });
}

function writeReports(evidence: ReturnType<typeof buildRulesetEvidence>[]) {
  const flattened = evidence.flat();
  const readyCount = flattened.filter((entry) => entry.status === "ready").length;
  const blockedCount = flattened.length - readyCount;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      rulesets: ["dnd_2014", "dnd_2024"],
      classes: TARGET_CLASSES,
      expectedJourneys: flattened.length,
    },
    summary: {
      ready: readyCount,
      blocked: blockedCount,
      total: flattened.length,
    },
    evidence: flattened,
  };

  fs.writeFileSync(
    path.join(
      reportsDir,
      "FOUR_CLASS_PLAYER_READINESS_v6.2B1.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Four-Class Player Readiness v6.2B1",
    "",
    `- Ready journeys: ${readyCount}/${flattened.length}`,
    `- Blocked journeys: ${blockedCount}/${flattened.length}`,
    "",
  ];

  for (const entry of flattened) {
    lines.push(
      `## ${entry.ruleset} · ${entry.className}`,
      "",
      `- Status: **${entry.status.toUpperCase()}**`,
    );

    if (entry.status !== "blocked" && "subclasses" in entry && entry.subclasses && entry.levelsFound) {
      lines.push(
        `- Subclasses: ${entry.subclasses.map((item) => item.name).join(", ") || "NONE"}`,
        `- Spell count: ${entry.spellCount ?? 0}`,
        `- Feat catalog count: ${entry.featCatalogCount ?? 0}`,
        `- Complete levels: ${entry.levelsFound.length}/20`,
      );
    }

    if (entry.blockers.length > 0) {
      lines.push("", "### Blockers", "");
      lines.push(...entry.blockers.map((item) => `- ${item}`));
    }

    if ("warnings" in entry && Array.isArray(entry.warnings) && entry.warnings.length > 0) {
      lines.push("", "### Warnings", "");
      lines.push(...entry.warnings.map((item) => `- ${item}`));
    }

    lines.push("");
  }

  fs.writeFileSync(
    path.join(
      reportsDir,
      "FOUR_CLASS_PLAYER_READINESS_v6.2B1.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2B1 four-class player readiness", () => {
  const evidence = [
    buildRulesetEvidence("dnd_2014"),
    buildRulesetEvidence("dnd_2024"),
  ];
  const report = writeReports(evidence);

  it("certifies all eight ruleset and class journeys", () => {
    expect(report.summary.total).toBe(8);
    expect(report.summary.blocked).toBe(0);
  });

  for (const rulesetEvidence of evidence) {
    for (const entry of rulesetEvidence) {
      it(`${entry.ruleset} ${entry.className} supports a complete 1-20 player build foundation`, () => {
        expect(entry.status).toBe("ready");

        if (
          entry.status !== "blocked" &&
          "levelsFound" in entry &&
          entry.levelsFound &&
          entry.subclasses &&
          entry.primaryAbilities &&
          entry.savingThrows
        ) {
          expect(entry.levelsFound).toEqual(expectedLevels());
          expect(entry.subclasses.length).toBeGreaterThan(0);
          expect(entry.primaryAbilities.length).toBeGreaterThan(0);
          expect(entry.savingThrows).toHaveLength(2);
          expect(entry.skillChoiceCount ?? 0).toBeGreaterThan(0);
          expect(entry.skillPoolSize ?? 0).toBeGreaterThan(0);
        }
      });
    }
  }
});
