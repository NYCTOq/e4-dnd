import { describe, expect, it } from "vitest";
import {
  applyDeathSaveRoll,
  classifyDeathSaveRoll,
  clampDeathSaveCount,
  damageAtZero,
  healFromZero,
  isMassiveDamageDeath,
  normalizeDeathSaveState,
  resetDeathSaves,
  stabilize,
} from "../reference/deathDying.reference";
import {
  runtimeApplyDeathSaveRoll,
  runtimeClassifyDeathSaveRoll,
  runtimeClampDeathSaveCount,
  runtimeDamageAtZero,
  runtimeHealFromZero,
  runtimeIsMassiveDamageDeath,
  runtimeNormalizeDeathSaveState,
  runtimeResetDeathSaves,
  runtimeStabilize,
} from "../../core/rulesets/deathDyingRuntimeRules";

describe("v5.115B death & dying differential", () => {
  for (const value of [-10, -1, 0, 1, 2, 3, 4, 99]) {
    it(`clamp ${value}`, () => {
      expect(
        runtimeClampDeathSaveCount(value),
      ).toBe(
        clampDeathSaveCount(value),
      );
    });
  }

  for (let roll = 1; roll <= 20; roll += 1) {
    it(`classify ${roll}`, () => {
      expect(
        runtimeClassifyDeathSaveRoll(roll),
      ).toBe(
        classifyDeathSaveRoll(roll),
      );
    });
  }

  for (let successes = 0; successes <= 4; successes += 1) {
    for (let failures = 0; failures <= 4; failures += 1) {
      it(`normalize ${successes}/${failures}`, () => {
        expect(
          runtimeNormalizeDeathSaveState({
            successes,
            failures,
          }),
        ).toEqual(
          normalizeDeathSaveState({
            successes,
            failures,
          }),
        );
      });

      for (let roll = 1; roll <= 20; roll += 1) {
        it(`roll ${successes}/${failures}/${roll}`, () => {
          expect(
            runtimeApplyDeathSaveRoll(
              {
                successes,
                failures,
              },
              roll,
            ),
          ).toEqual(
            applyDeathSaveRoll(
              {
                successes,
                failures,
              },
              roll,
            ),
          );
        });
      }
    }
  }

  for (const critical of [false, true]) {
    it(`damage-zero/${critical}`, () => {
      expect(
        runtimeDamageAtZero(critical),
      ).toEqual(
        damageAtZero(critical),
      );
    });
  }

  for (const scenario of [
    { currentHp: 10, maxHp: 10, damage: 5 },
    { currentHp: 10, maxHp: 10, damage: 20 },
    { currentHp: 5, maxHp: 20, damage: 24 },
    { currentHp: 5, maxHp: 20, damage: 25 },
    { currentHp: 0, maxHp: 8, damage: 8 },
  ]) {
    it(`massive/${JSON.stringify(scenario)}`, () => {
      expect(
        runtimeIsMassiveDamageDeath(
          scenario.currentHp,
          scenario.maxHp,
          scenario.damage,
        ),
      ).toBe(
        isMassiveDamageDeath(
          scenario.currentHp,
          scenario.maxHp,
          scenario.damage,
        ),
      );
    });
  }

  it("stabilize matches oracle", () => {
    expect(
      runtimeStabilize({
        successes: 1,
        failures: 2,
      }),
    ).toEqual(
      stabilize({
        successes: 1,
        failures: 2,
      }),
    );
  });

  it("dead stabilize matches oracle", () => {
    expect(
      runtimeStabilize({
        successes: 0,
        failures: 3,
        dead: true,
      }),
    ).toEqual(
      stabilize({
        successes: 0,
        failures: 3,
        dead: true,
      }),
    );
  });

  for (const healing of [0, 1, 5, 20]) {
    it(`heal-zero/${healing}`, () => {
      expect(
        runtimeHealFromZero(healing),
      ).toEqual(
        healFromZero(healing),
      );
    });
  }

  it("reset matches oracle", () => {
    expect(
      runtimeResetDeathSaves(),
    ).toEqual(
      resetDeathSaves(),
    );
  });
});
