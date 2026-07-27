import { describe, expect, it } from "vitest";
import {
  applyDeathSaveRoll,
  clampDeathSaveCount,
  damageAtZeroFailureCount,
  deathSaveRollOutcome,
  healFromZero,
  massiveDamageKills,
  normalizeDeathSaveState,
  resetDeathSaves,
  stabilizeDeathSaveState,
} from "../reference/deathDying.reference";

describe("v5.115A death & dying oracle", () => {
  for (const [input, expected] of [
    [-3, 0],
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
    [8, 3],
  ] as const) {
    it(`clamps death save count ${input}`, () => {
      expect(clampDeathSaveCount(input)).toBe(expected);
    });
  }

  for (let roll = 1; roll <= 20; roll += 1) {
    it(`classifies death save roll ${roll}`, () => {
      const outcome = deathSaveRollOutcome(roll);

      if (roll === 1) {
        expect(outcome).toBe("critical-failure");
      } else if (roll === 20) {
        expect(outcome).toBe("critical-success");
      } else if (roll >= 10) {
        expect(outcome).toBe("success");
      } else {
        expect(outcome).toBe("failure");
      }
    });
  }

  for (let successes = 0; successes <= 4; successes += 1) {
    for (let failures = 0; failures <= 4; failures += 1) {
      it(`normalizes ${successes}/${failures}`, () => {
        const result = normalizeDeathSaveState({
          successes,
          failures,
        });

        expect(result.successes).toBeGreaterThanOrEqual(0);
        expect(result.successes).toBeLessThanOrEqual(3);
        expect(result.failures).toBeGreaterThanOrEqual(0);
        expect(result.failures).toBeLessThanOrEqual(3);

        if (failures >= 3) {
          expect(result.dead).toBe(true);
        } else if (successes >= 3) {
          expect(result.stable).toBe(true);
        }
      });
    }
  }

  for (let successes = 0; successes <= 2; successes += 1) {
    for (let failures = 0; failures <= 2; failures += 1) {
      for (let roll = 1; roll <= 20; roll += 1) {
        it(`applies roll S${successes}/F${failures}/R${roll}`, () => {
          const result = applyDeathSaveRoll(
            {
              successes,
              failures,
              stable: false,
              dead: false,
            },
            roll,
          );

          if (roll === 20) {
            expect(result.regainHp).toBe(1);
            expect(result.dead).toBe(false);
          } else {
            expect(result.regainHp).toBe(0);
          }
        });
      }
    }
  }

  for (const critical of [false, true]) {
    it(`damage at zero critical=${critical}`, () => {
      expect(
        damageAtZeroFailureCount(critical),
      ).toBe(critical ? 2 : 1);
    });
  }

  const massiveCases = [
    { currentHp: 10, maxHp: 10, damage: 5, dead: false },
    { currentHp: 10, maxHp: 10, damage: 20, dead: true },
    { currentHp: 5, maxHp: 20, damage: 24, dead: false },
    { currentHp: 5, maxHp: 20, damage: 25, dead: true },
    { currentHp: 0, maxHp: 8, damage: 8, dead: true },
  ];

  for (const testCase of massiveCases) {
    it(`massive damage ${JSON.stringify(testCase)}`, () => {
      expect(
        massiveDamageKills(
          testCase.currentHp,
          testCase.maxHp,
          testCase.damage,
        ),
      ).toBe(testCase.dead);
    });
  }

  it("stabilizes a living dying character", () => {
    expect(
      stabilizeDeathSaveState({
        successes: 1,
        failures: 2,
        stable: false,
        dead: false,
      }),
    ).toEqual({
      successes: 0,
      failures: 0,
      stable: true,
      dead: false,
    });
  });

  it("does not stabilize a dead character", () => {
    expect(
      stabilizeDeathSaveState({
        successes: 0,
        failures: 3,
        stable: false,
        dead: true,
      }).dead,
    ).toBe(true);
  });

  for (const amount of [0, 1, 5, 20]) {
    it(`heals from zero by ${amount}`, () => {
      const result = healFromZero(amount);

      expect(result.currentHp).toBe(amount);
      expect(result.deathSaves).toEqual(
        resetDeathSaves(),
      );
    });
  }

  it("resets death saves", () => {
    expect(resetDeathSaves()).toEqual({
      successes: 0,
      failures: 0,
      stable: false,
      dead: false,
    });
  });
});
