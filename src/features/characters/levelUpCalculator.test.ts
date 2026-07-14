import { describe, expect, it } from "vitest";
import { applyAbilityIncrease, buildLeveledCharacter, getAverageHpGain } from "./levelUpCalculator";
import { makeCharacter } from "../../test/fixtures";

describe("levelUpCalculator", () => {
  it("calculates average HP with constitution and a minimum of one", () => {
    expect(getAverageHpGain(8, 14)).toBe(7);
    expect(getAverageHpGain(6, 1)).toBe(1);
  });

  it("applies ASI only at milestones and caps scores at 20", () => {
    const abilities = makeCharacter().abilities;
    expect(applyAbilityIncrease(abilities, 5, "plus-two", "wis", "dex")).toEqual(abilities);
    expect(applyAbilityIncrease({ ...abilities, wis: 19 }, 4, "plus-two", "wis", "dex").wis).toBe(20);
  });

  it("levels a character without losing spent slots or hit dice", () => {
    const character = makeCharacter({ level: 5, className: "Cleric" });
    const leveled = buildLeveledCharacter(character, {
      hpGain: 7,
      hitDie: 8,
      asiMode: "none",
      primaryAbility: "wis",
      secondaryAbility: "con",
      updatedAt: "2026-07-14T00:00:00.000Z",
    });

    expect(leveled.level).toBe(6);
    expect(leveled.maxHp).toBe(45);
    expect(leveled.currentHp).toBe(27);
    expect(leveled.hitDice).toEqual([{ die: 8, max: 6, used: 2 }]);
    expect(leveled.spellSlots.find((slot) => slot.level === 1)?.used).toBe(2);
    expect(leveled.updatedAt).toBe("2026-07-14T00:00:00.000Z");
  });
});
