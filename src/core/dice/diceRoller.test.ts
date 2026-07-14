import { afterEach, describe, expect, it, vi } from "vitest";
import { formatNotation, rollDice } from "./diceRoller";

afterEach(() => vi.restoreAllMocks());

describe("diceRoller", () => {
  it("formats and clamps notation", () => {
    expect(formatNotation({ count: 0, sides: 1, modifier: 10000 })).toBe("1d2+999");
    expect(formatNotation({ count: 2, sides: 6, modifier: -3 })).toBe("2d6-3");
  });

  it("returns deterministic totals when Math.random is mocked", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.999);
    const result = rollDice({ count: 2, sides: 6, modifier: 2 });
    expect(result.rolls).toEqual([1, 6]);
    expect(result.total).toBe(9);
    expect(result.notation).toBe("2d6+2");
  });
});
