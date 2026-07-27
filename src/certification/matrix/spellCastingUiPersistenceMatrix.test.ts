import { describe, expect, it } from "vitest";
import { mutateCasterInCollection, mutateTargetInCollection, parseCombatTargetCollection, parseSpellCharacterCollection, serializeSpellCollection } from "../../core/rulesets/spellCastingPersistenceBridge";

describe("v5.113D2 spell casting UI persistence matrix", () => {
  for (const wrapped of [false, true]) {
    for (const pact of [false, true]) {
      for (const level of [1, 3, 5, 7, 9]) {
        for (const used of [0, 1, 2]) {
          it(`${wrapped ? "wrapped" : "array"} pact=${pact} L${level} used${used}`, () => {
            const caster = { id: "caster", classId: pact ? "warlock" : "wizard", level: 17, customMetadata: { campaign: "Alabasta" }, spellSlots: pact ? [] : [{ level, max: 3, used }], pactSlots: pact ? [{ level, max: 3, used, pact: true }] : [], spells: [{ id: "homebrew", level, customEffect: "sandstorm" }] };
            const collection = wrapped ? { characters: [caster], version: 3 } : [caster];
            const restored = parseSpellCharacterCollection(serializeSpellCollection(collection));
            expect(restored).not.toBeNull();
            const spent = mutateCasterInCollection(restored!, "caster", { type: "spend-slot", level, pact });
            const characters = Array.isArray(spent) ? spent : spent.characters;
            const slots = pact ? characters[0].pactSlots : characters[0].spellSlots;
            expect(slots?.[0].used).toBe(Math.min(3, used + 1));
            expect(characters[0].customMetadata).toEqual({ campaign: "Alabasta" });
          });
        }
      }
    }
  }

  for (const wrapped of [false, true]) {
    for (const hp of [0, 1, 5, 10, 20]) {
      for (const amount of [0, 1, 5, 20, 100]) {
        it(`${wrapped ? "wrapped" : "array"} target ${hp}/${amount}`, () => {
          const target = { id: "target", currentHp: hp, maxHp: 20, customEffect: "poisoned" };
          const collection = wrapped ? { combatants: [target], round: 3 } : [target];
          const restored = parseCombatTargetCollection(serializeSpellCollection(collection));
          expect(restored).not.toBeNull();
          const damaged = mutateTargetInCollection(restored!, "target", { type: "damage", amount });
          const combatants = Array.isArray(damaged) ? damaged : damaged.combatants;
          expect(combatants[0].currentHp).toBeGreaterThanOrEqual(0);
          expect(combatants[0].customEffect).toBe("poisoned");
        });
      }
    }
  }

  for (const spellId of [null, "hex", "bless", "hold-person"]) {
    it(`concentration ${String(spellId)}`, () => {
      const result = mutateCasterInCollection([{ id: "caster" }], "caster", { type: "set-concentration", spellId });
      const caster = Array.isArray(result) ? result[0] : result.characters[0];
      expect(caster.concentrating).toBe(Boolean(spellId));
      expect(caster.concentrationSpellId).toBe(spellId);
    });
  }
});
