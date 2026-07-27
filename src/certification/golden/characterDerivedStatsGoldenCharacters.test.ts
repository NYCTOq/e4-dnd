import { describe, expect, it } from "vitest";
import type { Character } from "../../core/character/character.types";
import { getCharacterJourneySnapshot } from "../../core/character/playerJourneyConsistency";
import { hydrateCharacterRecord } from "../../core/storage/characterStorage";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import { buildEditedCharacter, characterToEditDraft } from "../../features/characters/characterEditorRules";
import { getCharacterSheetCertificationSnapshot } from "../../core/rulesets/characterSheetCertification";
import { CHARACTER_DERIVED_STATS_GOLDEN } from "../reference/characterDerivedStatsGolden.reference";

const allSkills = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History",
  "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception",
  "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival",
];
const classRow = (name: string, spellcastingAbility: "int" | "wis" | "cha" | null, savingThrows: string[], hitDie: number) => ({
  id: name.toLowerCase(), name, spellcastingAbility, savingThrows, hitDie,
  primaryAbilities: [], armorProficiencies: [], weaponProficiencies: [],
  skillChoices: { choose: name === "Bard" ? 3 : 2, from: allSkills },
  description: "", subclassLevel: 3, spellProgression: spellcastingAbility ? "full" : "none",
  levels: [],
});

const ruleset = (id: "dnd_2014" | "dnd_2024") => ({
  id, name: id,
  classes: [
    classRow("Fighter", null, ["str", "con"], 10),
    classRow("Wizard", "int", ["int", "wis"], 6),
    classRow("Bard", "cha", ["dex", "cha"], 8),
    classRow("Cleric", "wis", ["wis", "cha"], 8),
  ],
  races: [{ id: "human", name: "Human", speed: 30 }],
  backgrounds: [],
  feats: [
    { id: "alert", name: "Alert" }, { id: "observant", name: "Observant" }, { id: "mobile", name: "Mobile" },
  ],
  items: [
    { id: "leather", category: "armor", armorClass: 11, armorType: "light" },
    { id: "scale", category: "armor", armorClass: 14, armorType: "medium", dexBonusMax: 2 },
    { id: "chain", category: "armor", armorClass: 16, armorType: "heavy" },
    { id: "shield", category: "shield", armorClassBonus: 2 },
    { id: "luck", category: "gear", armorBonus: 1 },
  ],
  subclasses: [], spells: [], monsters: [],
}) as unknown as RulesetData;

function makeCharacter(golden: typeof CHARACTER_DERIVED_STATS_GOLDEN[number]): Character {
  const inventory = [
    ...(golden.armorId ? [{ itemId: golden.armorId, quantity: 1 }] : []),
    ...(golden.shieldId ? [{ itemId: golden.shieldId, quantity: 1 }] : []),
    ...(golden.attunedLuck ? [{ itemId: "luck", quantity: 1, attuned: true }] : []),
  ];
  return {
    id: golden.id, name: golden.id, playerName: "QA", ruleset: golden.ruleset,
    race: "Human", className: golden.className, classLevels: [...golden.classLevels],
    subclass: "", background: "", featIds: [...golden.featIds],
    skillProficiencies: [...golden.skills], expertiseSkills: [...golden.expertise],
    toolProficiencies: [], languages: ["Common"], level: golden.level,
    abilities: { ...golden.abilities }, maxHp: 40, currentHp: 35, tempHp: 0,
    armorClass: golden.expected.armorClass, armorClassMode: golden.armorMode,
    knownSpellIds: [], preparedSpellIds: [], spellSlots: [], inventory,
    equippedArmorId: golden.armorId, equippedShieldId: golden.shieldId,
    equippedWeaponIds: [], gold: 0, deathSaves: { successes: 0, failures: 0 },
    hitDice: [], resources: [], exhaustion: 0, conditionDurations: {}, conditions: [],
    notes: "", createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z",
  };
}

describe("v5.118C character derived stats golden integration", () => {
  for (const golden of CHARACTER_DERIVED_STATS_GOLDEN) {
    it(`${golden.id} survives edit and storage hydration`, () => {
      const data = ruleset(golden.ruleset);
      const original = makeCharacter(golden);
      const expected = getCharacterJourneySnapshot(original, data);
      expect(expected).toMatchObject(golden.expected);
      expect(getCharacterSheetCertificationSnapshot(original, data).derivedStats).toMatchObject(golden.expected);

      const edited = buildEditedCharacter(original, characterToEditDraft(original), data);
      expect(getCharacterJourneySnapshot(edited, data)).toMatchObject(golden.expected);

      const restored = hydrateCharacterRecord(JSON.parse(JSON.stringify(edited)) as Character);
      expect(getCharacterJourneySnapshot(restored, data)).toMatchObject(golden.expected);
      expect(getCharacterSheetCertificationSnapshot(restored, data).derivedStats).toMatchObject(golden.expected);
      expect(restored.resources.length).toBeGreaterThan(0);
    });
  }
});
