import { describe, expect, it } from "vitest";
import { getAbilityBudgetError } from "./abilityGenerationRules";

describe("ability generation rules", () => {
  it("accepts standard array plus one level-four ASI", () => expect(getAbilityBudgetError("standard-array", { str: 15, dex: 16, con: 13, int: 12, wis: 10, cha: 8 }, 2)).toBeNull());
  it("rejects six twenties even with a level-four ASI", () => expect(getAbilityBudgetError("standard-array", { str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 20 }, 2)).toContain("ulaşamaz"));
  it("enforces the point-buy budget", () => expect(getAbilityBudgetError("point-buy", { str: 15, dex: 15, con: 15, int: 15, wis: 15, cha: 15 }, 0)).toContain("27"));
});
