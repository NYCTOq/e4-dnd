import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "../../core/rulesets/itemExpansion";
import { getRuntimeCoverageCertification } from "../../core/rulesets/runtimeCoverageCertification";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";

const read = <T>(edition: string, file: string) =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const merge = <T extends { id: string }>(base: T[], extra: T[]) => [
  ...base, ...extra.filter((item) => !base.some((existing) => existing.id === item.id)),
];
const data = (edition: "dnd_2014" | "dnd_2024") => ({
  id: edition, name: edition, classes: read(edition, "classes"),
  subclasses: merge(read(edition, "subclasses"), edition === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024),
  races: read(edition, "races"), backgrounds: read(edition, "backgrounds"),
  feats: merge(read(edition, "feats"), edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024),
  spells: merge(read(edition, "spells"), edition === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024),
  items: merge(read(edition, "items"), edition === "dnd_2014" ? ITEM_EXPANSION_2014 : ITEM_EXPANSION_2024),
  monsters: read(edition, "monsters"),
}) as RulesetData;

describe("v5.119B missing runtime closure", () => {
  for (const edition of ["dnd_2014", "dnd_2024"] as const) {
    it(`${edition} has zero missing feat, spell, item or subclass behavior`, () => {
      const report = getRuntimeCoverageCertification(data(edition));
      const selected = report.categories.filter((category) =>
        ["subclasses", "feats", "spells", "items"].includes(category.id)
      );
      expect(selected.flatMap((category) =>
        category.entities.filter((entity) => entity.tier === "missing")
          .map((entity) => `${category.label}: ${entity.name}`)
      )).toEqual([]);
      expect(selected.every((category) => category.total > 0)).toBe(true);
    });
  }
});
