import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { DndClassData, DndItemData } from "../../core/rulesets/ruleset.types";
import { getEquipmentLegality } from "../../core/rulesets/equipmentRuntimeRules";
import { getMulticlassRuntimeSummary } from "../../core/rulesets/multiclassRules";

const classes = (edition: "dnd_2014" | "dnd_2024") =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/classes.json`, import.meta.url), "utf8")) as DndClassData[];
const items = (edition: "dnd_2014" | "dnd_2024") =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/items.json`, import.meta.url), "utf8")) as DndItemData[];
const abilities = { str: 15, dex: 14, con: 14, int: 14, wis: 13, cha: 13 };

describe("v5.117 advanced multiclass oracle", () => {
  it.each(["dnd_2014", "dnd_2024"] as const)(
    "%s keeps starting-class and multiclass proficiencies distinct",
    (edition) => {
      const data = classes(edition);
      const summary = getMulticlassRuntimeSummary(
        [{ className: "Wizard", level: 3 }, { className: "Fighter", level: 1 }],
        "Wizard",
        data,
        edition,
      );
      const fighter = summary.classProfiles.find((entry) => entry.name === "Fighter")!;
      expect(fighter.armorProficiencies.join(" ")).not.toMatch(/Heavy/i);
      const plate = items(edition).find((entry) => entry.name === "Plate Armor")!;
      expect(getEquipmentLegality(plate, summary.classProfiles, abilities).proficient).toBe(false);
    },
  );

  it("combines full, half and third casters while keeping Pact Magic separate", () => {
    const data = classes("dnd_2014");
    const summary = getMulticlassRuntimeSummary(
      [
        { className: "Wizard", level: 3 },
        { className: "Paladin", level: 4 },
        { className: "Fighter", level: 3, subclass: "Eldritch Knight" },
        { className: "Warlock", level: 2 },
      ],
      "Wizard",
      data,
      "dnd_2014",
    );
    expect(summary).toMatchObject({
      totalLevel: 12,
      classCount: 4,
      casterLevel: 6,
      attacksPerAction: 1,
    });
    expect(summary.spellSlots.at(-1)?.level).toBe(3);
    expect(summary.pactMagicSlots).toHaveLength(1);
    expect(summary.hitDice.reduce((sum, pool) => sum + pool.max, 0)).toBe(12);
  });

  it("honors the 2024 Monk light-martial restriction", () => {
    const data = classes("dnd_2024");
    const catalog = items("dnd_2024");
    const summary = getMulticlassRuntimeSummary(
      [{ className: "Wizard", level: 1 }, { className: "Monk", level: 1 }],
      "Wizard",
      data,
      "dnd_2024",
    );
    const shortsword = catalog.find((entry) => entry.name === "Shortsword")!;
    const longsword = catalog.find((entry) => entry.name === "Longsword")!;
    expect(getEquipmentLegality(shortsword, summary.classProfiles, abilities).proficient).toBe(true);
    expect(getEquipmentLegality(longsword, summary.classProfiles, abilities).proficient).toBe(false);
  });
});
