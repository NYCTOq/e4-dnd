import { describe, expect, it } from "vitest";
import {
  applyConcentrationDamage,
  applyDamageToSpellTarget,
  applyHealingToSpellTarget,
  buildSpellRuntimeSnapshot,
  canCharacterCastSpell,
  deserializeSpellCompatibleCharacter,
  resolveSpellcastingAbility,
  serializeSpellCompatibleCharacter,
  setCharacterConcentration,
  spendCharacterSpellSlot,
  restoreCharacterSpellSlot,
  type SpellCompatibleCharacter,
} from "../../core/rulesets/spellCharacterCombatAdapter";

type GoldenCaster = SpellCompatibleCharacter & {
  id: string;
  name: string;
};

const casters: GoldenCaster[] = [
  {
    id: "wizard",
    name: "Golden Wizard",
    classId: "wizard",
    level: 5,
    intelligence: 18,
    currentHp: 20,
    maxHp: 28,
    spellSlots: [
      { level: 1, max: 4, used: 0 },
      { level: 2, max: 3, used: 1 },
      { level: 3, max: 2, used: 0 },
    ],
    spells: [
      { id: "fire-bolt", level: 0 },
      { id: "fireball", level: 3 },
    ],
  },
  {
    id: "cleric",
    name: "Golden Cleric",
    classId: "cleric",
    level: 8,
    wisdom: 18,
    currentHp: 30,
    maxHp: 45,
    spellSlots: [
      { level: 1, max: 4, used: 2 },
      { level: 4, max: 2, used: 0 },
    ],
    spells: [
      { id: "sacred-flame", level: 0 },
      { id: "cure-wounds", level: 1, healing: true },
    ],
  },
  {
    id: "warlock",
    name: "Golden Warlock",
    classId: "warlock",
    level: 6,
    charisma: 18,
    currentHp: 35,
    maxHp: 35,
    pactSlots: [
      { level: 3, max: 2, used: 1, pact: true },
    ],
    spells: [
      { id: "eldritch-blast", level: 0 },
      { id: "hex", level: 1, concentration: true },
    ],
  },
  {
    id: "sorcerer",
    name: "Golden Sorcerer",
    classId: "sorcerer",
    level: 11,
    charisma: 20,
    currentHp: 44,
    maxHp: 60,
    spellSlots: [
      { level: 1, max: 4, used: 4 },
      { level: 6, max: 1, used: 0 },
    ],
  },
  {
    id: "druid",
    name: "Golden Druid",
    classId: "druid",
    level: 10,
    wisdom: 18,
    currentHp: 50,
    maxHp: 72,
    spellSlots: [
      { level: 5, max: 2, used: 1 },
    ],
  },
  {
    id: "paladin",
    name: "Golden Paladin",
    classId: "paladin",
    level: 9,
    charisma: 16,
    currentHp: 70,
    maxHp: 82,
    spellSlots: [
      { level: 1, max: 4, used: 0 },
      { level: 3, max: 2, used: 1 },
    ],
  },
];

describe("v5.113C golden spellcasters", () => {
  it("contains six golden casters", () => {
    expect(casters).toHaveLength(6);
  });

  for (const caster of casters) {
    describe(caster.name, () => {
      it("builds snapshot", () => {
        const snapshot = buildSpellRuntimeSnapshot(caster);
        expect(snapshot.characterLevel).toBeGreaterThan(0);
        expect(snapshot.spellSaveDc).toBeGreaterThan(0);
      });

      it("resolves casting ability", () => {
        expect([
          "intelligence",
          "wisdom",
          "charisma",
        ]).toContain(resolveSpellcastingAbility(caster));
      });

      it("survives JSON round trip", () => {
        expect(
          deserializeSpellCompatibleCharacter(
            serializeSpellCompatibleCharacter(caster),
          ),
        ).toEqual(caster);
      });

      it("does not mutate when spending slot", () => {
        const copy = structuredClone(caster);
        spendCharacterSpellSlot(caster, 1);
        expect(caster).toEqual(copy);
      });
    });
  }

  it("wizard can cast cantrip without slot", () => {
    expect(canCharacterCastSpell(casters[0], 0, 0)).toBe(true);
  });

  it("wizard can cast fireball from third level slot", () => {
    expect(canCharacterCastSpell(casters[0], 3, 3)).toBe(true);
  });

  it("warlock uses pact slot separately", () => {
    expect(canCharacterCastSpell(casters[2], 1, 3, true)).toBe(true);
    expect(canCharacterCastSpell(casters[2], 1, 3, false)).toBe(false);
  });

  it("spends and restores normal slot", () => {
    const spent = spendCharacterSpellSlot(casters[0], 3);
    expect(spent.spellSlots?.find((slot) => slot.level === 3)?.used).toBe(1);

    const restored = restoreCharacterSpellSlot(spent, 3);
    expect(restored.spellSlots?.find((slot) => slot.level === 3)?.used).toBe(0);
  });

  it("spends and restores pact slot", () => {
    const spent = spendCharacterSpellSlot(casters[2], 3, true);
    expect(spent.pactSlots?.[0].used).toBe(2);

    const restored = restoreCharacterSpellSlot(spent, 3, true);
    expect(restored.pactSlots?.[0].used).toBe(1);
  });

  it("starts and ends concentration", () => {
    const started = setCharacterConcentration(casters[2], "hex");
    expect(started.concentrating).toBe(true);
    expect(started.concentrationSpellId).toBe("hex");

    const ended = setCharacterConcentration(started, null);
    expect(ended.concentrating).toBe(false);
  });

  it("failed concentration save clears concentration", () => {
    const started = setCharacterConcentration(casters[2], "hex");
    const result = applyConcentrationDamage(started, 30, 10);
    expect(result.maintained).toBe(false);
    expect(result.character.concentrating).toBe(false);
  });

  it("successful concentration save preserves concentration", () => {
    const started = setCharacterConcentration(casters[2], "hex");
    const result = applyConcentrationDamage(started, 10, 15);
    expect(result.maintained).toBe(true);
    expect(result.character.concentrationSpellId).toBe("hex");
  });

  it("healing target caps at max HP", () => {
    const healed = applyHealingToSpellTarget(casters[1], 100);
    expect(healed.currentHp).toBe(45);
  });

  it("damage target cannot fall below zero", () => {
    const damaged = applyDamageToSpellTarget(casters[0], 100);
    expect(damaged.currentHp).toBe(0);
  });

  it("legacy caster defaults safely", () => {
    const legacy: SpellCompatibleCharacter = {
      id: "legacy",
      classId: "wizard",
      level: 1,
    };

    const snapshot = buildSpellRuntimeSnapshot(legacy);
    expect(snapshot.ability).toBe("intelligence");
    expect(snapshot.abilityScore).toBe(10);
    expect(snapshot.spellSlots).toEqual([]);
  });

  it("invalid payload rejected", () => {
    expect(() =>
      deserializeSpellCompatibleCharacter("[]"),
    ).toThrow("Invalid spell-compatible character payload.");
  });
});
