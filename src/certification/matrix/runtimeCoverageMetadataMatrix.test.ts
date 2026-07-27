import { describe, expect, it } from "vitest";
import { classifyFeat, classifyItem, classifySpell } from "../../core/rulesets/runtimeCoverageCertification";
import type { DndFeatData, DndItemData, DndSpellData } from "../../core/rulesets/ruleset.types";
import { referenceFeatTier, referenceItemTier, referenceSpellTier } from "../reference/runtimeCoverage.reference";

describe("v5.119B runtime metadata matrix", () => {
  it("matches 480 deterministic edition/category metadata scenarios", () => {
    let scenarios = 0;
    for (const edition of ["dnd_2014", "dnd_2024"] as const) {
      for (let index = 0; index < 80; index += 1) {
        const feat = {
          id: `${edition}-feat-${index}`, name: index % 5 === 0 ? "Alert" : `Narrative ${index}`,
          ruleset: edition, benefits: index % 4 === 0 ? [] : ["Benefit"],
          ...(index % 3 === 0 ? { choiceType: "skills" } : {}),
        } as DndFeatData;
        const spell = {
          id: `${edition}-spell-${index}`, name: `Spell ${index}`, description: index % 7 ? "Description" : "",
          effectType: index % 4 === 0 ? "damage" : index % 4 === 1 ? "movement" : undefined,
          damageDice: index % 8 === 0 ? "2d6" : undefined,
        } as DndSpellData;
        const item = {
          id: `${edition}-item-${index}`, name: `Item ${index}`, category: index % 5 === 0 ? "weapon" : "gear",
          description: index % 6 ? "Description" : "", healingFormula: index % 8 === 0 ? "2d4+2" : undefined,
        } as DndItemData;
        expect(classifyFeat(feat).tier).toBe(referenceFeatTier(feat));
        expect(classifySpell(spell).tier).toBe(referenceSpellTier(spell));
        expect(classifyItem(item).tier).toBe(referenceItemTier(item));
        scenarios += 3;
      }
    }
    expect(scenarios).toBe(480);
  });
});
