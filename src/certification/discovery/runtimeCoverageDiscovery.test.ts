import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enrichClassProgression } from "../../core/rulesets/classProgressionAudit";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "../../core/rulesets/featExpansion";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "../../core/rulesets/itemExpansion";
import { getRuntimeCoverageCertification } from "../../core/rulesets/runtimeCoverageCertification";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "../../core/rulesets/spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "../../core/rulesets/subclassExpansion";
import { buildRuntimeCoverageDiscovery } from "./runtimeCoverageDiscovery";

const read = <T>(edition: string, file: string) =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const merge = <T extends { id: string }>(base: T[], extra: T[]) => [
  ...base,
  ...extra.filter((item) => !base.some((existing) => existing.id === item.id)),
];
function load(edition: "dnd_2014" | "dnd_2024"): RulesetData {
  return {
    id: edition, name: edition,
    classes: read<RulesetData["classes"][number]>(edition, "classes").map((item) => enrichClassProgression(item, edition)),
    subclasses: merge(read(edition, "subclasses"), edition === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024),
    races: read(edition, "races"), backgrounds: read(edition, "backgrounds"),
    feats: merge(read(edition, "feats"), edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024),
    spells: merge(read(edition, "spells"), edition === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024),
    items: merge(read(edition, "items"), edition === "dnd_2014" ? ITEM_EXPANSION_2014 : ITEM_EXPANSION_2024),
    monsters: read(edition, "monsters"),
  };
}

describe("v5.119A runtime coverage discovery", () => {
  const reports = (["dnd_2014", "dnd_2024"] as const)
    .map((edition) => getRuntimeCoverageCertification(load(edition)));
  const discovery = buildRuntimeCoverageDiscovery(reports);

  it("inventories both editions and all four selected runtime categories", () => {
    expect(discovery).toMatchObject({
      package: "v5.119A",
      version: "5.119.0",
      status: "READY_FOR_CLOSURE",
      editions: ["dnd_2014", "dnd_2024"],
      nextPackage: "v5.119B",
    });
    expect(discovery.categories.map((category) => category.id))
      .toEqual(["subclasses", "feats", "spells", "items"]);
    expect(discovery.categories.every((category) =>
      category.total === category.automatic + category.assisted + category.manual + category.missing
    )).toBe(true);
  });

  it("keeps missing behavior as blockers and guided/manual behavior in review", () => {
    expect(discovery.totals.entities).toBeGreaterThan(100);
    expect(discovery.blockers).toHaveLength(discovery.totals.missing);
    expect(discovery.reviewQueue.length).toBeGreaterThan(0);
    expect(discovery.nextTarget).toBe("Runtime Differential and Missing Behavior Closure");
  });
});
