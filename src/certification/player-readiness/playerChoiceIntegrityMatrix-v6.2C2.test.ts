import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
} from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const CHECK_LEVELS = [1, 4, 8, 12, 16, 19] as const;
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

function countFeatSlots(classData: DndClassData, level: number): number {
  return classData.levels
    .filter((entry) => entry.level <= level)
    .filter((entry) =>
      entry.features.some((feature) => {
        const name = featureName(feature).toLowerCase();
        return (
          name.includes("ability score") ||
          name.includes("epic boon") ||
          name.includes("feat")
        );
      }),
    ).length;
}

function maxReasonableSpellLevel(
  classData: DndClassData,
  level: number,
): number {
  if (classData.spellProgression === "none") return 0;
  if (classData.spellProgression === "pact") {
    return Math.min(5, Math.max(1, Math.ceil(level / 2)));
  }
  if (classData.spellProgression === "half") {
    return Math.min(5, Math.max(1, Math.ceil(level / 4)));
  }
  return Math.min(9, Math.max(1, Math.ceil(level / 2)));
}

function buildRulesetMatrix(ruleset: RulesetId) {
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
  const spells = mergeById(
    readJson<DndSpellData[]>(ruleset, "spells.json"),
    ruleset === "dnd_2014"
      ? SPELL_EXPANSION_2014
      : SPELL_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const warnings: string[] = [];
  const scenarios = [];

  if (classes.length !== 12) blockers.push(`Expected 12 classes, found ${classes.length}`);
  if (races.length === 0) blockers.push("Race / ancestry catalog is empty");
  if (backgrounds.length === 0) blockers.push("Background catalog is empty");
  if (feats.length === 0) blockers.push("Feat catalog is empty");

  for (const classData of classes) {
    const classSpells = spells.filter((spell) =>
      spell.classes.includes(classData.name),
    );

    if (
      classData.spellProgression !== "none" &&
      classSpells.length === 0
    ) {
      blockers.push(`${classData.name}: spell progression without class spells`);
    }

    for (const level of CHECK_LEVELS) {
      const race = races[(classData.name.length + level) % races.length];
      const background =
        backgrounds[(classData.name.length * 2 + level) % backgrounds.length];
      const featSlots = countFeatSlots(classData, level);
      const selectedFeat =
        featSlots > 0
          ? feats[(classData.name.length + level * 3) % feats.length]
          : null;

      const spellCeiling = maxReasonableSpellLevel(classData, level);
      const selectableSpells = classSpells.filter(
        (spell) => spell.level <= spellCeiling,
      );
      const selectedSpell =
        selectableSpells.length > 0
          ? selectableSpells[
              (classData.name.length + level) % selectableSpells.length
            ]
          : null;

      const scenarioBlockers: string[] = [];
      const scenarioWarnings: string[] = [];

      if (!race?.id || !race.name) {
        scenarioBlockers.push("Race / ancestry selection invalid");
      }

      if (!background?.id || !background.name) {
        scenarioBlockers.push("Background selection invalid");
      }

      if (featSlots > 0 && !selectedFeat) {
        scenarioBlockers.push("Feat slot exists but feat cannot be selected");
      }

      if (
        classData.spellProgression !== "none" &&
        spellCeiling > 0 &&
        !selectedSpell
      ) {
        scenarioBlockers.push("Spellcasting class cannot select a spell");
      }

      if (
        selectedSpell &&
        !selectedSpell.classes.includes(classData.name)
      ) {
        scenarioBlockers.push("Selected spell does not belong to class list");
      }

      if (selectedSpell && selectedSpell.level > spellCeiling) {
        scenarioBlockers.push("Selected spell is above the level checkpoint ceiling");
      }

      if (
        selectedFeat &&
        (typeof selectedFeat.id !== "string" ||
          typeof selectedFeat.name !== "string")
      ) {
        scenarioBlockers.push("Selected feat has invalid identity fields");
      }

      if (
        Array.isArray(background.skillProficiencies) &&
        background.skillProficiencies.length === 0
      ) {
        scenarioWarnings.push("Background has no skill proficiency");
      }

      if (Object.keys(race.abilityBonuses ?? {}).length === 0) {
        scenarioWarnings.push("Race / ancestry has no ability bonus metadata");
      }

      scenarios.push({
        id: `${ruleset}-${classData.id}-l${level}`,
        ruleset,
        className: classData.name,
        level,
        race: race.name,
        background: background.name,
        featSlots,
        selectedFeat: selectedFeat?.name ?? null,
        spellProgression: classData.spellProgression,
        spellCeiling,
        selectedSpell: selectedSpell?.name ?? null,
        selectedSpellLevel: selectedSpell?.level ?? null,
        availableClassSpellsAtCheckpoint: selectableSpells.length,
        blockers: scenarioBlockers,
        warnings: scenarioWarnings,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${classData.name} L${level}: ${blocker}`);
      }
    }
  }

  for (const feat of feats) {
    if (!feat.id || !feat.name) {
      blockers.push("Feat with invalid identity found");
    }
  }

  for (const spell of spells) {
    if (!spell.id || !spell.name) {
      blockers.push("Spell with invalid identity found");
    }
    if (spell.level < 0 || spell.level > 9) {
      blockers.push(`${spell.name}: invalid spell level ${spell.level}`);
    }
    if (spell.classes.length === 0) {
      warnings.push(`${spell.name}: no class references`);
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
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
  const ready = scenarios.filter((entry) => entry.status === "ready").length;
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
      checkpointLevels: CHECK_LEVELS,
      expectedScenarios: RULESETS.length * 12 * CHECK_LEVELS.length,
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
      "PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Player Choice Integrity Matrix v6.2C2",
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
      `- Spells: ${matrix.counts.spells}`,
      `- Choice scenarios: ${matrix.counts.scenarios}`,
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
      "PLAYER_CHOICE_INTEGRITY_MATRIX_v6.2C2.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C2 player choice integrity matrix", () => {
  const matrices = RULESETS.map(buildRulesetMatrix);
  const report = writeReports(matrices);

  it("covers 144 race, background, feat and spell choice scenarios", () => {
    expect(report.summary.total).toBe(144);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all player-choice scenarios valid`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(72);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every((scenario) => scenario.status === "ready"),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const level of CHECK_LEVELS) {
      it(`${ruleset} keeps every class valid at level ${level}`, () => {
        const matrix = matrices.find((entry) => entry.ruleset === ruleset);
        const scenarios = matrix?.scenarios.filter(
          (entry) => entry.level === level,
        );

        expect(scenarios).toHaveLength(12);
        expect(
          scenarios?.every((entry) => entry.status === "ready"),
        ).toBe(true);
      });
    }
  }
});
