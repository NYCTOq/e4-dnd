import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCharacterFromDraft, emptyDraft } from "../../features/characters/characterShared";
import { buildLeveledCharacter, getAverageHpGain } from "../../features/characters/levelUpCalculator";
import { applyRestToCharacter, getDefaultRestOptions } from "../../features/rest/restAutomation";
import { createFullBackup, parseFullBackup } from "../../features/backup/fullBackup";
import { DEFAULT_APP_SETTINGS } from "../../shared/settings/appSettings";
import { enrichClassProgression } from "../rulesets/classProgressionAudit";
import type { DndClassData } from "../rulesets/ruleset.types";
import { auditCharacterLifecycle } from "./characterLifecycleAudit";

const readClasses = (edition: "dnd_2014" | "dnd_2024") =>
  (JSON.parse(readFileSync(new URL(`../../../public/data/${edition}/classes.json`, import.meta.url), "utf8")) as DndClassData[])
    .map((item) => enrichClassProgression(item, edition));

const makeDraft = (edition: "dnd_2014" | "dnd_2024", klass: DndClassData) => ({
  ...emptyDraft,
  name: `${edition} Hero`, ruleset: edition, race: "Human", className: klass.name,
  subclass: "Test Path", background: "Acolyte", level: 1,
  abilities: { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
  maxHp: 10, skillProficiencies: ["Arcana"], inventory: [{ itemId: "pack", quantity: 1 }],
});

const backupData = (character: ReturnType<typeof createCharacterFromDraft>) => ({
  characters: [character], campaigns: [], homebrewSpells: [], homebrewItems: [],
  homebrewMonsters: [], favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
});

describe("character lifecycle E2E", () => {
  for (const edition of ["dnd_2014", "dnd_2024"] as const) {
    it(`${edition} creates, reaches level 20, rests and survives backup`, () => {
      const classes = readClasses(edition);
      const cleric = classes.find((item) => item.name === "Cleric")!;
      const created = createCharacterFromDraft(makeDraft(edition, cleric));
      let current = created;
      for (let level = 2; level <= 20; level++) {
        current = buildLeveledCharacter(current, {
          hpGain: getAverageHpGain(cleric.hitDie, current.abilities.con), hitDie: cleric.hitDie,
          asiMode: "none", primaryAbility: "wis", secondaryAbility: "con",
          classData: cleric, targetClassData: cleric, allClasses: classes,
          updatedAt: `2026-01-${String(level).padStart(2, "0")}T00:00:00.000Z`,
        });
      }
      expect(current).toMatchObject({ level: 20, maxHp: expect.any(Number) });
      const spent = {
        ...current, currentHp: 1, spellSlots: current.spellSlots.map((slot) => ({ ...slot, used: slot.max })),
        pactMagicSlots: [{ level: 5, max: 2, used: 2 }], usedArcanumSpellIds: ["wish"],
        activeSpellEffects: [{ id: "effect", spellId: "spell", name: "Effect", remainingRounds: 2, concentration: true, summary: "" }],
      };
      const rested = applyRestToCharacter(spent, "long", getDefaultRestOptions("long")).character;
      expect(rested).toMatchObject({ currentHp: rested.maxHp, usedArcanumSpellIds: [], activeSpellEffects: [] });
      expect(rested.pactMagicSlots?.[0].used).toBe(0);
      const restored = parseFullBackup(createFullBackup(backupData(rested))).data.characters[0];
      const firstLevelUp = buildLeveledCharacter(created, {
        hpGain: 5, hitDie: cleric.hitDie, asiMode: "none", primaryAbility: "wis", secondaryAbility: "con",
        classData: cleric, allClasses: classes,
      });
      expect(auditCharacterLifecycle([
        { checkpoint: "created", character: created }, { checkpoint: "leveled", character: firstLevelUp },
        { checkpoint: "rested", character: rested }, { checkpoint: "restored", character: restored },
      ]).score).toBeGreaterThanOrEqual(75);
    });
  }

  it("preserves multiclass slot and hit-die pools", () => {
    const classes = readClasses("dnd_2014");
    const fighter = classes.find((item) => item.name === "Fighter")!;
    const wizard = classes.find((item) => item.name === "Wizard")!;
    let character = createCharacterFromDraft(makeDraft("dnd_2014", fighter));
    character = buildLeveledCharacter(character, {
      hpGain: 6, hitDie: wizard.hitDie, asiMode: "none", primaryAbility: "int", secondaryAbility: "con",
      classData: fighter, targetClassData: wizard, allClasses: classes,
    });
    expect(character.classLevels).toEqual([
      expect.objectContaining({ className: "Fighter", level: 1 }),
      expect.objectContaining({ className: "Wizard", level: 1 }),
    ]);
    expect(character.hitDice.map((pool) => pool.die).sort((a, b) => a - b)).toEqual([6, 10]);
    expect(character.spellSlots[0]).toMatchObject({ level: 1, max: 2 });
  });
});
