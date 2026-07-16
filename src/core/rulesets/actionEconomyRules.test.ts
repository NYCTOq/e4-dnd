import { describe, expect, it } from "vitest";
import { createTurnEconomy, getAttacksPerAction, spendAttack, spendMovement, spendTurnResource } from "./actionEconomyRules";

describe("action economy", () => {
  it("tracks action, bonus action and reaction independently", () => {
    const turn = spendTurnResource(spendTurnResource(createTurnEconomy(), "action"), "reaction");
    expect(turn).toMatchObject({ actionUsed: true, bonusActionUsed: false, reactionUsed: true });
  });

  it("uses class-level Extra Attack progression", () => {
    expect(getAttacksPerAction("Fighter", 20)).toBe(4);
    expect(getAttacksPerAction("Paladin", 5)).toBe(2);
    expect(getAttacksPerAction("Wizard", 20)).toBe(1);
  });

  it("caps movement and spends action after the final attack", () => {
    expect(spendMovement(createTurnEconomy(), 40, 30).movementUsed).toBe(30);
    const first = spendAttack(createTurnEconomy(), 2);
    expect(first.actionUsed).toBe(false);
    expect(spendAttack(first, 2).actionUsed).toBe(true);
  });
});
