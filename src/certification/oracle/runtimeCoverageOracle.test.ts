import { describe, expect, it } from "vitest";
import {
  referenceFeatTier,
  referenceItemTier,
  referenceSpellTier,
  referenceSubclassTier,
} from "../reference/runtimeCoverage.reference";
import type {
  DndFeatData,
  DndItemData,
  DndSpellData,
  DndSubclassData,
} from "../../core/rulesets/ruleset.types";

describe("v5.119B independent runtime coverage oracle", () => {
  it("separates automatic, guided, table-ruling and missing feats", () => {
    const feat = (name: string, benefits: string[] = ["Benefit"]) =>
      ({ id: name, name, benefits } as DndFeatData);
    expect(referenceFeatTier(feat("Alert"))).toBe("automatic");
    expect(referenceFeatTier({ ...feat("Skilled"), choiceType: "skills" })).toBe("assisted");
    expect(referenceFeatTier(feat("Actor"))).toBe("manual");
    expect(referenceFeatTier(feat("Blank", []))).toBe("missing");
  });

  it("requires mechanical metadata before automatic spell or item status", () => {
    const spell = { description: "", effectType: "damage" } as DndSpellData;
    expect(referenceSpellTier(spell)).toBe("assisted");
    expect(referenceSpellTier({ ...spell, damageDice: "2d6" })).toBe("automatic");
    expect(referenceItemTier({ category: "gear", description: "" } as DndItemData)).toBe("missing");
    expect(referenceItemTier({ category: "gear", description: "", healingFormula: "2d4+2" } as DndItemData)).toBe("automatic");
  });

  it("requires subclass progression and recognizes runtime-backed features", () => {
    const subclass = { features: [] } as unknown as DndSubclassData;
    expect(referenceSubclassTier(subclass)).toBe("missing");
    expect(referenceSubclassTier({ ...subclass, features: [{ level: 3, name: "Lore", summary: "Guided" }] })).toBe("assisted");
    expect(referenceSubclassTier({ ...subclass, features: [{ level: 3, name: "Improved Critical", summary: "19-20" }] })).toBe("automatic");
  });
});
