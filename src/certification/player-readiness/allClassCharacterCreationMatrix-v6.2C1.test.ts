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
const EXPECTED_CLASSES = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;
const CHECK_LEVELS = [1, 3, 4, 5, 8, 11, 17, 20] as const;

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

function expectedLevels(): number[] {
  return Array.from({ length: 20 }, (_, index) => index + 1);
}

function buildRulesetMatrix(ruleset: RulesetId) {
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

  if (races.length === 0) throw new Error(`${ruleset}: race catalog empty`);
  if (backgrounds.length === 0) {
    throw new Error(`${ruleset}: background catalog empty`);
  }

  const scenarios = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const className of EXPECTED_CLASSES) {
    const classData = classes.find((entry) => entry.name === className);

    if (!classData) {
      blockers.push(`${className}: class missing`);
      continue;
    }

    const levelsFound = [...new Set(classData.levels.map((entry) => entry.level))]
      .sort((a, b) => a - b);

    if (JSON.stringify(levelsFound) !== JSON.stringify(expectedLevels())) {
      blockers.push(`${className}: incomplete 1-20 progression`);
    }

    const classSubclasses = subclasses
      .filter((entry) => entry.className === className)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (classSubclasses.length === 0) {
      blockers.push(`${className}: no subclass`);
      continue;
    }

    const classSpells = spells.filter((entry) =>
      entry.classes.includes(className),
    );

    if (
      classData.spellProgression !== "none" &&
      classSpells.length === 0
    ) {
      blockers.push(`${className}: spell progression without spells`);
    }

    for (const level of CHECK_LEVELS) {
      const subclass =
        level >= classData.subclassLevel
          ? classSubclasses[(level + className.length) % classSubclasses.length]
          : null;
      const race = races[(level + className.length) % races.length];
      const background =
        backgrounds[(level * 2 + className.length) % backgrounds.length];

      const availableFeatSlots = classData.levels
        .filter((entry) => entry.level <= level)
        .filter((entry) =>
          entry.features.some((feature) => {
            if (typeof feature === "string") {
              return feature.toLowerCase().includes("ability score");
            }
            if (
              feature &&
              typeof feature === "object" &&
              "name" in feature &&
              typeof (feature as { name?: unknown }).name === "string"
            ) {
              return (feature as { name: string }).name
                .toLowerCase()
                .includes("ability score");
            }
            return false;
          }),
        ).length;

      const chosenFeat =
        availableFeatSlots > 0 && feats.length > 0
          ? feats[(level + className.length) % feats.length]
          : null;

      const maxSpellLevel =
        classSpells.length > 0
          ? Math.max(
              ...classSpells
                .filter((spell) => spell.level <= Math.max(1, Math.ceil(level / 2)))
                .map((spell) => spell.level),
              0,
            )
          : 0;

      const scenarioBlockers: string[] = [];

      if (!race?.id) scenarioBlockers.push("race missing");
      if (!background?.id) scenarioBlockers.push("background missing");
      if (level >= classData.subclassLevel && !subclass) {
        scenarioBlockers.push("subclass missing after selection level");
      }
      if (classData.primaryAbilities.length === 0) {
        scenarioBlockers.push("primary ability missing");
      }
      if (classData.savingThrows.length !== 2) {
        scenarioBlockers.push("saving throw configuration invalid");
      }
      if (
        classData.skillChoices.choose <= 0 ||
        classData.skillChoices.from.length === 0
      ) {
        scenarioBlockers.push("skill choices invalid");
      }
      if (availableFeatSlots > 0 && feats.length > 0 && !chosenFeat) {
        scenarioBlockers.push("feat selection unavailable");
      }

      scenarios.push({
        id: `${ruleset}-${classData.id}-l${level}`,
        ruleset,
        className,
        classId: classData.id,
        level,
        race: race.name,
        background: background.name,
        subclass: subclass?.name ?? null,
        subclassRequired: level >= classData.subclassLevel,
        featSlots: availableFeatSlots,
        selectedFeat: chosenFeat?.name ?? null,
        spellProgression: classData.spellProgression,
        classSpellCount: classSpells.length,
        highestCatalogSpellLevelAtCheckpoint: maxSpellLevel,
        primaryAbilities: classData.primaryAbilities,
        savingThrows: classData.savingThrows,
        skillChoiceCount: classData.skillChoices.choose,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${className} L${level}: ${blocker}`);
      }
    }

    if (classSubclasses.length < 2) {
      warnings.push(`${className}: only ${classSubclasses.length} subclass`);
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

function writeReports(matrices: ReturnType<typeof buildRulesetMatrix>[]) {
  const scenarios = matrices.flatMap((entry) => entry.scenarios);
  const blockers = matrices.flatMap((entry) =>
    entry.blockers.map((message) => ({
      ruleset: entry.ruleset,
      message,
    })),
  );
  const ready = scenarios.filter((entry) => entry.status === "ready").length;
  const blocked = scenarios.length - ready;
  const reportsDir = path.join(projectRoot, "reports");

  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: {
      rulesets: RULESETS,
      classes: EXPECTED_CLASSES,
      checkpointLevels: CHECK_LEVELS,
      expectedScenarios:
        RULESETS.length * EXPECTED_CLASSES.length * CHECK_LEVELS.length,
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
      "ALL_CLASS_CHARACTER_CREATION_MATRIX_v6.2C1.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D All-Class Character Creation Matrix v6.2C1",
    "",
    `- Ready scenarios: ${ready}/${scenarios.length}`,
    `- Blocked scenarios: ${blocked}/${scenarios.length}`,
    `- Structural blockers: ${blockers.length}`,
    "",
    "## Scope",
    "",
    `- Rulesets: ${RULESETS.join(", ")}`,
    `- Classes: ${EXPECTED_CLASSES.join(", ")}`,
    `- Checkpoint levels: ${CHECK_LEVELS.join(", ")}`,
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
      `- Matrix scenarios: ${matrix.counts.scenarios}`,
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
      "ALL_CLASS_CHARACTER_CREATION_MATRIX_v6.2C1.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C1 all-class character creation matrix", () => {
  const matrices = RULESETS.map(buildRulesetMatrix);
  const report = writeReports(matrices);

  it("covers 192 cross-catalog character creation scenarios", () => {
    expect(report.summary.total).toBe(192);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} contains all 12 classes and 96 ready scenarios`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(96);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every((scenario) => scenario.status === "ready"),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const className of EXPECTED_CLASSES) {
      it(`${ruleset} ${className} passes every creation checkpoint`, () => {
        const matrix = matrices.find((entry) => entry.ruleset === ruleset);
        const scenarios = matrix?.scenarios.filter(
          (entry) => entry.className === className,
        );

        expect(scenarios).toHaveLength(CHECK_LEVELS.length);
        expect(
          scenarios?.every((entry) => entry.status === "ready"),
        ).toBe(true);
      });
    }
  }
});
