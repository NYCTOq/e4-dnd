import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { CharacterClassLevel, RulesetId } from "../../core/character/character.types";
import type { DndClassData } from "../../core/rulesets/ruleset.types";
import { getCombinedCasterLevel, getMulticlassRuntimeSummary } from "../../core/rulesets/multiclassRules";

const loadClasses = (edition: "dnd_2014" | "dnd_2024") =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/classes.json`, import.meta.url), "utf8")) as DndClassData[];

function referenceContribution(
  entry: CharacterClassLevel,
  klass: DndClassData,
  ruleset: RulesetId,
) {
  const subclass = entry.subclass?.toLowerCase() ?? "";
  const progression = klass.spellProgression === "none" &&
    ((klass.name === "Fighter" && subclass.includes("eldritch knight")) ||
      (klass.name === "Rogue" && subclass.includes("arcane trickster")))
    ? "third"
    : klass.spellProgression;
  if (progression === "full") return entry.level;
  if (progression === "half") {
    return ruleset === "dnd_2024"
      ? Math.ceil(entry.level / 2)
      : Math.floor(entry.level / 2);
  }
  if (progression === "third") return Math.floor(entry.level / 3);
  return 0;
}

describe("v5.117B advanced multiclass differential", () => {
  for (const edition of ["dnd_2014", "dnd_2024"] as const) {
    const classes = loadClasses(edition);
    it(`${edition} matches an independent caster contribution reference`, () => {
      for (const first of classes) {
        for (const second of classes) {
          if (first.id === second.id) continue;
          for (let firstLevel = 1; firstLevel <= 10; firstLevel += 1) {
            for (let secondLevel = 1; secondLevel <= 10; secondLevel += 1) {
              const levels = [
                { className: first.name, level: firstLevel },
                { className: second.name, level: secondLevel },
              ];
              const expected = Math.min(
                20,
                referenceContribution(levels[0], first, edition) +
                  referenceContribution(levels[1], second, edition),
              );
              expect(getCombinedCasterLevel(levels, classes, edition)).toBe(expected);
            }
          }
        }
      }
    });

    it(`${edition} preserves every level in Hit Dice pools`, () => {
      for (const first of classes) {
        for (const second of classes) {
          if (first.id === second.id) continue;
          const summary = getMulticlassRuntimeSummary(
            [{ className: first.name, level: 7 }, { className: second.name, level: 5 }],
            first.name,
            classes,
            edition,
          );
          expect(summary.hitDice.reduce((sum, pool) => sum + pool.max, 0)).toBe(12);
          expect(summary.totalLevel).toBe(12);
        }
      }
    });
  }
});
