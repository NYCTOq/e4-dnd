import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "../../core/rulesets/itemExpansion";
import {
  classifyFeat, classifyItem, classifySpell, classifySubclass,
} from "../../core/rulesets/runtimeCoverageCertification";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";
import {
  referenceFeatTier, referenceItemTier, referenceSpellTier, referenceSubclassTier,
} from "../reference/runtimeCoverage.reference";

const read = <T>(edition: string, file: string) =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const merge = <T extends { id: string }>(base: T[], extra: T[]) => [
  ...base, ...extra.filter((item) => !base.some((existing) => existing.id === item.id)),
];

describe("v5.119B full-catalog runtime differential", () => {
  for (const edition of ["dnd_2014", "dnd_2024"] as const) {
    it(`${edition} matches the independent oracle for every runtime entity`, () => {
      const subclasses = merge<RulesetData["subclasses"][number]>(
        read(edition, "subclasses"), edition === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024,
      );
      const feats = merge<RulesetData["feats"][number]>(
        read(edition, "feats"), edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024,
      );
      const spells = merge<RulesetData["spells"][number]>(
        read(edition, "spells"), edition === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024,
      );
      const items = merge<RulesetData["items"][number]>(
        read(edition, "items"), edition === "dnd_2014" ? ITEM_EXPANSION_2014 : ITEM_EXPANSION_2024,
      );
      for (const entity of subclasses) expect(classifySubclass(entity).tier, entity.name).toBe(referenceSubclassTier(entity));
      for (const entity of feats) expect(classifyFeat(entity).tier, entity.name).toBe(referenceFeatTier(entity));
      for (const entity of spells) expect(classifySpell(entity).tier, entity.name).toBe(referenceSpellTier(entity));
      for (const entity of items) expect(classifyItem(entity).tier, entity.name).toBe(referenceItemTier(entity));
    });
  }
});
