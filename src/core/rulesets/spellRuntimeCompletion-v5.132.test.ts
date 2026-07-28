import { describe, expect, it } from "vitest";
import type { DndSpellData } from "./ruleset.types";
import { advanceSpellEffectRounds, applySpellDamage, applySpellHealing, executeSpellCast, recoverSpellcastingResources } from "./spellRuntimeCompletion";

const spell = (patch: Partial<DndSpellData> = {}): DndSpellData => ({
  id: "burning-hands",
  name: "Burning Hands",
  level: 1,
  school: "Evocation",
  castingTime: "1 action",
  range: "Self",
  components: ["V", "S"],
  duration: "Instantaneous",
  concentration: false,
  ritual: false,
  description: "Damage spell.",
  damageDice: "3d6",
  attackType: "saving-throw",
  saveAbility: "dex",
  classes: ["wizard"],
  source: "SRD",
  ...patch,
});

const character = {
  level: 5,
  currentHp: 10,
  maxHp: 20,
  spellSlots: [{ level: 1, max: 2, used: 0 }],
  pactSlots: [{ level: 2, max: 2, used: 1, pact: true }],
  concentrating: true,
  concentrationSpellId: "bless",
};

describe("v5.132 spell runtime completion", () => {
  it("spends a slot, resolves the spell and replaces concentration safely", () => {
    const result = executeSpellCast({ character, spell: spell({ id: "web", concentration: true }), random: () => 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.character.spellSlots?.[0].used).toBe(1);
    expect(result.character.concentrationSpellId).toBe("web");
    expect(result.replacedConcentration).toBe(true);
    expect(result.resolved).toBe(3);
  });

  it("rejects unavailable or under-leveled casts without mutating the character", () => {
    expect(executeSpellCast({ character, spell: spell({ level: 2 }), castLevel: 1 }).ok).toBe(false);
    const empty = { ...character, spellSlots: [{ level: 1, max: 1, used: 1 }] };
    expect(executeSpellCast({ character: empty, spell: spell(), castLevel: 1 }).ok).toBe(false);
    expect(empty.spellSlots[0].used).toBe(1);
  });

  it("advances finite effects and removes expired durations", () => {
    const effects = [
      { id: "a", spellId: "a", name: "A", remainingRounds: 2, concentration: false, summary: "A" },
      { id: "b", spellId: "b", name: "B", remainingRounds: 1, concentration: false, summary: "B" },
      { id: "c", spellId: "c", name: "C", remainingRounds: null, concentration: false, summary: "C" },
    ];
    expect(advanceSpellEffectRounds(effects, 1).map((effect) => [effect.id, effect.remainingRounds])).toEqual([["a", 1], ["c", null]]);
  });

  it("recovers pact slots on short rest, all slots on long rest, and clamps hp changes", () => {
    const short = recoverSpellcastingResources(character, "short");
    expect(short.spellSlots?.[0].used).toBe(0);
    expect(short.pactSlots?.[0].used).toBe(0);
    const long = recoverSpellcastingResources({ ...character, spellSlots: [{ level: 1, max: 2, used: 2 }] }, "long");
    expect(long.spellSlots?.[0].used).toBe(0);
    expect(applySpellDamage(character, 99).currentHp).toBe(0);
    expect(applySpellHealing(character, 99).currentHp).toBe(20);
  });
});
