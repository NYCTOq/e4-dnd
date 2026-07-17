import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { enrichClassProgression } from "./classProgressionAudit";
import { FEAT_EXPANSION_2014, FEAT_EXPANSION_2024 } from "./featExpansion";
import { getFullCharacterCertification } from "./fullCharacterCertification";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "./itemExpansion";
import type { RulesetData } from "./ruleset.types";
import { SPELL_EXPANSION_2014, SPELL_EXPANSION_2024 } from "./spellExpansion";
import { SUBCLASS_EXPANSION_2014, SUBCLASS_EXPANSION_2024 } from "./subclassExpansion";
const read = <T,>(edition: string, file: string) => JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/${file}.json`, import.meta.url), "utf8")) as T[];
const merge = <T extends { id: string }>(base: T[], extra: T[]) => [...base, ...extra.filter((item) => !base.some((existing) => existing.id === item.id))];
function load(edition: "dnd_2014" | "dnd_2024"): RulesetData { return { id: edition, name: edition, classes: read<RulesetData["classes"][number]>(edition, "classes").map((item) => enrichClassProgression(item, edition)), subclasses: merge(read(edition, "subclasses"), edition === "dnd_2014" ? SUBCLASS_EXPANSION_2014 : SUBCLASS_EXPANSION_2024), races: read(edition, "races"), backgrounds: read(edition, "backgrounds"), feats: merge(read(edition, "feats"), edition === "dnd_2014" ? FEAT_EXPANSION_2014 : FEAT_EXPANSION_2024), spells: merge(read(edition, "spells"), edition === "dnd_2014" ? SPELL_EXPANSION_2014 : SPELL_EXPANSION_2024), items: merge(read(edition, "items"), edition === "dnd_2014" ? ITEM_EXPANSION_2014 : ITEM_EXPANSION_2024), monsters: read(edition, "monsters") }; }
describe("real full character certification matrix", () => {
  it("certifies every 2014 and 2024 class at critical levels", () => { const result = getFullCharacterCertification([load("dnd_2014"), load("dnd_2024")]); expect(result.combinations).toBe(24); expect(result.classMatrix.filter((entry) => entry.status !== "pass")).toEqual([]); expect(result.blockers).toEqual([]); expect(result.status).toBe("certified"); });
  it("covers subclass unlock and level 20 for every class", () => { const result = getFullCharacterCertification([load("dnd_2014"), load("dnd_2024")]); expect(result.classMatrix.every((entry) => entry.criticalLevels.includes(entry.subclassLevel) && entry.criticalLevels.includes(20))).toBe(true); });
});
