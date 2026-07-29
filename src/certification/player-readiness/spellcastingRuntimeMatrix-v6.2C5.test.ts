import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SPELL_EXPANSION_2014,
  SPELL_EXPANSION_2024,
} from "../../core/rulesets/spellExpansion";
import type {
  DndClassData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const CASTER_CLASSES = [
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;
const SPELL_LEVEL_CHECKPOINTS = [1, 5, 11, 17] as const;
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

function maxSpellLevelFor(
  classData: DndClassData,
  characterLevel: number,
): number {
  if (classData.spellProgression === "none") return 0;
  if (classData.spellProgression === "half") {
    return Math.min(5, Math.max(1, Math.ceil(characterLevel / 4)));
  }
  if (classData.spellProgression === "pact") {
    return Math.min(5, Math.max(1, Math.ceil(characterLevel / 2)));
  }
  return Math.min(9, Math.max(1, Math.ceil(characterLevel / 2)));
}

function textOf(spell: DndSpellData): string {
  return [
    spell.name,
    spell.description,
    spell.school,
    spell.castingTime,
    spell.duration,
  ]
    .join(" ")
    .toLowerCase();
}

function pickSpell(
  spells: DndSpellData[],
  predicate: (spell: DndSpellData) => boolean,
): DndSpellData | null {
  return spells.find(predicate) ?? null;
}

function buildRulesetSpellMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const spells = mergeById(
    readJson<DndSpellData[]>(ruleset, "spells.json"),
    ruleset === "dnd_2014"
      ? SPELL_EXPANSION_2014
      : SPELL_EXPANSION_2024,
  );

  const blockers: string[] = [];
  const warnings: string[] = [];
  const scenarios = [];

  for (const className of CASTER_CLASSES) {
    const classData = classes.find((entry) => entry.name === className);

    if (!classData) {
      blockers.push(`${className}: class missing`);
      continue;
    }

    if (classData.spellProgression === "none") {
      blockers.push(`${className}: spell progression is none`);
      continue;
    }

    const classSpells = spells.filter((spell) =>
      spell.classes.includes(className),
    );

    if (classSpells.length === 0) {
      blockers.push(`${className}: class spell list is empty`);
      continue;
    }

    for (const characterLevel of SPELL_LEVEL_CHECKPOINTS) {
      const ceiling = maxSpellLevelFor(classData, characterLevel);
      const available = classSpells.filter(
        (spell) => spell.level <= ceiling,
      );

      const cantrip = pickSpell(available, (spell) => spell.level === 0);
      const attackOrSave = pickSpell(available, (spell) => {
        const text = textOf(spell);
        return (
          text.includes("attack") ||
          text.includes("saving throw") ||
          text.includes("save")
        );
      });
      const concentration = pickSpell(
        available,
        (spell) => spell.concentration,
      );
      const ritual = pickSpell(available, (spell) => spell.ritual);
      const healing = pickSpell(available, (spell) => {
        const text = textOf(spell);
        return text.includes("heal") || text.includes("hit point");
      });
      const summonOrPersistent = pickSpell(available, (spell) => {
        const text = textOf(spell);
        return (
          text.includes("summon") ||
          text.includes("create") ||
          text.includes("until") ||
          text.includes("minute") ||
          text.includes("hour")
        );
      });

      const selected =
        attackOrSave ??
        healing ??
        concentration ??
        ritual ??
        cantrip ??
        available[0] ??
        null;

      const runtimeSteps = {
        classListMembership:
          Boolean(selected) &&
          Boolean(selected?.classes.includes(className)),
        levelEligibility:
          Boolean(selected) &&
          Number(selected?.level ?? 99) <= ceiling,
        castingMetadata:
          Boolean(
            selected?.castingTime &&
              selected.range &&
              selected.duration &&
              Array.isArray(selected.components),
          ),
        slotOrPactEligibility:
          selected?.level === 0 ||
          classData.spellProgression === "pact" ||
          ceiling >= Number(selected?.level ?? 99),
        concentrationTracking:
          !selected?.concentration ||
          typeof selected.concentration === "boolean",
        ritualTracking:
          !selected?.ritual || typeof selected.ritual === "boolean",
        persistenceMetadata:
          Boolean(selected?.id && selected.name),
      };

      const scenarioBlockers = Object.entries(runtimeSteps)
        .filter(([, ready]) => !ready)
        .map(([step]) => `${step} failed`);

      if (available.length === 0) {
        scenarioBlockers.push("no eligible spell at checkpoint");
      }

      scenarios.push({
        id: `${ruleset}-${classData.id}-spell-l${characterLevel}`,
        ruleset,
        className,
        characterLevel,
        spellProgression: classData.spellProgression,
        spellLevelCeiling: ceiling,
        availableSpellCount: available.length,
        selectedSpell: selected?.name ?? null,
        selectedSpellLevel: selected?.level ?? null,
        coverage: {
          cantrip: cantrip?.name ?? null,
          attackOrSave: attackOrSave?.name ?? null,
          concentration: concentration?.name ?? null,
          ritual: ritual?.name ?? null,
          healing: healing?.name ?? null,
          summonOrPersistent: summonOrPersistent?.name ?? null,
        },
        runtimeSteps,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${className} L${characterLevel}: ${blocker}`);
      }
    }

    const classCoverage = {
      cantrip: classSpells.some((spell) => spell.level === 0),
      concentration: classSpells.some((spell) => spell.concentration),
      ritual: classSpells.some((spell) => spell.ritual),
      attackOrSave: classSpells.some((spell) => {
        const text = textOf(spell);
        return (
          text.includes("attack") ||
          text.includes("saving throw") ||
          text.includes("save")
        );
      }),
    };

    for (const [category, present] of Object.entries(classCoverage)) {
      if (!present) {
        warnings.push(`${className}: no ${category} spell detected`);
      }
    }
  }

  for (const spell of spells) {
    if (!spell.id || !spell.name) {
      blockers.push("Spell with invalid identity found");
    }
    if (spell.level < 0 || spell.level > 9) {
      blockers.push(`${spell.name}: invalid level ${spell.level}`);
    }
    if (!Array.isArray(spell.classes) || spell.classes.length === 0) {
      warnings.push(`${spell.name}: no class list`);
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      casterClasses: CASTER_CLASSES.length,
      spells: spells.length,
      scenarios: scenarios.length,
    },
    blockers,
    warnings,
    scenarios,
  };
}

function writeReports(matrices: ReturnType<typeof buildRulesetSpellMatrix>[]) {
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
      casterClasses: CASTER_CLASSES,
      characterLevels: SPELL_LEVEL_CHECKPOINTS,
      expectedScenarios:
        RULESETS.length *
        CASTER_CLASSES.length *
        SPELL_LEVEL_CHECKPOINTS.length,
      spellSystems: [
        "cantrip",
        "attackOrSave",
        "concentration",
        "ritual",
        "healing",
        "summonOrPersistent",
        "preparedKnownOrPactEligibility",
        "runtimePersistence",
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
      "SPELLCASTING_RUNTIME_MATRIX_v6.2C5.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Spellcasting Runtime Matrix v6.2C5",
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
      `- Caster classes: ${matrix.counts.casterClasses}`,
      `- Spells: ${matrix.counts.spells}`,
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
      "SPELLCASTING_RUNTIME_MATRIX_v6.2C5.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C5 spellcasting runtime matrix", () => {
  const matrices = RULESETS.map(buildRulesetSpellMatrix);
  const report = writeReports(matrices);

  it("covers 64 integrated spellcasting scenarios", () => {
    expect(report.summary.total).toBe(64);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all spellcasting scenarios ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(32);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every((scenario) => scenario.status === "ready"),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const className of CASTER_CLASSES) {
      it(`${ruleset} ${className} casts at every checkpoint`, () => {
        const matrix = matrices.find((entry) => entry.ruleset === ruleset);
        const scenarios = matrix?.scenarios.filter(
          (entry) => entry.className === className,
        );

        expect(scenarios).toHaveLength(SPELL_LEVEL_CHECKPOINTS.length);
        expect(
          scenarios?.every((entry) => entry.status === "ready"),
        ).toBe(true);
      });
    }
  }
});
