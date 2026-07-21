import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";

const load = <T,>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;
const classes = (edition: "2014" | "2024") => load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);
const classBy = (edition: "2014" | "2024", id: string) => classes(edition).find((entry) => entry.id === id)!;
const featureNames = (entry: DndClassData, level: number) => entry.levels.find((row) => row.level === level)?.features ?? [];
const expectFeatures = (entry: DndClassData, expected: Readonly<Record<number, readonly string[]>>) => {
  for (const [levelText, names] of Object.entries(expected)) {
    expect(featureNames(entry, Number(levelText)), `${entry.name} L${levelText}`).toEqual(expect.arrayContaining([...names]));
  }
};

describe("Cleric and Druid official progression", () => {
  it("locks 2014 Cleric class and domain checkpoints", () => {
    const cleric = classBy("2014", "cleric");
    expect(cleric.subclassLevel).toBe(1);
    expectFeatures(cleric, {
      1: ["Spellcasting", "Divine Domain"],
      2: ["Channel Divinity"],
      4: ["Ability Score Improvement"],
      5: ["Destroy Undead (CR 1/2)"],
      6: ["Channel Divinity (2/rest)", "Divine Domain Feature"],
      8: ["Ability Score Improvement", "Destroy Undead (CR 1)", "Divine Domain Feature"],
      10: ["Divine Intervention"],
      11: ["Destroy Undead (CR 2)"],
      14: ["Destroy Undead (CR 3)"],
      17: ["Destroy Undead (CR 4)", "Divine Domain Feature"],
      18: ["Channel Divinity (3/rest)"],
      19: ["Ability Score Improvement"],
      20: ["Improved Divine Intervention"],
    });
  });

  it("locks 2024 Cleric class and PHB domain checkpoints", () => {
    const cleric = classBy("2024", "cleric");
    expect(cleric.subclassLevel).toBe(3);
    expectFeatures(cleric, {
      1: ["Divine Order", "Spellcasting"], 2: ["Channel Divinity"], 3: ["Cleric Subclass"],
      4: ["Ability Score Improvement"], 5: ["Sear Undead"], 6: ["Subclass Feature"],
      7: ["Blessed Strikes"], 8: ["Ability Score Improvement"], 10: ["Divine Intervention"],
      12: ["Ability Score Improvement"], 14: ["Improved Blessed Strikes"], 16: ["Ability Score Improvement"],
      17: ["Subclass Feature"], 19: ["Epic Boon"], 20: ["Greater Divine Intervention"],
    });
    const base = load<DndSubclassData[]>("public/data/dnd_2024/subclasses.json");
    const domains = [...base, ...SUBCLASS_EXPANSION_2024.filter((x) => !base.some((b) => b.id === x.id))]
      .filter((x) => x.className === "Cleric");
    expect(domains.map((x) => x.name).sort()).toEqual(["Life Domain", "Light Domain", "Trickery Domain", "War Domain"]);
    for (const domain of domains) expect([...new Set(domain.features.map((x) => x.level))]).toEqual([3, 6, 17]);
  });

  it("locks 2014 Druid class and circle checkpoints", () => {
    const druid = classBy("2014", "druid");
    expect(druid.subclassLevel).toBe(2);
    expectFeatures(druid, {
      1: ["Druidic", "Spellcasting"], 2: ["Wild Shape", "Druid Circle"],
      4: ["Wild Shape Improvement", "Ability Score Improvement"], 6: ["Druid Circle Feature"],
      8: ["Wild Shape Improvement", "Ability Score Improvement"], 10: ["Druid Circle Feature"],
      12: ["Ability Score Improvement"], 14: ["Druid Circle Feature"], 16: ["Ability Score Improvement"],
      18: ["Timeless Body", "Beast Spells"], 19: ["Ability Score Improvement"], 20: ["Archdruid"],
    });
  });

  it("locks 2024 Druid class and all four PHB circles", () => {
    const druid = classBy("2024", "druid");
    expect(druid.subclassLevel).toBe(3);
    expectFeatures(druid, {
      1: ["Druidic", "Primal Order", "Spellcasting"], 2: ["Wild Shape", "Wild Companion"],
      3: ["Druid Subclass"], 4: ["Ability Score Improvement"], 5: ["Wild Resurgence"],
      6: ["Subclass Feature"], 7: ["Elemental Fury"], 8: ["Ability Score Improvement"],
      10: ["Subclass Feature"], 12: ["Ability Score Improvement"], 14: ["Subclass Feature"],
      15: ["Improved Elemental Fury"], 16: ["Ability Score Improvement"], 18: ["Beast Spells"],
      19: ["Epic Boon"], 20: ["Archdruid"],
    });
    const base = load<DndSubclassData[]>("public/data/dnd_2024/subclasses.json");
    const circles = [...base, ...SUBCLASS_EXPANSION_2024.filter((x) => !base.some((b) => b.id === x.id))]
      .filter((x) => x.className === "Druid");
    expect(circles.map((x) => x.name).sort()).toEqual(["Circle of the Land", "Circle of the Moon", "Circle of the Sea", "Circle of the Stars"]);
    for (const circle of circles) expect([...new Set(circle.features.map((x) => x.level))]).toEqual([3, 6, 10, 14]);
  });
});
