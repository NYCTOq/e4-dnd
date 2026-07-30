import { describe, expect, it } from "vitest";
import { castCharacterSpell, type SpellCompatibleCharacter } from "./spellCharacterCombatAdapter";

const caster = (): SpellCompatibleCharacter => ({
  id: "caster", level: 7, classId: "wizard", spellSlots: [
    { level: 1, max: 4, used: 4 },
    { level: 2, max: 3, used: 1 },
    { level: 3, max: 3, used: 0 },
  ], pactSlots: [{ level: 3, max: 2, used: 0, pact: true }],
  concentrating: true, concentrationSpellId: "bless",
});

describe("N-MEGA7A atomic spell cast transaction", () => {
  it("upcasts with an available normal slot and replaces concentration atomically", () => {
    const before = caster();
    const result = castCharacterSpell(before, { id: "hold-person", name: "Hold Person", level: 2, concentration: true }, 3, "spell");
    expect(result.ok).toBe(true);
    expect(result.slotSpent).toBe(true);
    expect(result.castLevel).toBe(3);
    expect(result.replacedConcentrationSpellId).toBe("bless");
    expect(result.character.spellSlots?.find((slot) => slot.level === 3)?.used).toBe(1);
    expect(result.character.concentrationSpellId).toBe("hold-person");
    expect(before.spellSlots?.find((slot) => slot.level === 3)?.used).toBe(0);
  });

  it("casts a cantrip without consuming any slot", () => {
    const before = caster();
    const result = castCharacterSpell(before, { id: "fire-bolt", level: 0 }, 0, "spell");
    expect(result.ok).toBe(true);
    expect(result.slotSpent).toBe(false);
    expect(result.character.spellSlots).toEqual(before.spellSlots);
  });

  it("uses Pact Magic as a separate source", () => {
    const before = caster();
    const result = castCharacterSpell(before, { id: "armor-of-agathys", level: 1 }, 3, "pact");
    expect(result.ok).toBe(true);
    expect(result.character.pactSlots?.[0].used).toBe(1);
    expect(result.character.spellSlots).toEqual(before.spellSlots);
  });

  it("rejects unavailable and under-level casts without mutating resources or concentration", () => {
    const before = caster();
    const unavailable = castCharacterSpell(before, { id: "shield", level: 1 }, 1, "spell");
    const underLevel = castCharacterSpell(before, { id: "fireball", level: 3 }, 2, "spell");
    expect(unavailable.ok).toBe(false);
    expect(underLevel.ok).toBe(false);
    expect(unavailable.character.spellSlots).toEqual(before.spellSlots);
    expect(unavailable.character.concentrationSpellId).toBe("bless");
  });
});
