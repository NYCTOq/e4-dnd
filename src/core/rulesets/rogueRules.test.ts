import { describe, expect, it } from "vitest";
import type { DndItemData } from "./ruleset.types";
import { canUseSneakAttack, getRogueCombatFeatures, getSneakAttackDice, isSneakAttackWeapon } from "./rogueRules";

const rapier = { category: "weapon", properties: ["Finesse"] } as DndItemData;
const club = { category: "weapon", properties: ["Light"] } as DndItemData;

describe("rogue rules", () => {
  it("scales Sneak Attack from 1d6 to 10d6", () => {
    expect(getSneakAttackDice(1)).toBe(1);
    expect(getSneakAttackDice(9)).toBe(5);
    expect(getSneakAttackDice(20)).toBe(10);
  });

  it("requires a finesse/ranged weapon and a valid opening", () => {
    expect(isSneakAttackWeapon(rapier)).toBe(true);
    expect(canUseSneakAttack({ level: 5, weapon: rapier, usedThisTurn: false, hasAdvantage: false, hasDisadvantage: false, allyAdjacent: true })).toBe(true);
    expect(canUseSneakAttack({ level: 5, weapon: club, usedThisTurn: false, hasAdvantage: true, hasDisadvantage: false, allyAdjacent: false })).toBe(false);
  });

  it("blocks Sneak Attack after use or with disadvantage", () => {
    expect(canUseSneakAttack({ level: 20, weapon: rapier, usedThisTurn: true, hasAdvantage: true, hasDisadvantage: false, allyAdjacent: false })).toBe(false);
    expect(canUseSneakAttack({ level: 20, weapon: rapier, usedThisTurn: false, hasAdvantage: true, hasDisadvantage: true, allyAdjacent: true })).toBe(false);
    expect(getRogueCombatFeatures(7)).toMatchObject({ cunningAction: true, uncannyDodge: true, evasion: true });
  });
});
