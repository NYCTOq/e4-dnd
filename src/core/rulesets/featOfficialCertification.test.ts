import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AbilityScores } from "../character/character.types";
import type { DndFeatData } from "./ruleset.types";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "./featExpansion";
import { getFeatAbilityBonuses, isFeatEligible } from "./featRules";
import { getAdvancedFeatRuntime } from "./advancedFeatRuntimeRules";

const read = (edition: "2014" | "2024") => JSON.parse(readFileSync(new URL(`../../../public/data/dnd_${edition}/feats.json`, import.meta.url), "utf8")) as DndFeatData[];
const merge = (base: DndFeatData[], extra: DndFeatData[]) => [...base, ...extra.filter((item) => !base.some((existing) => existing.id === item.id))];
const abilities = (overrides: Partial<AbilityScores> = {}): AbilityScores => ({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...overrides });

describe("official feat and ASI certification", () => {
  const feats2014 = merge(read("2014"), FEAT_EXPANSION_2014);
  const feats2024 = merge(read("2024"), FEAT_EXPANSION_2024);

  it("keeps supported feat ids and names unique inside each edition", () => {
    for (const feats of [feats2014, feats2024]) {
      expect(new Set(feats.map((feat) => feat.id)).size).toBe(feats.length);
      expect(new Set(feats.map((feat) => feat.name.toLowerCase())).size).toBe(feats.length);
    }
  });

  it("enforces the four 2024 feat categories represented by the rules data", () => {
    expect(feats2024.filter((feat) => feat.category === "origin").length).toBeGreaterThanOrEqual(10);
    for (const feat of feats2024.filter((feat) => feat.category === "general")) expect(feat.prerequisite?.minimumLevel).toBe(4);
    for (const feat of feats2024.filter((feat) => feat.category === "epic-boon")) expect(feat.prerequisite?.minimumLevel).toBe(19);
  });

  it("treats 2014 Ritual Caster INT or WIS prerequisite as an OR condition", () => {
    const feat = feats2014.find((item) => item.id === "ritual-caster")!;
    expect(isFeatEligible(feat, { level: 4, className: "Fighter", abilities: abilities({ int: 13 }), canCastSpells: false }).eligible).toBe(true);
    expect(isFeatEligible(feat, { level: 4, className: "Fighter", abilities: abilities({ wis: 13 }), canCastSpells: false }).eligible).toBe(true);
    expect(isFeatEligible(feat, { level: 4, className: "Fighter", abilities: abilities(), canCastSpells: false }).eligible).toBe(false);
  });

  it("does not incorrectly mark 2014 Resilient as repeatable", () => {
    expect(feats2014.find((item) => item.id === "resilient")?.repeatable).not.toBe(true);
  });

  it("requires spellcasting for 2024 Elemental Adept", () => {
    const feat = feats2024.find((item) => item.id === "elemental-adept-2024")!;
    expect(isFeatEligible(feat, { level: 4, className: "Fighter", abilities: abilities({ int: 13 }), canCastSpells: false }).eligible).toBe(false);
    expect(isFeatEligible(feat, { level: 4, className: "Wizard", abilities: abilities({ int: 13 }), canCastSpells: true }).eligible).toBe(true);
  });

  it("applies one half-feat ability increase and respects the selected option", () => {
    const actor = feats2024.find((item) => item.id === "actor-2024")!;
    expect(getFeatAbilityBonuses([actor], { [actor.id]: ["cha"] })).toEqual({ cha: 1 });
    expect(getFeatAbilityBonuses([actor], { [actor.id]: ["str"] })).toEqual({});
  });

  it("separates revised 2024 feat runtime from legacy mechanics", () => {
    const feat = (name: string, ruleset: DndFeatData["ruleset"]): DndFeatData => ({ id: `${name}-${ruleset}`, name, ruleset, category: "general", summary: "", benefits: [] });
    expect(getAdvancedFeatRuntime([feat("Dual Wielder", "dnd_2014")], 8).armorClassBonus).toBe(1);
    expect(getAdvancedFeatRuntime([feat("Dual Wielder", "dnd_2024")], 8).armorClassBonus).toBe(0);
    expect(getAdvancedFeatRuntime([feat("Mage Slayer", "dnd_2024")], 8)).toMatchObject({ concentrationAdvantage: false, mentalSaveAdvantage: false, enemyConcentrationDisadvantage: true, guardedMindUses: 1 });
    expect(getAdvancedFeatRuntime([feat("Mage Slayer", "dnd_2024")], 8).actions).toHaveLength(0);
    expect(getAdvancedFeatRuntime([feat("Mage Slayer", "dnd_2014")], 8).actions.map((action) => action.id)).toContain("mage-slayer-strike");
  });
});
