import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enrichClassProgression } from "../../core/rulesets/classProgressionAudit";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "../../core/rulesets/itemExpansion";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";
import { buildClassSubclassCatalogDifferential } from "./classSubclassCatalogDifferential";

const read = <T>(edition: string, file: string) =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const merge = <T extends { id: string }>(base: T[], extra: T[]) => [
  ...base, ...extra.filter((item) => !base.some((existing) => existing.id === item.id)),
];
function load(edition: "dnd_2014" | "dnd_2024"): RulesetData {
  return {
    id: edition, name: edition,
    classes: read<RulesetData["classes"][number]>(edition, "classes").map((entry) => enrichClassProgression(entry, edition)),
    subclasses: merge(read(edition, "subclasses"), edition === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024),
    races: read(edition, "races"), backgrounds: read(edition, "backgrounds"),
    feats: merge(read(edition, "feats"), edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024),
    spells: merge(read(edition, "spells"), edition === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024),
    items: merge(read(edition, "items"), edition === "dnd_2014" ? ITEM_EXPANSION_2014 : ITEM_EXPANSION_2024),
    monsters: read(edition, "monsters"),
  };
}

describe("v5.120B class/subclass catalog differential", () => {
  const result = buildClassSubclassCatalogDifferential(load("dnd_2014"), load("dnd_2024"));

  it("matches all canonical classes and both complete progression catalogs", () => {
    expect(result).toMatchObject({
      package: "v5.120B", version: "5.120.1", status: "GREEN",
      matchedClasses: 12, comparedProgressionRows: 480,
      nextPackage: "v5.120C", nextTarget: "Golden Class and Subclass Integration",
    });
    expect(result.rows.every((row) => row.progressionRows2014 === 20 && row.progressionRows2024 === 20)).toBe(true);
  });

  it("keeps official edition differences visible without treating them as corruption", () => {
    expect(result.rows.some((row) => row.subclassLevel2014 !== row.subclassLevel2024)).toBe(true);
    expect(result.rows.some((row) => row.featureDifferences > 0)).toBe(true);
    expect(result.rows.every((row) => row.subclasses2014 > 0 && row.subclasses2024 > 0)).toBe(true);
  });

  it("closes every identity, parent, selection, progression and bonus-spell reference", () => {
    expect(result.referenceIssues).toEqual([]);
  });
});

