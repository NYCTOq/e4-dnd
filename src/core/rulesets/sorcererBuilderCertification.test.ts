import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndClassData, DndRaceData, DndSubclassData } from "./ruleset.types";
import { getMetamagicChoiceCount, getMetamagicOptions } from "./metamagicRules";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { certifySorcererBuilder, summarizeSorcererCertification } from "./sorcererBuilderCertification";
import {
  canCreateSorcerySlot,
  getDraconicSorcererProgression,
  getSorcererCantripCount,
  getSorcererCombatFeatures,
  getSorcererKnownSpellLimit,
  getSorcererPreparedSpellLimit,
  getSorceryPointMaximum,
  getSorcerousRestorationAmount,
  getWildMagicSorcererProgression,
} from "./sorcererRules";

const load = <T,>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;
const merged = (edition: "2014" | "2024") => {
  const base = load<DndSubclassData[]>(`public/data/dnd_${edition}/subclasses.json`);
  const expansion = edition === "2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024;
  return [...base, ...expansion.filter((entry) => !base.some((baseEntry) => baseEntry.id === entry.id))];
};
const rows = (edition: "2014" | "2024") => {
  const classes = load<DndClassData[]>(`public/data/dnd_${edition}/classes.json`);
  const races = load<DndRaceData[]>(`public/data/dnd_${edition}/races.json`);
  return certifySorcererBuilder(`dnd_${edition}`, classes.find((entry) => entry.id === "sorcerer")!, races, merged(edition));
};

describe("Sorcerer full builder certification", () => {
  it("certifies every 2014 race × official subclass × level combination", () => {
    const result = rows("2014");
    expect(result).toHaveLength(9 * 8 * 20);
    expect(summarizeSorcererCertification(result)).toMatchObject({ ready: true, scenarioCount: 1440, blockerCount: 0 });
  });

  it("certifies every 2024 species × PHB subclass × level combination", () => {
    const result = rows("2024");
    expect(result).toHaveLength(10 * 4 * 20);
    expect(summarizeSorcererCertification(result)).toMatchObject({ ready: true, scenarioCount: 800, blockerCount: 0 });
  });

  it("keeps 2014 known spells and 2024 prepared spells separate", () => {
    expect([1, 2, 3, 10, 17, 20].map((level) => getSorcererKnownSpellLimit(level, "dnd_2014"))).toEqual([2, 3, 4, 11, 15, 15]);
    expect([1, 2, 3, 10, 17, 20].map((level) => getSorcererPreparedSpellLimit(level, "dnd_2024"))).toEqual([2, 4, 6, 15, 19, 22]);
    expect(getSorcererPreparedSpellLimit(20, "dnd_2014")).toBe(0);
    expect(getSorcererKnownSpellLimit(20, "dnd_2024")).toBe(0);
  });

  it("matches Sorcery Point, cantrip and Metamagic progression", () => {
    expect([1, 2, 5, 20].map(getSorceryPointMaximum)).toEqual([0, 2, 5, 20]);
    expect([1, 4, 10, 20].map((level) => getSorcererCantripCount(level, "dnd_2024"))).toEqual([4, 5, 6, 6]);
    expect([1, 2, 10, 17].map((level) => getMetamagicChoiceCount("Sorcerer", level, "dnd_2024"))).toEqual([0, 2, 4, 6]);
    expect([1, 3, 10, 17].map((level) => getMetamagicChoiceCount("Sorcerer", level, "dnd_2014"))).toEqual([0, 2, 3, 4]);
  });

  it("keeps edition-specific Metamagic costs and options", () => {
    const legacy = getMetamagicOptions("dnd_2014");
    const modern = getMetamagicOptions("dnd_2024");
    expect(legacy.find((option) => option.name === "Heightened Spell")?.cost).toBe(3);
    expect(modern.find((option) => option.name === "Heightened Spell")?.cost).toBe(2);
    expect(legacy.some((option) => option.name === "Seeking Spell")).toBe(false);
    expect(modern.some((option) => option.name === "Seeking Spell")).toBe(true);
  });

  it("enforces spell-slot creation cost, spent-slot and minimum-level rules", () => {
    expect(canCreateSorcerySlot(1, 2, true, 2)).toBe(true);
    expect(canCreateSorcerySlot(5, 7, true, 8)).toBe(false);
    expect(canCreateSorcerySlot(5, 7, true, 9)).toBe(true);
    expect(canCreateSorcerySlot(3, 5, false, 20)).toBe(false);
    expect(canCreateSorcerySlot(6, 20, true, 20)).toBe(false);
  });

  it("separates 2014 restoration from 2024 short-rest restoration", () => {
    expect([4, 5, 9, 20].map((level) => getSorcerousRestorationAmount(level, "dnd_2024"))).toEqual([0, 2, 4, 10]);
    expect([19, 20].map((level) => getSorcerousRestorationAmount(level, "dnd_2014"))).toEqual([0, 4]);
    expect(getSorcererCombatFeatures(20, "dnd_2024")).toMatchObject({ innateSorcery: true, sorceryIncarnate: true, arcaneApotheosis: true });
  });

  it("certifies Draconic and Wild Magic edition checkpoints", () => {
    expect(getDraconicSorcererProgression(18, "dnd_2014")).toMatchObject({ dragonAncestor: true, draconicSpells: false, capstone: "Draconic Presence" });
    expect(getDraconicSorcererProgression(18, "dnd_2024")).toMatchObject({ dragonAncestor: false, draconicSpells: true, capstone: "Dragon Companion" });
    expect(getWildMagicSorcererProgression(14, "dnd_2014")).toMatchObject({ controlledChaos: true, capstone: null });
    expect(getWildMagicSorcererProgression(18, "dnd_2024")).toMatchObject({ controlledChaos: true, capstone: "Tamed Surge" });
  });
});
