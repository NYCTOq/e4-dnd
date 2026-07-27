import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enrichClassProgression } from "../../core/rulesets/classProgressionAudit";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "../../core/rulesets/itemExpansion";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";
import { CLASS_SUBCLASS_GOLDEN_PROFILES } from "../reference/classSubclassGolden.reference";
import { certifyGoldenClassSubclassCharacter } from "./classSubclassCatalogGoldenIntegration";

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

describe("v5.120C golden class and subclass integration", () => {
  const rulesets = {
    dnd_2014: load("dnd_2014"),
    dnd_2024: load("dnd_2024"),
  };
  const results = CLASS_SUBCLASS_GOLDEN_PROFILES.map((profile) =>
    certifyGoldenClassSubclassCharacter(profile, rulesets[profile.edition])
  );

  it("covers every canonical class in both editions", () => {
    expect(CLASS_SUBCLASS_GOLDEN_PROFILES).toHaveLength(24);
    expect(new Set(CLASS_SUBCLASS_GOLDEN_PROFILES.map((profile) => `${profile.edition}:${profile.classId}`)).size).toBe(24);
  });

  it("resolves every real catalog selection at its official unlock level", () => {
    expect(results.filter((result) => !result.checks.catalogIdentity || !result.checks.selectionLevel)).toEqual([]);
    expect(results.filter((result) => !result.checks.featureUnlock)).toEqual([]);
  });

  it("preserves class, subclass and runtime through edit and storage hydration", () => {
    expect(results.filter((result) => !result.passed).map((result) => ({
      id: result.profile.id,
      checks: result.checks,
    }))).toEqual([]);
  });
});

