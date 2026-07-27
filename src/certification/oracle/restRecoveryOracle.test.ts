import { describe, expect, it } from "vitest";
import {
  abilityModifier,
  applyLongRest,
  applyShortRest,
  proficiencyBonus,
  recoverHitDice,
  recoverResources,
  recoverSpellSlots,
  spendHitDie,
  spendResource,
  spendSpellSlot,
  type RestState,
} from "../reference/restRecovery.reference";

const baseState = (): RestState => ({
  currentHp: 7,
  maxHp: 20,
  tempHp: 5,
  hitDice: [
    { die: 8, max: 3, used: 2 },
    { die: 10, max: 2, used: 1 },
  ],
  spellSlots: [
    { level: 1, max: 4, used: 3 },
    { level: 2, max: 2, used: 2 },
    { level: 1, max: 2, used: 2, pact: true },
  ],
  resources: [
    { id: "action-surge", current: 0, max: 1, recovery: "short" },
    { id: "rage", current: 1, max: 3, recovery: "long" },
    { id: "focus", current: 0, max: 4, recovery: "both" },
    { id: "custom", current: 1, max: 2, recovery: "manual" },
  ],
  exhaustion: 4,
  deathSaves: { successes: 2, failures: 1 },
  concentrating: true,
  activeEffects: [
    { id: "bless", durationType: "minutes" },
    { id: "short-buff", durationType: "until-rest", expiresOn: "short" },
    { id: "long-buff", durationType: "until-rest", expiresOn: "long" },
    { id: "curse", durationType: "permanent" },
  ],
});

describe("v5.111A rest/recovery independent reference oracle", () => {
  for (const [level, expected] of [
    [1, 2], [4, 2], [5, 3], [8, 3],
    [9, 4], [12, 4], [13, 5], [16, 5],
    [17, 6], [20, 6],
  ] as const) {
    it(`PB level ${level}`, () => {
      expect(proficiencyBonus(level)).toBe(expected);
    });
  }

  for (const [score, expected] of [
    [1, -5], [8, -1], [9, -1], [10, 0], [11, 0],
    [12, 1], [14, 2], [16, 3], [18, 4], [20, 5], [30, 10],
  ] as const) {
    it(`ability modifier ${score}`, () => {
      expect(abilityModifier(score)).toBe(expected);
    });
  }

  for (const roll of [1, 2, 4, 6, 8]) {
    for (const conModifier of [-2, 0, 2, 4]) {
      it(`spends d8 roll ${roll} CON ${conModifier}`, () => {
        const result = spendHitDie(baseState(), 8, roll, conModifier);
        expect(result.hitDice[0].used).toBe(3);
        expect(result.currentHp).toBe(
          Math.min(20, 7 + Math.max(0, roll + conModifier)),
        );
      });
    }
  }

  it("does not spend unavailable hit die", () => {
    const state = baseState();
    state.hitDice[0].used = state.hitDice[0].max;
    expect(spendHitDie(state, 8, 8, 2)).toEqual(state);
  });

  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    it(`${ruleset} hit dice recovery`, () => {
      const result = recoverHitDice(baseState().hitDice, ruleset);
      if (ruleset === "dnd_2014") {
        expect(result.reduce((sum, pool) => sum + pool.used, 0)).toBe(1);
      } else {
        expect(result.every((pool) => pool.used === 0)).toBe(true);
      }
    });

    it(`${ruleset} long rest full state`, () => {
      const result = applyLongRest(baseState(), ruleset);
      expect(result.currentHp).toBe(20);
      expect(result.tempHp).toBe(0);
      expect(result.spellSlots.every((slot) => slot.used === 0)).toBe(true);
      expect(result.resources.find((r) => r.id === "action-surge")?.current).toBe(1);
      expect(result.resources.find((r) => r.id === "rage")?.current).toBe(3);
      expect(result.resources.find((r) => r.id === "focus")?.current).toBe(4);
      expect(result.resources.find((r) => r.id === "custom")?.current).toBe(1);
      expect(result.deathSaves).toEqual({ successes: 0, failures: 0 });
      expect(result.concentrating).toBe(false);
      expect(result.activeEffects.map((e) => e.id)).toEqual(["curse"]);
      expect(result.exhaustion).toBe(ruleset === "dnd_2014" ? 3 : 0);
    });
  }

  it("short rest recovers short/both resources and pact slots", () => {
    const result = applyShortRest(baseState());
    expect(result.resources.find((r) => r.id === "action-surge")?.current).toBe(1);
    expect(result.resources.find((r) => r.id === "rage")?.current).toBe(1);
    expect(result.resources.find((r) => r.id === "focus")?.current).toBe(4);
    expect(result.resources.find((r) => r.id === "custom")?.current).toBe(1);
    expect(result.spellSlots[0].used).toBe(3);
    expect(result.spellSlots[1].used).toBe(2);
    expect(result.spellSlots[2].used).toBe(0);
    expect(result.activeEffects.map((e) => e.id)).not.toContain("short-buff");
  });

  for (const rest of ["short", "long"] as const) {
    it(`resource recovery ${rest}`, () => {
      const result = recoverResources(baseState().resources, rest);
      expect(result).toHaveLength(4);
    });

    it(`spell slot recovery ${rest}`, () => {
      const result = recoverSpellSlots(baseState().spellSlots, rest);
      expect(result).toHaveLength(3);
    });
  }

  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    it(`spell slot spending level ${level}`, () => {
      const pools = [
        { level: 1, max: 2, used: 0 },
        { level: 2, max: 1, used: 0 },
      ];
      const result = spendSpellSlot(pools, level);
      const target = result.find((pool) => pool.level === level);
      if (target) expect(target.used).toBe(1);
      else expect(result).toEqual(pools);
    });
  }

  for (const amount of [0, 1, 2, 3, 5]) {
    it(`resource spending amount ${amount}`, () => {
      const pools = baseState().resources;
      const result = spendResource(pools, "rage", amount);
      expect(result.find((r) => r.id === "rage")?.current).toBe(
        Math.max(0, 1 - amount),
      );
    });
  }

  it("does not mutate source state", () => {
    const source = baseState();
    const snapshot = structuredClone(source);
    applyShortRest(source);
    applyLongRest(source, "dnd_2014");
    spendHitDie(source, 8, 5, 2);
    expect(source).toEqual(snapshot);
  });

  it("clamps healing to max HP", () => {
    const state = baseState();
    state.currentHp = 19;
    expect(spendHitDie(state, 8, 8, 5).currentHp).toBe(20);
  });

  it("healing never lowers HP", () => {
    const state = baseState();
    const result = spendHitDie(state, 8, 1, -5);
    expect(result.currentHp).toBe(state.currentHp);
  });
});
