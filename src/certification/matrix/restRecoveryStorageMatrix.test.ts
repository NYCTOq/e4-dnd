import { describe, expect, it } from "vitest";
import {
  applyRestToCharacterCollection,
  parseCharacterCollection,
  serializeCharacterCollection,
} from "../../core/rulesets/restRecoveryPersistenceBridge";

describe("v5.111D2 storage round-trip matrix", () => {
  for (const wrapped of [false, true]) {
    for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
      for (const kind of ["short", "long"] as const) {
        for (const currentHp of [0, 1, 10, 29, 30]) {
          it(`${wrapped ? "wrapped" : "array"} ${ruleset} ${kind} HP${currentHp}`, () => {
            const character = {
              id: "matrix",
              name: "Matrix",
              ruleset,
              currentHp,
              maxHp: 30,
              spellSlots: [
                { level: 1, max: 4, used: 3 },
                { level: 2, max: 2, used: 2, pact: true },
              ],
              resources: [
                { id: "short", current: 0, max: 2, recovery: "short" as const },
                { id: "long", current: 0, max: 3, recovery: "long" as const },
              ],
              deathSaves: { successes: 2, failures: 1 },
            };

            const collection = wrapped
              ? { characters: [character], version: 7 }
              : [character];

            const restored = parseCharacterCollection(
              serializeCharacterCollection(collection),
            );
            expect(restored).not.toBeNull();

            const result = applyRestToCharacterCollection(
              restored!,
              "matrix",
              kind,
            );

            expect(result.updated).toBe(true);
            expect(result.character?.id).toBe("matrix");

            if (kind === "long") {
              expect(result.character?.currentHp).toBe(30);
              expect(result.character?.deathSaves).toEqual({
                successes: 0,
                failures: 0,
              });
            } else {
              expect(result.character?.currentHp).toBe(currentHp);
              expect(result.character?.spellSlots?.[1].used).toBe(0);
            }
          });
        }
      }
    }
  }
});
