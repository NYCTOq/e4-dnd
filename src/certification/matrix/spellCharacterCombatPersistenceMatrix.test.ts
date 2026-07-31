import { describe, expect, it } from "vitest";
import {
  applyDamageToSpellTarget,
  applyHealingToSpellTarget,
  buildSpellRuntimeSnapshot,
  canCharacterCastSpell,
  deserializeSpellCompatibleCharacter,
  serializeSpellCompatibleCharacter,
  setCharacterConcentration,
  spendCharacterSpellSlot,
  restoreCharacterSpellSlot,
  type SpellCompatibleCharacter,
} from "../../core/rulesets/spellCharacterCombatAdapter";

describe("v5.113C spell character combat persistence matrix", () => {
  for (const classId of [
    "wizard",
    "cleric",
    "warlock",
    "sorcerer",
    "druid",
    "paladin",
  ]) {
    for (const level of [1, 5, 9, 13, 17, 20]) {
      for (const used of [0, 1, 2, 3]) {
        it(`${classId} L${level} used${used}`, () => {
          const character: SpellCompatibleCharacter = {
            id: `${classId}-${level}-${used}`,
            classId,
            level,
            intelligence: 16,
            wisdom: 16,
            charisma: 16,
            currentHp: 10,
            maxHp: 20,
            customMetadata: { campaign: "Alabasta" },
            spellSlots: [
              { level: 1, max: 4, used },
            ],
            spells: [
              {
                id: "homebrew-spell",
                level: 1,
                customEffect: "sandstorm",
              },
            ],
          };

          const restored =
            deserializeSpellCompatibleCharacter<SpellCompatibleCharacter>(
              serializeSpellCompatibleCharacter(character),
            );

          const snapshot = buildSpellRuntimeSnapshot(restored);
          expect(snapshot.characterLevel).toBe(level);
          expect(snapshot.spellSlots[0].used).toBe(
            Math.min(4, used),
          );

          const spent = spendCharacterSpellSlot(restored, 1);
          const restoredSlot = restoreCharacterSpellSlot(spent, 1);

          expect(restoredSlot.customMetadata).toEqual({
            campaign: "Alabasta",
          });
          const restoredSpell = restoredSlot.spells?.[0] as
            | Record<string, unknown>
            | undefined;
          expect(restoredSpell?.customEffect).toBe("sandstorm");
        });
      }
    }
  }

  for (const pact of [false, true]) {
    for (const spellLevel of [0, 1, 3, 5]) {
      for (const castLevel of [0, 1, 3, 5]) {
        it(`cast pact=${pact} spell${spellLevel} slot${castLevel}`, () => {
          const character: SpellCompatibleCharacter = {
            classId: pact ? "warlock" : "wizard",
            level: 10,
            spellSlots: pact
              ? []
              : [{ level: castLevel, max: 1, used: 0 }],
            pactSlots: pact
              ? [{ level: castLevel, max: 1, used: 0, pact: true }]
              : [],
          };

          const result = canCharacterCastSpell(
            character,
            spellLevel,
            castLevel,
            pact,
          );

          expect(typeof result).toBe("boolean");
        });
      }
    }
  }

  for (const hp of [0, 1, 5, 10, 20]) {
    for (const amount of [0, 1, 5, 20, 100]) {
      it(`target HP ${hp} amount ${amount}`, () => {
        const target: SpellCompatibleCharacter = {
          id: "target",
          currentHp: hp,
          maxHp: 20,
        };

        const damaged = applyDamageToSpellTarget(target, amount);
        const healed = applyHealingToSpellTarget(target, amount);

        expect(damaged.currentHp).toBeGreaterThanOrEqual(0);
        expect(healed.currentHp).toBeLessThanOrEqual(20);
      });
    }
  }

  for (const spellId of [null, "hex", "bless", "hold-person"]) {
    it(`concentration ${String(spellId)}`, () => {
      const baseCharacter: SpellCompatibleCharacter = {
        id: "caster",
      };

      const character = setCharacterConcentration(
        baseCharacter,
        spellId,
      );

      expect(character.concentrating).toBe(Boolean(spellId));
      expect(character.concentrationSpellId).toBe(spellId);
    });
  }
});
