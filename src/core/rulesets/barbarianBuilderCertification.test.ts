import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { certifyBarbarianBuilder, summarizeBarbarianCertification } from "./barbarianBuilderCertification";
import { getBrutalStrike, getPrimalChampion, getRageUses, getWeaponMasteryCount, isRageDamageWeapon } from "./barbarianRules";

const load = <T,>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;
const mergedSubclasses = (edition: "2014" | "2024") => {
  const base = load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);
  const expansion = edition === "2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024;
  return [...base, ...expansion.filter((candidate) => !base.some((existing) => existing.id === candidate.id))];
};

function createRows(edition: "2014" | "2024") {
  const classes = load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);
  const races = load<DndRaceData[]>(`public/data/dnd_${edition}/races.json`);
  return certifyBarbarianBuilder(`dnd_${edition}`, classes.find((item) => item.id === "barbarian")!, races, mergedSubclasses(edition));
}

describe("Barbarian full builder certification", () => {
  it("certifies every 2014 race × subclass × level combination", () => {
    const rows = createRows("2014");
    expect(rows).toHaveLength(9 * 2 * 20);
    expect(summarizeBarbarianCertification(rows)).toMatchObject({ ready: true, scenarioCount: 360, blockerCount: 0 });
  });

  it("certifies every 2024 species × subclass × level combination", () => {
    const rows = createRows("2024");
    expect(rows).toHaveLength(10 * 2 * 20);
    expect(summarizeBarbarianCertification(rows)).toMatchObject({ ready: true, scenarioCount: 400, blockerCount: 0 });
  });

  it("matches official 2014 Rage and capstone breakpoints", () => {
    expect(getRageUses(1, "dnd_2014")).toBe(2);
    expect(getRageUses(6, "dnd_2014")).toBe(4);
    expect(getRageUses(20, "dnd_2014")).toBe("unlimited");
    expect(getPrimalChampion(20, "dnd_2014")).toEqual({ strengthIncrease: 4, constitutionIncrease: 4, maximum: 24 });
  });

  it("matches official 2024 Rage, mastery, Brutal Strike and capstone breakpoints", () => {
    expect(getRageUses(20, "dnd_2024")).toBe(6);
    expect(getWeaponMasteryCount(1, "dnd_2024")).toBe(2);
    expect(getWeaponMasteryCount(4, "dnd_2024")).toBe(3);
    expect(getWeaponMasteryCount(10, "dnd_2024")).toBe(4);
    expect(getBrutalStrike(9, "dnd_2024")).toMatchObject({ dice: 1, effectCount: 1 });
    expect(getBrutalStrike(17, "dnd_2024")).toMatchObject({ dice: 2, effectCount: 2 });
    expect(getPrimalChampion(20, "dnd_2024").maximum).toBe(25);
  });

  it("distinguishes 2014 melee Rage damage from 2024 Strength-based thrown attacks", () => {
    const handaxe = { category: "weapon", range: "20/60", properties: ["Light", "Thrown"] } as never;
    expect(isRageDamageWeapon(handaxe, "dnd_2014", "str")).toBe(false);
    expect(isRageDamageWeapon(handaxe, "dnd_2024", "str")).toBe(true);
    expect(isRageDamageWeapon(handaxe, "dnd_2024", "dex")).toBe(false);
  });

  it("contains complete subclass feature checkpoints", () => {
    for (const edition of ["2014", "2024"] as const) {
      const barbarianSubclasses = mergedSubclasses(edition).filter((item) => item.className === "Barbarian");
      expect(barbarianSubclasses).toHaveLength(2);
      for (const subclass of barbarianSubclasses) expect([...new Set(subclass.features.map((item) => item.level))]).toEqual([3, 6, 10, 14]);
    }
  });
});
