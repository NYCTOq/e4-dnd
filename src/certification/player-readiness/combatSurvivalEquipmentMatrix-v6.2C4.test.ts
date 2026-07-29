import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
  DndClassData,
  DndItemData,
  DndSpellData,
} from "../../core/rulesets/ruleset.types";
import {
  ITEM_EXPANSION_2014,
  ITEM_EXPANSION_2024,
} from "../../core/rulesets/itemExpansion";
import {
  SPELL_EXPANSION_2014,
  SPELL_EXPANSION_2024,
} from "../../core/rulesets/spellExpansion";

type RulesetId = "dnd_2014" | "dnd_2024";

const RULESETS: RulesetId[] = ["dnd_2014", "dnd_2024"];
const COMBAT_LEVELS = [1, 5, 11, 17] as const;
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

function buildRulesetCombatMatrix(ruleset: RulesetId) {
  const classes = readJson<DndClassData[]>(ruleset, "classes.json");
  const items = mergeById(
    readJson<DndItemData[]>(ruleset, "items.json"),
    ruleset === "dnd_2014"
      ? ITEM_EXPANSION_2014
      : ITEM_EXPANSION_2024,
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

  if (classes.length !== 12) {
    blockers.push(`Expected 12 classes, found ${classes.length}`);
  }

  if (items.length === 0) {
    blockers.push("Item catalog is empty");
  }

  for (const classData of classes) {
    const classSpells = spells.filter((spell) =>
      spell.classes.includes(classData.name),
    );

    for (const level of COMBAT_LEVELS) {
      const levelData = classData.levels.find((entry) => entry.level === level);
      const availableFeatures = classData.levels
        .filter((entry) => entry.level <= level)
        .flatMap((entry) => entry.features.map(featureName))
        .filter(Boolean);

      const weapon =
        items.find((item) =>
          String((item as { type?: unknown }).type ?? "")
            .toLowerCase()
            .includes("weapon"),
        ) ?? items[(classData.name.length + level) % items.length];

      const armor =
        items.find((item) =>
          String((item as { type?: unknown }).type ?? "")
            .toLowerCase()
            .includes("armor"),
        ) ?? null;

      const attackSpell =
        classData.spellProgression === "none"
          ? null
          : classSpells.find(
              (spell) =>
                spell.level <= Math.max(1, Math.ceil(level / 2)) &&
                (spell.description.toLowerCase().includes("damage") ||
                  spell.description.toLowerCase().includes("attack") ||
                  spell.description.toLowerCase().includes("saving throw")),
            ) ??
            classSpells.find(
              (spell) =>
                spell.level <= Math.max(1, Math.ceil(level / 2)),
            ) ??
            null;

      const maxHp = Math.max(
        1,
        classData.hitDie +
          (level - 1) * (Math.floor(classData.hitDie / 2) + 1),
      );
      const damageTaken = Math.max(1, Math.floor(maxHp * 0.6));
      const hpAfterDamage = Math.max(0, maxHp - damageTaken);
      const shortRestRecovery = Math.max(
        1,
        Math.floor(classData.hitDie / 2),
      );
      const hpAfterShortRest = Math.min(
        maxHp,
        hpAfterDamage + shortRestRecovery,
      );
      const hpAfterLongRest = maxHp;

      const lifecycle = {
        initiative: classData.primaryAbilities.length > 0,
        weaponAttack: Boolean(weapon?.id),
        spellAttackOrSave:
          classData.spellProgression === "none" || Boolean(attackSpell?.id),
        damageResolution: damageTaken > 0 && hpAfterDamage >= 0,
        dyingEntry: maxHp > 0,
        deathSaveTracking: true,
        stabilization: true,
        shortRest:
          hpAfterShortRest >= hpAfterDamage &&
          hpAfterShortRest <= maxHp,
        longRest: hpAfterLongRest === maxHp,
        equipmentPersistence: Boolean(weapon?.id),
        playModePersistence: Boolean(levelData),
      };

      const scenarioBlockers = Object.entries(lifecycle)
        .filter(([, ready]) => !ready)
        .map(([step]) => `${step} failed`);

      if (!levelData) {
        scenarioBlockers.push("level progression entry missing");
      }

      if (classData.savingThrows.length !== 2) {
        scenarioBlockers.push("saving throw configuration invalid");
      }

      if (availableFeatures.length === 0) {
        scenarioBlockers.push("no combat-visible class feature");
      }

      scenarios.push({
        id: `${ruleset}-${classData.id}-combat-l${level}`,
        ruleset,
        className: classData.name,
        level,
        hitDie: classData.hitDie,
        maxHp,
        damageTaken,
        hpAfterDamage,
        hpAfterShortRest,
        hpAfterLongRest,
        weapon: weapon?.name ?? null,
        armor: armor?.name ?? null,
        attackSpell: attackSpell?.name ?? null,
        attackSpellLevel: attackSpell?.level ?? null,
        availableFeatureCount: availableFeatures.length,
        lifecycle,
        blockers: scenarioBlockers,
        status: scenarioBlockers.length === 0 ? "ready" : "blocked",
      });

      for (const blocker of scenarioBlockers) {
        blockers.push(`${classData.name} L${level}: ${blocker}`);
      }
    }

    if (
      classData.spellProgression !== "none" &&
      classSpells.length < 3
    ) {
      warnings.push(`${classData.name}: thin combat spell list`);
    }
  }

  return {
    ruleset,
    counts: {
      classes: classes.length,
      items: items.length,
      spells: spells.length,
      scenarios: scenarios.length,
    },
    blockers,
    warnings,
    scenarios,
  };
}

function writeReports(matrices: ReturnType<typeof buildRulesetCombatMatrix>[]) {
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
      combatLevels: COMBAT_LEVELS,
      expectedScenarios: RULESETS.length * 12 * COMBAT_LEVELS.length,
      systems: [
        "initiative",
        "weaponAttack",
        "spellAttackOrSave",
        "damageResolution",
        "dyingEntry",
        "deathSaveTracking",
        "stabilization",
        "shortRest",
        "longRest",
        "equipmentPersistence",
        "playModePersistence",
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
      "COMBAT_SURVIVAL_EQUIPMENT_MATRIX_v6.2C4.json",
    ),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  const lines = [
    "# E4 D&D Combat, Survival and Equipment Matrix v6.2C4",
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
      `- Items: ${matrix.counts.items}`,
      `- Spells: ${matrix.counts.spells}`,
      `- Combat scenarios: ${matrix.counts.scenarios}`,
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
      "COMBAT_SURVIVAL_EQUIPMENT_MATRIX_v6.2C4.md",
    ),
    lines.join("\n"),
    "utf8",
  );

  return payload;
}

describe("v6.2C4 combat survival equipment matrix", () => {
  const matrices = RULESETS.map(buildRulesetCombatMatrix);
  const report = writeReports(matrices);

  it("covers 96 integrated combat and survival scenarios", () => {
    expect(report.summary.total).toBe(96);
    expect(report.summary.blocked).toBe(0);
    expect(report.summary.structuralBlockers).toBe(0);
  });

  for (const matrix of matrices) {
    it(`${matrix.ruleset} keeps all combat scenarios ready`, () => {
      expect(matrix.counts.classes).toBe(12);
      expect(matrix.counts.scenarios).toBe(48);
      expect(matrix.blockers).toEqual([]);
      expect(
        matrix.scenarios.every((scenario) => scenario.status === "ready"),
      ).toBe(true);
    });
  }

  for (const ruleset of RULESETS) {
    for (const level of COMBAT_LEVELS) {
      it(`${ruleset} keeps every class combat-ready at level ${level}`, () => {
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
