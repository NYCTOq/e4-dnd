import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DndFeatData } from "./ruleset.types";
import { FEAT_EXPANSION_2024 } from "./featExpansion";
import { isFeatEligible } from "./featRules";

const base = JSON.parse(readFileSync(new URL("../../../public/data/dnd_2024/feats.json", import.meta.url), "utf8")) as DndFeatData[];
const feats = [...base, ...FEAT_EXPANSION_2024.filter((item) => !base.some((existing) => existing.id === item.id))];
const byName = (name: string) => feats.find((feat) => feat.name === name)!;
const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

const officialConceptNames = new Set(feats.map((feat) => feat.name.replace(/^Magic Initiate \((Cleric|Druid|Wizard)\)$/, "Magic Initiate")));

describe("2024 PHB complete feat catalogue", () => {
  it("represents all 75 official feat concepts", () => {
    expect(officialConceptNames.size).toBe(75);
    expect(feats).toHaveLength(77); // Magic Initiate is represented as three builder-ready spell-list choices.
  });

  it("contains the official category totals", () => {
    expect([...officialConceptNames].filter((name) => feats.some((feat) => feat.name.replace(/^Magic Initiate \((Cleric|Druid|Wizard)\)$/, "Magic Initiate") === name && feat.category === "origin"))).toHaveLength(10);
    expect(feats.filter((feat) => feat.category === "general")).toHaveLength(43);
    expect(feats.filter((feat) => feat.category === "fighting-style")).toHaveLength(10);
    expect(feats.filter((feat) => feat.category === "epic-boon")).toHaveLength(12);
  });

  it("keeps fighting styles outside normal general-feat prerequisites", () => {
    const archery = byName("Archery");
    expect(isFeatEligible(archery, { level: 20, className: "Wizard", abilities, canCastSpells: true }).eligible).toBe(false);
    expect(isFeatEligible(archery, { level: 1, className: "Fighter", abilities, canCastSpells: false, hasFightingStyleFeature: true }).eligible).toBe(true);
  });

  it("enforces armor-training prerequisites for armor feats", () => {
    const heavilyArmored = byName("Heavily Armored");
    expect(isFeatEligible(heavilyArmored, { level: 4, className: "Wizard", abilities, canCastSpells: true, armorTraining: [] }).eligible).toBe(false);
    expect(isFeatEligible(heavilyArmored, { level: 4, className: "Cleric", abilities, canCastSpells: true, armorTraining: ["Medium Armor", "Shields"] }).eligible).toBe(true);
  });

  it("locks Epic Boons to level 19 and preserves spellcasting prerequisites", () => {
    const recall = byName("Boon of Spell Recall");
    expect(isFeatEligible(recall, { level: 18, className: "Wizard", abilities, canCastSpells: true }).eligible).toBe(false);
    expect(isFeatEligible(recall, { level: 19, className: "Fighter", abilities, canCastSpells: false }).eligible).toBe(false);
    expect(isFeatEligible(recall, { level: 19, className: "Wizard", abilities, canCastSpells: true }).eligible).toBe(true);
  });

  it("includes the revised Weapon Master choice", () => {
    const feat = byName("Weapon Master");
    expect(feat.choiceType).toBe("weapon-mastery");
    expect(feat.choiceCount).toBe(1);
    expect(feat.abilityOptions).toEqual(["str", "dex"]);
  });
});
