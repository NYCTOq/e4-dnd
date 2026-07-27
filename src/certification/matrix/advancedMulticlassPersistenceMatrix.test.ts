import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Character } from "../../core/character/character.types";
import type { DndClassData } from "../../core/rulesets/ruleset.types";
import { normalizeClassLevels } from "../../core/rulesets/multiclassRules";
import { buildLeveledCharacter, getAverageHpGain } from "../../features/characters/levelUpCalculator";
import { characterToEditDraft, buildEditedCharacter } from "../../features/characters/characterEditorRules";
import { createFullBackup, parseFullBackup } from "../../features/backup/fullBackup";
import { DEFAULT_APP_SETTINGS } from "../../shared/settings/appSettings";

const loadClasses = (edition: "dnd_2014" | "dnd_2024") =>
  JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/classes.json`, import.meta.url), "utf8")) as DndClassData[];

const baseCharacter = (edition: "dnd_2014" | "dnd_2024", klass: DndClassData): Character => ({
  id: `multi-${edition}`, name: "Multiclass Matrix", playerName: "QA", ruleset: edition,
  race: "Human", className: klass.name, classLevels: [{ className: klass.name, level: 1 }],
  subclass: "", background: "Acolyte", featIds: [], skillProficiencies: [], expertiseSkills: [],
  toolProficiencies: [], languages: ["Common"], level: 1,
  abilities: { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
  maxHp: klass.hitDie + 2, currentHp: klass.hitDie + 2, tempHp: 0, armorClass: 10,
  armorClassMode: "manual", knownSpellIds: [], preparedSpellIds: [], spellSlots: [],
  inventory: [], equippedArmorId: null, equippedShieldId: null, equippedWeaponIds: [], gold: 0,
  deathSaves: { successes: 0, failures: 0 }, hitDice: [{ die: klass.hitDie, max: 1, used: 0 }],
  resources: [], exhaustion: 0, conditionDurations: {}, conditions: [], notes: "",
  createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z",
});

describe("v5.117B multiclass persistence matrix", () => {
  for (const edition of ["dnd_2014", "dnd_2024"] as const) {
    it(`${edition} survives level-up, edit save and full backup`, () => {
      const classes = loadClasses(edition);
      const fighter = classes.find((entry) => entry.name === "Fighter")!;
      const wizard = classes.find((entry) => entry.name === "Wizard")!;
      let character = baseCharacter(edition, fighter);
      character = buildLeveledCharacter(character, {
        hpGain: getAverageHpGain(wizard.hitDie, character.abilities.con),
        hitDie: wizard.hitDie, asiMode: "none", primaryAbility: "int", secondaryAbility: "con",
        classData: fighter, targetClassData: wizard, allClasses: classes,
      });
      character = {
        ...character,
        spellSlots: character.spellSlots.map((slot) => ({ ...slot, used: Math.min(1, slot.max) })),
        hitDice: character.hitDice.map((pool) => ({ ...pool, used: Math.min(1, pool.max) })),
      };
      const edited = buildEditedCharacter(character, characterToEditDraft(character), {
        id: edition, name: edition, classes, subclasses: [], races: [], backgrounds: [],
        feats: [], spells: [], items: [], monsters: [],
      });
      const backup = createFullBackup({
        characters: [edited], campaigns: [], homebrewSpells: [], homebrewItems: [],
        homebrewMonsters: [], favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
      });
      const restored = parseFullBackup(backup).data.characters[0];
      expect(restored.classLevels).toEqual([
        expect.objectContaining({ className: "Fighter", level: 1 }),
        expect.objectContaining({ className: "Wizard", level: 1 }),
      ]);
      expect(restored.spellSlots).toEqual(edited.spellSlots);
      expect(restored.hitDice).toEqual(edited.hitDice);
    });
  }

  it("repairs legacy total drift without flattening class distribution", () => {
    expect(normalizeClassLevels(
      [{ className: "Fighter", level: 2 }, { className: "Wizard", level: 2 }],
      "Fighter",
      5,
    )).toEqual([
      { className: "Fighter", level: 3 },
      { className: "Wizard", level: 2 },
    ]);
    expect(normalizeClassLevels(
      [{ className: "Fighter", level: 3 }, { className: "Wizard", level: 3 }],
      "Fighter",
      5,
    )).toEqual([
      { className: "Fighter", level: 3 },
      { className: "Wizard", level: 2 },
    ]);
  });
});
