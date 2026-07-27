import { describe, expect, it } from "vitest";
import {
  buildAbilityIncreaseChoice,
  buildFeatChoice,
  mutateCharacterLevelUpInCollection,
  parseLevelUpCharacterCollection,
  serializeLevelUpCollection,
} from "../../core/rulesets/levelUpPersistenceBridge";

const classes = [
  ["fighter", 10],
  ["rogue", 8],
  ["cleric", 8],
  ["wizard", 6],
  ["warlock", 8],
] as const;

describe("v5.114D2 level-up UI persistence matrix", () => {
  for (const wrapped of [false, true]) {
    for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
      for (const [classId, hitDie] of classes) {
        for (const level of [1, 2, 3, 4, 8, 10, 16, 19]) {
          it(`${wrapped ? "wrapped" : "array"}/${ruleset}/${classId}/${level}`, () => {
            const character = {
              id: "character",
              level,
              ruleset,
              maxHp: Math.max(1, level * 8),
              currentHp: Math.max(1, level * 8 - 2),
              abilities: {
                constitution: 14,
                strength: 14,
              },
              classes: [
                {
                  classId,
                  classLevel: level,
                  hitDie,
                },
              ],
              customMetadata: {
                campaign: "Alabasta",
              },
            };

            const collection = wrapped
              ? {
                  characters: [character],
                  version: 4,
                }
              : [character];

            const restored =
              parseLevelUpCharacterCollection(
                serializeLevelUpCollection(collection),
              );

            expect(restored).not.toBeNull();

            const choice =
              level + 1 === 4 ||
              level + 1 === 8 ||
              level + 1 === 12 ||
              level + 1 === 16 ||
              level + 1 === 19
                ? buildAbilityIncreaseChoice(
                    classId,
                    "strength",
                    "strength",
                  )
                : { classId };

            const result =
              mutateCharacterLevelUpInCollection(
                restored!,
                "character",
                choice,
              );

            const characters = Array.isArray(result)
              ? result
              : result.characters;

            expect(characters[0].level).toBe(
              Math.min(20, level + 1),
            );

            expect(
              characters[0].customMetadata,
            ).toEqual({
              campaign: "Alabasta",
            });
          });
        }
      }
    }
  }

  for (const featId of [
    "alert",
    "lucky",
    "war-caster",
    "tough",
  ]) {
    it(`feat/${featId}`, () => {
      const result =
        mutateCharacterLevelUpInCollection(
          [
            {
              id: "character",
              level: 3,
              ruleset: "dnd_2014",
              maxHp: 24,
              currentHp: 24,
              abilities: {
                constitution: 14,
              },
              classes: [
                {
                  classId: "fighter",
                  classLevel: 3,
                  hitDie: 10,
                },
              ],
            },
          ],
          "character",
          buildFeatChoice(
            "fighter",
            featId,
          ),
        );

      expect(
        Array.isArray(result)
          ? result[0].feats
          : [],
      ).toContain(featId);
    });
  }
});
