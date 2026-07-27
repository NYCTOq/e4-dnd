import { describe, expect, it } from "vitest";
import {
  mutateCharacterFeature,
  mutateFeatureInCollection,
  parseClassCharacterCollection,
  serializeClassCharacterCollection,
} from "../../core/rulesets/classFeaturePersistenceBridge";

describe("v5.112D2 class feature usage persistence matrix", () => {
  for (const wrapped of [false, true]) {
    for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
      for (const classId of [
        "fighter",
        "cleric",
        "wizard",
        "rogue",
        "warlock",
        "monk",
      ]) {
        for (const maximum of [1, 2, 3, 6]) {
          it(`${wrapped ? "wrapped" : "array"} ${ruleset} ${classId} max${maximum}`, () => {
            const character = {
              id: "matrix",
              ruleset,
              classId,
              level: 10,
              customData: { preserved: true },
              classFeatures: [
                {
                  id: "resource",
                  classId,
                  level: 1,
                  activation: "action" as const,
                  currentUses: maximum,
                  maxUses: maximum,
                  recovery: "short" as const,
                },
              ],
            };

            const collection = wrapped
              ? { characters: [character], version: 3 }
              : [character];

            const restored = parseClassCharacterCollection(
              serializeClassCharacterCollection(collection),
            );

            expect(restored).not.toBeNull();

            const spent = mutateFeatureInCollection(
              restored!,
              "matrix",
              "resource",
              "spend",
            );

            expect(
              spent.character?.classFeatures?.[0].currentUses,
            ).toBe(maximum - 1);

            const refilled = mutateCharacterFeature(
              spent.character!,
              "resource",
              "restore",
            );

            expect(refilled.classFeatures?.[0].currentUses).toBe(maximum);
            expect(refilled.customData).toEqual({ preserved: true });
          });
        }
      }
    }
  }
});
