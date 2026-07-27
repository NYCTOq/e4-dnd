import { describe, expect, it } from "vitest";
import { CERTIFIED_CLASSES } from "../reference/classes.full.reference";
import { FULL_CASTER_SLOT_TABLE } from "../reference/progression.reference";
import { expectedHpAtLevel, expectedProficiencyBonus, expectedSubclassAvailable } from "./progressionOracle";

describe("mega progression oracle", () => {
  it("certifies proficiency bonus for all 20 levels", () => {
    expect(Array.from({length:20}, (_,index) => expectedProficiencyBonus(index+1)))
      .toEqual([2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6]);
  });

  it.each(CERTIFIED_CLASSES)("$name level 1 hp uses full hit die", (entry) => {
    expect(expectedHpAtLevel({
      level:1,
      hitDie:entry.hitDie,
      constitutionModifier:2,
      useAverage:true,
    })).toBe(entry.hitDie + 2);
  });

  it.each(CERTIFIED_CLASSES)("$name average hp progresses to level 20", (entry) => {
    const hp = expectedHpAtLevel({
      level:20,
      hitDie:entry.hitDie,
      constitutionModifier:2,
      useAverage:true,
    });
    expect(hp).toBeGreaterThan(entry.hitDie);
  });

  it.each(CERTIFIED_CLASSES)("$name subclass gates differ correctly", (entry) => {
    expect(expectedSubclassAvailable("dnd_2014", entry.subclassLevel2014, entry.subclassLevel2014, entry.subclassLevel2024)).toBe(true);
    expect(expectedSubclassAvailable("dnd_2024", 3, entry.subclassLevel2014, entry.subclassLevel2024)).toBe(true);
  });

  it("certifies full caster slots through level 20", () => {
    expect(Object.keys(FULL_CASTER_SLOT_TABLE)).toHaveLength(20);
    expect(FULL_CASTER_SLOT_TABLE[1]).toEqual([2,0,0,0,0,0,0,0,0]);
    expect(FULL_CASTER_SLOT_TABLE[20]).toEqual([4,3,3,3,3,2,2,1,1]);
  });
});
