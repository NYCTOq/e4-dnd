import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enrichClassProgression } from "../../core/rulesets/classProgressionAudit";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "../../core/rulesets/itemExpansion";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";
import { buildClassSubclassCatalogDiscovery } from "./classSubclassCatalogIntegrityDiscovery";

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

describe("v5.120A class and subclass catalog integrity discovery", () => {
  const discovery = buildClassSubclassCatalogDiscovery([
    load("dnd_2014"), load("dnd_2024"),
  ]);

  it("locks both 12-class editions and the v5.120B handoff", () => {
    expect(discovery).toMatchObject({
      package: "v5.120A",
      version: "5.120.0",
      status: "READY_FOR_CLOSURE",
      nextPackage: "v5.120B",
      nextTarget: "Catalog Differential and Reference Integrity",
    });
    expect(discovery.editions.map((entry) => entry.classes)).toEqual([12, 12]);
    expect(discovery.editions.map((entry) => entry.progressionRows)).toEqual([240, 240]);
  });

  it("keeps every integrity issue explicit and release-addressable", () => {
    for (const edition of discovery.editions) {
      expect(edition.subclasses).toBeGreaterThan(0);
      expect(edition.orphanSubclasses).toEqual([]);
      expect(edition.invalidClassProgressions).toEqual([]);
    }
    expect(discovery.level20Scores.every((score) => score > 0)).toBe(true);
  });
});
