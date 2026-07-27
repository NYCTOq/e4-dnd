import { describe, expect, it } from "vitest";
import {
  characterToRestState,
  deserializeRestCompatibleCharacter,
  performCharacterLongRest,
  performCharacterShortRest,
  serializeRestCompatibleCharacter,
  type RestCompatibleCharacter,
} from "../../core/rulesets/restRecoveryCharacterAdapter";

type Golden = RestCompatibleCharacter & {
  id: string;
  name: string;
  classId: string;
  level: number;
};

const goldenCharacters: Golden[] = [
  {
    id: "fighter-2014",
    name: "Golden 2014 Fighter",
    classId: "fighter",
    level: 5,
    ruleset: "dnd_2014",
    currentHp: 12,
    maxHp: 44,
    tempHp: 4,
    hitDice: [{ die: 10, max: 5, used: 4 }],
    spellSlots: [],
    resources: [
      { id: "second-wind", current: 0, max: 1, recovery: "short" },
      { id: "action-surge", current: 0, max: 1, recovery: "short" },
    ],
    exhaustion: 2,
    deathSaves: { successes: 1, failures: 2 },
    concentrating: false,
    activeEffects: [],
  },
  {
    id: "wizard-2014",
    name: "Golden 2014 Wizard",
    classId: "wizard",
    level: 5,
    ruleset: "dnd_2014",
    currentHp: 5,
    maxHp: 27,
    temporaryHp: 6,
    hitDice: [{ die: 6, max: 5, used: 3 }],
    spellSlots: [
      { level: 1, max: 4, used: 4 },
      { level: 2, max: 3, used: 2 },
      { level: 3, max: 2, used: 2 },
    ],
    resources: [
      { id: "arcane-recovery", current: 0, max: 1, recovery: "long" },
    ],
    exhaustion: 1,
    deathSaves: { successes: 2, failures: 1 },
    concentration: true,
    activeEffects: [
      { id: "haste", durationType: "minutes" },
    ],
  },
  {
    id: "warlock-2014",
    name: "Golden 2014 Warlock",
    classId: "warlock",
    level: 5,
    ruleset: "dnd_2014",
    currentHp: 16,
    maxHp: 38,
    hitDice: [{ die: 8, max: 5, used: 2 }],
    spellSlots: [
      { level: 3, max: 2, used: 2, pact: true },
    ],
    resources: [],
    exhaustion: 0,
    deathSaves: { successes: 0, failures: 0 },
    concentrating: true,
    activeEffects: [
      { id: "hex", durationType: "hours" },
    ],
  },
  {
    id: "monk-2024",
    name: "Golden 2024 Monk",
    classId: "monk",
    level: 6,
    ruleset: "dnd_2024",
    currentHp: 19,
    maxHp: 45,
    hitDice: [{ die: 8, max: 6, used: 6 }],
    spellSlots: [],
    resources: [
      { id: "focus-points", current: 0, max: 6, recovery: "short" },
    ],
    exhaustion: 3,
    deathSaves: { successes: 1, failures: 1 },
    concentrating: false,
    activeEffects: [
      { id: "short-buff", durationType: "until-rest", expiresOn: "short" },
    ],
  },
  {
    id: "cleric-2024",
    name: "Golden 2024 Cleric",
    classId: "cleric",
    level: 9,
    ruleset: "dnd_2024",
    currentHp: 1,
    maxHp: 66,
    tempHp: 8,
    hitDice: [{ die: 8, max: 9, used: 7 }],
    spellSlots: [
      { level: 1, max: 4, used: 4 },
      { level: 2, max: 3, used: 3 },
      { level: 3, max: 3, used: 2 },
      { level: 4, max: 3, used: 1 },
      { level: 5, max: 1, used: 1 },
    ],
    resources: [
      { id: "channel-divinity", current: 0, max: 2, recovery: "short" },
    ],
    exhaustion: 4,
    deathSaves: { successes: 2, failures: 2 },
    concentrating: true,
    activeEffects: [
      { id: "spirit-guardians", durationType: "minutes" },
      { id: "permanent-blessing", durationType: "permanent" },
    ],
  },
];

