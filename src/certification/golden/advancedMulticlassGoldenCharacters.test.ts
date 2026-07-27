import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Character } from "../../core/character/character.types";
import type { DndClassData, RulesetData } from "../../core/rulesets/ruleset.types";
import { getEffectiveMulticlassClassProfiles } from "../../core/rulesets/multiclassRules";
import { buildLeveledCharacter, getAverageHpGain } from "../../features/characters/levelUpCalculator";
import { buildEditedCharacter, characterToEditDraft } from "../../features/characters/characterEditorRules";
import { ADVANCED_MULTICLASS_GOLDEN } from "../reference/advancedMulticlassGolden.reference";

const loadRuleset = (edition: "dnd_2014" | "dnd_2024"): RulesetData => ({
  id: edition,
  name: edition,
  classes: JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/classes.json`, import.meta.url), "utf8")) as DndClassData[],
  subclasses: [], races: [], backgrounds: [], feats: [], spells: [], items: [], monsters: [],
});

function character(edition: "dnd_2014" | "dnd_2024", klass: DndClassData): Character {
  return {
    id: "golden", name: "Golden Multiclass", playerName: "QA", ruleset: edition,
    race: "Human", className: klass.name, classLevels: [{ className: klass.name, level: 1 }],
    subclass: "", background: "Acolyte", featIds: [], skillProficiencies: [],
    expertiseSkills: [], toolProficiencies: [], languages: ["Common"], level: 1,
    abilities: { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
    maxHp: klass.hitDie + 2, currentHp: klass.hitDie + 2, tempHp: 0, armorClass: 10,
    armorClassMode: "manual", knownSpellIds: [], preparedSpellIds: [], spellSlots: [],
    inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0,
    deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: klass.hitDie, max: 1, used: 0 }],
    resources: [], exhaustion: 0, conditionDurations: {}, conditions: [], notes: "",
    createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z",
  };
}

describe("v5.117C advanced multiclass golden characters", () => {
  for (const golden of ADVANCED_MULTICLASS_GOLDEN) {
    it(`${golden.id} persists limited proficiency grants`, () => {
      const ruleset = loadRuleset(golden.ruleset);
      const primary = ruleset.classes.find((entry) => entry.name === golden.primary)!;
      const target = ruleset.classes.find((entry) => entry.name === golden.target)!;
      const leveled = buildLeveledCharacter(character(golden.ruleset, primary), {
        hpGain: getAverageHpGain(target.hitDie, 14),
        hitDie: target.hitDie,
        asiMode: "none",
        primaryAbility: "str",
        secondaryAbility: "dex",
        classData: primary,
        targetClassData: target,
        allClasses: ruleset.classes,
        multiclassSkillProficiency: "skill" in golden ? golden.skill : undefined,
        multiclassToolProficiency: "tool" in golden ? golden.tool : undefined,
      });
      expect(leveled.multiclassProficiencies).toEqual(golden.expectedProficiencies);
      if ("skill" in golden) expect(leveled.skillProficiencies).toContain(golden.skill);
      if ("skill" in golden) expect(leveled.multiclassSkillProficiencies).toContain(golden.skill);
      if ("expectedTool" in golden) expect(leveled.toolProficiencies).toContain(golden.expectedTool);

      const profiles = getEffectiveMulticlassClassProfiles(
        leveled.classLevels!,
        leveled.className,
        ruleset.classes,
        golden.ruleset,
      );
      if (golden.target === "Fighter") {
        expect(profiles.find((entry) => entry.name === "Fighter")?.armorProficiencies).not.toContain("Heavy armor");
      }

      const edited = buildEditedCharacter(leveled, characterToEditDraft(leveled), ruleset);
      expect(edited.multiclassProficiencies).toEqual(leveled.multiclassProficiencies);
      expect(edited.skillProficiencies).toEqual(leveled.skillProficiencies);
      expect(edited.toolProficiencies).toEqual(leveled.toolProficiencies);
    });
  }
});
