import { describe, expect, it } from "vitest";
import { applyAbilityLayers, getAsiBudget, getFeatSelectionAsiError, getPointBuyRemaining, isStandardArrayAssignment, updateAbilityIncrease } from "./highLevelAbilityBuilder";

const base = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

describe("high level ability builder", () => {
  it("recognizes standard array independent of ability order", () => {
    expect(isStandardArrayAssignment(base)).toBe(true);
    expect(isStandardArrayAssignment({ ...base, wis: 11 })).toBe(false);
  });

  it("tracks the official 27 point-buy budget", () => {
    expect(getPointBuyRemaining({ str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 })).toBe(0);
  });

  it("gives a level 5 cleric two ASI points", () => {
    expect(getAsiBudget(5, "Cleric", "dnd_2014", 0)).toBe(2);
  });

  it("removes an ASI slot when a feat is selected", () => {
    expect(getAsiBudget(8, "Cleric", "dnd_2014", 1)).toBe(2);
  });

  it("blocks choosing a feat while the same slot still has ASI points", () => {
    expect(getFeatSelectionAsiError({
      level: 5,
      className: "Cleric",
      ruleset: "dnd_2014",
      featIds: [],
      abilityScoreIncreases: { wis: 2 },
    } as never, 1)).toContain("Önce Level ASI dağılımından 2 puanı geri almalısın");
  });

  it("allows choosing a feat after the competing ASI allocation is cleared", () => {
    expect(getFeatSelectionAsiError({
      level: 5,
      className: "Cleric",
      ruleset: "dnd_2014",
      featIds: [],
      abilityScoreIncreases: {},
    } as never, 1)).toBeNull();
  });

  it("applies base, origin and high-level ASI as separate layers", () => {
    expect(applyAbilityLayers(base, { wis: 1 }, { wis: 2 }).wis).toBe(13);
  });

  it("does not allow allocation beyond budget", () => {
    expect(updateAbilityIncrease({ wis: 2 }, "con", 1, 2)).toEqual({ wis: 2 });
  });
});
