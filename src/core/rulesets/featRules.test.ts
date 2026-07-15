import { describe, expect, it } from "vitest";
import { getGeneralFeatSlotCount, getGrantedOriginFeatName, isFeatEligible } from "./featRules";
import type { DndFeatData } from "./ruleset.types";

const feat: DndFeatData = {
  id: "war-caster",
  name: "War Caster",
  ruleset: "dnd_2014",
  category: "general",
  summary: "Concentration ve savaş içinde büyü kullanımı.",
  benefits: [],
  prerequisite: { spellcasting: true, minimumLevel: 4 },
};

const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

describe("feat rules", () => {
  it("class-specific feat levels are counted", () => {
    expect(getGeneralFeatSlotCount(6, "Fighter", "dnd_2014")).toBe(2);
    expect(getGeneralFeatSlotCount(6, "Wizard", "dnd_2014")).toBe(1);
  });

  it("prerequisites explain why a feat is locked", () => {
    expect(isFeatEligible(feat, { level: 3, className: "Wizard", abilities, canCastSpells: true }).eligible).toBe(false);
    expect(isFeatEligible(feat, { level: 4, className: "Fighter", abilities, canCastSpells: false }).reasons).toContain("Spellcasting gerekli");
  });

  it("2024 background origin feat is granted automatically", () => {
    expect(getGrantedOriginFeatName("dnd_2024", "Tough")).toBe("Tough");
    expect(getGrantedOriginFeatName("dnd_2014", "Tough")).toBe("");
  });
});