describe("v5.111C golden character rest integration", () => {
  it("contains broad martial/caster coverage", () => {
    expect(goldenCharacters).toHaveLength(5);
    expect(new Set(goldenCharacters.map((c) => c.classId)).size).toBe(5);
  });

  for (const character of goldenCharacters) {
    describe(`${character.name}`, () => {
      it("adapts to normalized rest state", () => {
        const state = characterToRestState(character);
        expect(state.currentHp).toBeGreaterThanOrEqual(0);
        expect(state.currentHp).toBeLessThanOrEqual(state.maxHp);
      });

      it("survives JSON round trip", () => {
        const payload = serializeRestCompatibleCharacter(character);
        const restored =
          deserializeRestCompatibleCharacter<Golden>(payload);
        expect(restored).toEqual(character);
      });

      it("short rest preserves identity and immutable source", () => {
        const snapshot = structuredClone(character);
        const result = performCharacterShortRest(character);

        expect(result.character.id).toBe(character.id);
        expect(result.character.name).toBe(character.name);
        expect(character).toEqual(snapshot);
      });

      it("long rest restores HP and clears death saves", () => {
        const result = performCharacterLongRest(character);

        expect(result.character.currentHp).toBe(character.maxHp);
        expect(result.character.deathSaves).toEqual({
          successes: 0,
          failures: 0,
        });
      });

      it("long rest preserves permanent identity data", () => {
        const result = performCharacterLongRest(character);

        expect(result.character.id).toBe(character.id);
        expect(result.character.name).toBe(character.name);
        expect(result.character.classId).toBe(character.classId);
        expect(result.character.level).toBe(character.level);
        expect(result.character.ruleset).toBe(character.ruleset);
      });
    });
  }

  it("2014 fighter short rest restores short resources", () => {
    const fighter = goldenCharacters[0];
    const result = performCharacterShortRest(fighter);
    expect(result.character.resources).toEqual([
      { id: "second-wind", current: 1, max: 1, recovery: "short" },
      { id: "action-surge", current: 1, max: 1, recovery: "short" },
    ]);
  });

  it("2014 wizard short rest does not restore normal slots", () => {
    const wizard = goldenCharacters[1];
    const result = performCharacterShortRest(wizard);
    expect(result.character.spellSlots).toEqual(
      characterToRestState(wizard).spellSlots,
    );
  });

  it("2014 warlock short rest restores pact slots", () => {
    const warlock = goldenCharacters[2];
    const result = performCharacterShortRest(warlock);
    expect(result.character.spellSlots?.[0].used).toBe(0);
  });

  it("2024 monk short rest restores focus points", () => {
    const monk = goldenCharacters[3];
    const result = performCharacterShortRest(monk);
    expect(result.character.resources?.[0].current).toBe(6);
  });

  it("2024 cleric long rest clears exhaustion and concentration", () => {
    const cleric = goldenCharacters[4];
    const result = performCharacterLongRest(cleric);
    expect(result.character.exhaustion).toBe(0);
    expect(result.character.concentrating).toBe(false);
  });

  it("2014 long rest only removes one exhaustion level", () => {
    const fighter = goldenCharacters[0];
    const result = performCharacterLongRest(fighter);
    expect(result.character.exhaustion).toBe(1);
  });

  it("legacy character with missing rest fields migrates safely", () => {
    const legacy: Golden = {
      id: "legacy",
      name: "Legacy Character",
      classId: "rogue",
      level: 2,
      ruleset: "dnd_2014",
      maxHp: 17,
    };

    const state = characterToRestState(legacy);
    expect(state.currentHp).toBe(17);
    expect(state.hitDice).toEqual([]);
    expect(state.resources).toEqual([]);
    expect(state.deathSaves).toEqual({ successes: 0, failures: 0 });

    const result = performCharacterLongRest(legacy);
    expect(result.character.currentHp).toBe(17);
  });

  it("invalid JSON payload is rejected", () => {
    expect(() =>
      deserializeRestCompatibleCharacter("[]"),
    ).toThrow("Invalid character payload.");
  });
});
