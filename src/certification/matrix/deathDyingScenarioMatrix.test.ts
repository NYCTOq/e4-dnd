import { describe, expect, it } from "vitest";
import {
  runtimeApplyDeathSaveRoll,
  runtimeDamageAtZero,
  runtimeHealFromZero,
  runtimeIsMassiveDamageDeath,
  runtimeResetDeathSaves,
  runtimeStabilize,
} from "../../core/rulesets/deathDyingRuntimeRules";

describe("v5.115B death & dying scenario matrix", () => {
  for (let successes = 0; successes <= 2; successes += 1) {
    for (let failures = 0; failures <= 2; failures += 1) {
      for (let roll = 1; roll <= 20; roll += 1) {
        it(`save/S${successes}/F${failures}/R${roll}`, () => {
          const result =
            runtimeApplyDeathSaveRoll(
              { successes, failures },
              roll,
            );

          expect(
            result.state.successes,
          ).toBeGreaterThanOrEqual(0);
          expect(
            result.state.failures,
          ).toBeGreaterThanOrEqual(0);
          expect(
            result.state.successes,
          ).toBeLessThanOrEqual(3);
          expect(
            result.state.failures,
          ).toBeLessThanOrEqual(3);

          if (roll === 20) {
            expect(result.hpDelta).toBe(1);
          }
        });
      }
    }
  }

  for (const critical of [false, true]) {
    it(`zero-hp-damage/${critical}`, () => {
      const result =
        runtimeDamageAtZero(critical);

      expect(result.failuresAdded).toBe(
        critical ? 2 : 1,
      );
    });
  }

  for (const maxHp of [1, 8, 10, 20, 100]) {
    for (const currentHp of [0, 1, 5, 10]) {
      for (const damage of [0, 1, 5, 10, 20, 50, 100, 200]) {
        it(`massive/${currentHp}/${maxHp}/${damage}`, () => {
          expect(
            typeof runtimeIsMassiveDamageDeath(
              currentHp,
              maxHp,
              damage,
            ),
          ).toBe("boolean");
        });
      }
    }
  }

  for (const healing of [0, 1, 2, 5, 20, 100]) {
    it(`healing/${healing}`, () => {
      const result =
        runtimeHealFromZero(healing);

      expect(result.hp).toBe(
        Math.max(0, healing),
      );
      expect(result.state).toEqual(
        runtimeResetDeathSaves(),
      );
    });
  }

  it("stabilize resets death-save counts", () => {
    expect(
      runtimeStabilize({
        successes: 2,
        failures: 1,
      }),
    ).toEqual({
      successes: 0,
      failures: 0,
      stable: true,
      dead: false,
    });
  });

  it("three failures remains dead", () => {
    expect(
      runtimeStabilize({
        successes: 0,
        failures: 3,
      }),
    ).toMatchObject({
      dead: true,
      stable: false,
    });
  });
});
