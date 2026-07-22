import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enrichClassProgression } from "./classProgressionAudit";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "./featExpansion";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "./itemExpansion";
import { getContentIntegrityAudit } from "./contentIntegrityAudit";
import type { RulesetData } from "./ruleset.types";

const read = <T,>(edition: string, file: string): T[] => JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const merge = <T extends { id: string }>(base: T[], expansion: T[]) => [...base, ...expansion.filter((candidate) => !base.some((existing) => existing.id === candidate.id))];

function load(edition: "dnd_2014" | "dnd_2024"): RulesetData {
  return {
    id: edition,
    name: edition,
    classes: read<RulesetData["classes"][number]>(edition, "classes").map((entry) => enrichClassProgression(entry, edition)),
    subclasses: merge(read<RulesetData["subclasses"][number]>(edition, "subclasses"), edition === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024),
    races: read<RulesetData["races"][number]>(edition, "races"),
    backgrounds: read<RulesetData["backgrounds"][number]>(edition, "backgrounds"),
    feats: merge(read<RulesetData["feats"][number]>(edition, "feats"), edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024),
    spells: merge(read<RulesetData["spells"][number]>(edition, "spells"), edition === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024),
    items: merge(read<RulesetData["items"][number]>(edition, "items"), edition === "dnd_2014" ? ITEM_EXPANSION_2014 : ITEM_EXPANSION_2024),
    monsters: read<RulesetData["monsters"][number]>(edition, "monsters"),
  };
}

describe("official content integrity", () => {
  for (const edition of ["dnd_2014", "dnd_2024"] as const) {
    it(`${edition} has no structural blockers`, () => {
      const audit = getContentIntegrityAudit(load(edition));
      expect(audit.issues.filter((entry) => entry.severity === "blocker"), JSON.stringify(audit.issues, null, 2)).toEqual([]);
      expect(audit.catalogs.find((entry) => entry.id === "classes")?.count).toBe(12);
    });
  }
});
