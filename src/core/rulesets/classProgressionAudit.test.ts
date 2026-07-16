import { describe, expect, it } from "vitest";
import type { DndClassData } from "./ruleset.types";
import { auditClassProgression, enrichClassProgression, getClassAsiLevels } from "./classProgressionAudit";

const fighter = { name: "Fighter", subclassLevel: 3, spellProgression: "none", levels: Array.from({ length: 20 }, (_, index) => ({ level: index + 1, proficiencyBonus: 2, features: index === 19 ? ["Three Extra Attacks"] : [] })) } as DndClassData;

describe("class progression audit", () => {
  it("includes fighter and rogue bonus ASI levels", () => { expect(getClassAsiLevels("Fighter", "dnd_2014")).toContain(14); expect(getClassAsiLevels("Rogue", "dnd_2014")).toContain(10); });
  it("enriches empty ASI rows without replacing class features", () => expect(enrichClassProgression(fighter, "dnd_2014").levels.find((row) => row.level === 6)?.features).toContain("Ability Score Improvement / Feat"));
  it("passes a complete enriched level 1-20 progression", () => expect(auditClassProgression(enrichClassProgression(fighter, "dnd_2014"), "dnd_2014").ready).toBe(true));
});
