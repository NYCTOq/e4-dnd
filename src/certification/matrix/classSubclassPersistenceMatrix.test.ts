import { describe, expect, it } from "vitest";
import {
  applyClassFeatureRest,
  buildClassRuntimeSnapshot,
  deserializeClassCompatibleCharacter,
  serializeClassCompatibleCharacter,
  type ClassCompatibleCharacter,
} from "../../core/rulesets/classSubclassCharacterAdapter";

describe("v5.112C class/subclass persistence matrix", () => {
  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const classId of [
      "fighter",
      "cleric",
      "wizard",
      "rogue",
      "warlock",
      "monk",
    ]) {
      for (const level of [1, 3, 5, 10, 17, 20]) {
        it(`${ruleset} ${classId} L${level}`, () => {
          const character: ClassCompatibleCharacter = {
            id: `${ruleset}-${classId}-${level}`,
            ruleset,
            classId,
            level,
            customMetadata: { campaign: "Alabasta" },
            classFeatures: [
              {
                id: "resource",
                classId,
                level: 1,
                activation: "action",
                currentUses: 0,
                maxUsesRule: { type: "proficiency-bonus" },
                recovery: "short",
              },
              {
                id: "late-feature",
                classId,
                level: 10,
                activation: "passive",
              },
            ],
          };

          const restored =
            deserializeClassCompatibleCharacter<ClassCompatibleCharacter>(
              serializeClassCompatibleCharacter(character),
            );

          const snapshot = buildClassRuntimeSnapshot(restored);
          expect(snapshot.characterLevel).toBe(level);
          expect(snapshot.classLevels[classId]).toBe(level);

          const rested = applyClassFeatureRest(restored, "short");
          expect(rested.customMetadata).toEqual({ campaign: "Alabasta" });
        });
      }
    }
  }

  for (const recovery of ["short", "long", "both", "manual"] as const) {
    for (const rest of ["short", "long"] as const) {
      it(`${recovery} feature on ${rest}`, () => {
        const character: ClassCompatibleCharacter = {
          classId: "fighter",
          level: 5,
          classFeatures: [
            {
              id: "resource",
              classId: "fighter",
              level: 1,
              activation: "action",
              currentUses: 0,
              maxUses: 3,
              recovery,
            },
          ],
        };

        const result = applyClassFeatureRest(character, rest);
        const expected =
          recovery === "both" ||
          recovery === rest ||
          (rest === "long" && recovery === "short")
            ? 3
            : 0;

        expect(result.classFeatures?.[0].currentUses).toBe(expected);
      });
    }
  }

  it("homebrew feature fields survive round trip", () => {
    const character: ClassCompatibleCharacter = {
      classId: "homebrew",
      level: 7,
      classFeatures: [
        {
          id: "homebrew-power",
          classId: "homebrew",
          level: 3,
          activation: "special",
          customEffect: "sandstorm",
        } as never,
      ],
    };

    const restored =
      deserializeClassCompatibleCharacter<ClassCompatibleCharacter>(
        serializeClassCompatibleCharacter(character),
      );

    const restoredFeature = restored.classFeatures?.[0] as
      | Record<string, unknown>
      | undefined;

    expect(
      restoredFeature?.customEffect,
    ).toBe("sandstorm");
  });
});
