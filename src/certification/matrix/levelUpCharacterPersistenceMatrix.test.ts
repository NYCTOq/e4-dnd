import { describe, expect, it } from "vitest";
import {
  applyCharacterLevelUp,
  deserializeLevelUpCharacter,
  serializeLevelUpCharacter,
  type LevelUpCompatibleCharacter,
} from "../../core/rulesets/levelUpCharacterAdapter";

const classes = [
  ["fighter", 10],
  ["rogue", 8],
  ["cleric", 8],
  ["wizard", 6],
  ["druid", 8],
  ["sorcerer", 6],
  ["warlock", 8],
  ["paladin", 10],
] as const;

describe("v5.114C level-up character persistence matrix", () => {
  for (const ruleset of ["dnd_2014", "dnd_2024"] as const) {
    for (const [classId, hitDie] of classes) {
      for (const level of [1, 2, 3, 4, 8, 10, 16, 19]) {
        it(`${ruleset}/${classId}/L${level}`, () => {
          const character: LevelUpCompatibleCharacter = {
            id: `${ruleset}-${classId}-${level}`,
            level,
            ruleset,
            maxHp: level * 8,
            currentHp: level * 8 - 2,
            abilities: {
              constitution: 14,
              strength: 14,
              dexterity: 14,
              intelligence: 14,
              wisdom: 14,
              charisma: 14,
            },
            classes: [
              {
                classId,
                classLevel: level,
                hitDie,
              },
            ],
            spells: [
              {
                id: "homebrew-spell",
                customEffect: "sandstorm",
              },
            ],
            customMetadata: {
              campaign: "Alabasta",
            },
          };

          const restored =
            deserializeLevelUpCharacter<LevelUpCompatibleCharacter>(
              serializeLevelUpCharacter(character),
            );

          const result = applyCharacterLevelUp(restored, {
            classId,
            abilityIncreases: {
              constitution: 1,
              strength: 1,
            },
            selectedFeatId: "alert",
          });

          expect(result.level).toBe(level + 1);
          expect(result.maxHp).toBeGreaterThan(character.maxHp ?? 0);
          expect(result.customMetadata).toEqual({
            campaign: "Alabasta",
          });
          expect(
            (result.spells as Array<Record<string, unknown>>)[0]
              .customEffect,
          ).toBe("sandstorm");
          expect(result.levelUpHistory).toHaveLength(1);
        });
      }
    }
  }

  for (const targetClass of ["fighter", "wizard"]) {
    for (const fighterLevel of [1, 4, 8]) {
      for (const wizardLevel of [1, 3, 5]) {
        it(`multiclass/${targetClass}/${fighterLevel}/${wizardLevel}`, () => {
          const character: LevelUpCompatibleCharacter = {
            id: "multi",
            level: fighterLevel + wizardLevel,
            ruleset: "dnd_2014",
            maxHp: 40,
            currentHp: 35,
            abilities: {
              constitution: 14,
              strength: 16,
              intelligence: 16,
            },
            classes: [
              {
                classId: "fighter",
                classLevel: fighterLevel,
                hitDie: 10,
              },
              {
                classId: "wizard",
                classLevel: wizardLevel,
                hitDie: 6,
              },
            ],
          };

          const result = applyCharacterLevelUp(character, {
            classId: targetClass,
          });

          const selected = result.classes?.find(
            (entry) => entry.classId === targetClass,
          );

          expect(selected?.classLevel).toBe(
            (targetClass === "fighter"
              ? fighterLevel
              : wizardLevel) + 1,
          );
        });
      }
    }
  }
});
