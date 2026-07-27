import { describe, expect, it } from "vitest";
import {
  deserializeRestCompatibleCharacter,
  performCharacterLongRest,
  performCharacterShortRest,
  serializeRestCompatibleCharacter,
  type RestCompatibleCharacter,
} from "../../core/rulesets/restRecoveryCharacterAdapter";

describe("v5.111C persistence and migration matrix", () => {
  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const level of [1, 5, 9, 13, 17, 20]) {
      for (const currentHp of [0, 1, 10, 25]) {
        it(`${ruleset} L${level} HP${currentHp} round trip + long rest`, () => {
          const character: RestCompatibleCharacter = {
            id: `${ruleset}-${level}-${currentHp}`,
            name: "Matrix Character",
            ruleset,
            level,
            currentHp,
            maxHp: 30,
            tempHp: 5,
            hitDice: [{ die: 8, max: level, used: Math.min(level, 3) }],
            spellSlots: [{ level: 1, max: 4, used: 3 }],
            resources: [
              { id: "resource", current: 0, max: 2, recovery: "long" },
            ],
            exhaustion: 2,
            deathSaves: { successes: 2, failures: 1 },
            concentrating: true,
            activeEffects: [
              { id: "effect", durationType: "minutes" },
            ],
          };

          const restored =
            deserializeRestCompatibleCharacter<RestCompatibleCharacter>(
              serializeRestCompatibleCharacter(character),
            );
          const result = performCharacterLongRest(restored);

          expect(result.character.currentHp).toBe(30);
          expect(result.character.tempHp).toBe(0);
          expect(result.character.spellSlots?.[0].used).toBe(0);
          expect(result.character.resources?.[0].current).toBe(2);
          expect(result.character.deathSaves).toEqual({
            successes: 0,
            failures: 0,
          });
        });
      }
    }
  }

  for (const pact of [false, true]) {
    for (const used of [0, 1, 2, 3]) {
      it(`short rest pact=${pact} used=${used}`, () => {
        const character: RestCompatibleCharacter = {
          currentHp: 10,
          maxHp: 20,
          spellSlots: [{ level: 2, max: 3, used, pact }],
        };

        const result = performCharacterShortRest(character);
        expect(result.character.spellSlots?.[0].used).toBe(
          pact ? 0 : used,
        );
      });
    }
  }

  for (const recovery of ["short", "long", "both", "manual"] as const) {
    for (const current of [0, 1, 2]) {
      it(`resource ${recovery} current ${current}`, () => {
        const character: RestCompatibleCharacter = {
          currentHp: 10,
          maxHp: 20,
          resources: [
            { id: "resource", current, max: 3, recovery },
          ],
        };

        const short = performCharacterShortRest(character);
        const long = performCharacterLongRest(character);

        expect(short.character.resources?.[0].current).toBe(
          recovery === "short" || recovery === "both" ? 3 : current,
        );
        expect(long.character.resources?.[0].current).toBe(
          recovery === "manual" ? current : 3,
        );
      });
    }
  }

  it("extra unknown character fields survive both rests", () => {
    const character: RestCompatibleCharacter = {
      id: "unknown-fields",
      currentHp: 1,
      maxHp: 10,
      customHomebrewFlag: true,
      nestedMetadata: { campaign: "Alabasta" },
    };

    expect(
      performCharacterShortRest(character).character.customHomebrewFlag,
    ).toBe(true);
    expect(
      performCharacterLongRest(character).character.nestedMetadata,
    ).toEqual({ campaign: "Alabasta" });
  });
});
