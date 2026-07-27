import { describe, expect, it } from "vitest";
import {
  applyClassFeatureRest,
  buildClassRuntimeSnapshot,
  characterClassEntries,
  deserializeClassCompatibleCharacter,
  serializeClassCompatibleCharacter,
  subclassUnlockState,
  type ClassCompatibleCharacter,
} from "../../core/rulesets/classSubclassCharacterAdapter";

type Golden = ClassCompatibleCharacter & {
  id: string;
  name: string;
};

const golden: Golden[] = [
  {
    id: "fighter-2014",
    name: "Golden Fighter",
    ruleset: "dnd_2014",
    classId: "fighter",
    subclassId: "battle-master",
    level: 5,
    classFeatures: [
      {
        id: "second-wind",
        classId: "fighter",
        level: 1,
        activation: "bonus-action",
        currentUses: 0,
        maxUses: 1,
        recovery: "short",
      },
      {
        id: "action-surge",
        classId: "fighter",
        level: 2,
        activation: "action",
        currentUses: 0,
        maxUses: 1,
        recovery: "short",
      },
      {
        id: "extra-attack",
        classId: "fighter",
        level: 5,
        activation: "passive",
      },
    ],
  },
  {
    id: "cleric-2014",
    name: "Golden Cleric",
    ruleset: "dnd_2014",
    classId: "cleric",
    subclassId: "life-domain",
    level: 8,
    classFeatures: [
      {
        id: "channel-divinity",
        classId: "cleric",
        level: 2,
        activation: "action",
        currentUses: 0,
        maxUsesRule: {
          type: "class-level-divisor",
          divisor: 6,
          minimum: 1,
        },
        recovery: "short",
      },
      {
        id: "divine-strike",
        classId: "cleric",
        subclassId: "life-domain",
        level: 8,
        activation: "passive",
      },
      {
        id: "supreme-healing",
        classId: "cleric",
        subclassId: "life-domain",
        level: 17,
        activation: "passive",
      },
    ],
  },
  {
    id: "wizard-2024",
    name: "Golden Wizard",
    ruleset: "dnd_2024",
    classId: "wizard",
    subclassId: "evoker",
    level: 10,
    classFeatures: [
      {
        id: "arcane-recovery",
        classId: "wizard",
        level: 1,
        activation: "special",
        currentUses: 0,
        maxUses: 1,
        recovery: "long",
      },
      {
        id: "sculpt-spells",
        classId: "wizard",
        subclassId: "evoker",
        level: 3,
        activation: "passive",
      },
      {
        id: "empowered-evocation",
        classId: "wizard",
        subclassId: "evoker",
        level: 10,
        activation: "passive",
      },
    ],
  },
  {
    id: "rogue-multiclass",
    name: "Golden Rogue Fighter",
    ruleset: "dnd_2014",
    classes: [
      { classId: "rogue", level: 3, subclassId: "thief" },
      { classId: "fighter", level: 2 },
    ],
    classFeatures: [
      {
        id: "cunning-action",
        classId: "rogue",
        level: 2,
        activation: "bonus-action",
      },
      {
        id: "uncanny-dodge",
        classId: "rogue",
        level: 5,
        activation: "reaction",
      },
      {
        id: "action-surge",
        classId: "fighter",
        level: 2,
        activation: "action",
        currentUses: 0,
        maxUses: 1,
        recovery: "short",
      },
    ],
  },
  {
    id: "warlock-2024",
    name: "Golden Warlock",
    ruleset: "dnd_2024",
    classId: "warlock",
    subclassId: "fiend",
    level: 6,
    classFeatures: [
      {
        id: "dark-ones-blessing",
        classId: "warlock",
        subclassId: "fiend",
        level: 3,
        activation: "passive",
      },
      {
        id: "dark-ones-own-luck",
        classId: "warlock",
        subclassId: "fiend",
        level: 6,
        activation: "reaction",
        currentUses: 0,
        maxUsesRule: { type: "proficiency-bonus" },
        recovery: "long",
      },
    ],
  },
  {
    id: "monk-2024",
    name: "Golden Monk",
    ruleset: "dnd_2024",
    classId: "monk",
    subclassId: "open-hand",
    level: 6,
    classFeatures: [
      {
        id: "focus-points",
        classId: "monk",
        level: 2,
        activation: "special",
        currentUses: 0,
        maxUsesRule: { type: "class-level" },
        recovery: "short",
      },
      {
        id: "open-hand-technique",
        classId: "monk",
        subclassId: "open-hand",
        level: 3,
        activation: "passive",
      },
    ],
  },
];

describe("v5.112C golden class/subclass character adapter", () => {
  it("covers six class scenarios", () => {
    expect(golden).toHaveLength(6);
  });

  for (const character of golden) {
    describe(character.name, () => {
      it("creates class entries", () => {
        expect(characterClassEntries(character).length).toBeGreaterThan(0);
      });

      it("creates runtime snapshot", () => {
        const snapshot = buildClassRuntimeSnapshot(character);
        expect(snapshot.characterLevel).toBeGreaterThan(0);
        expect(snapshot.proficiencyBonus).toBeGreaterThanOrEqual(2);
      });

      it("survives JSON round trip", () => {
        expect(
          deserializeClassCompatibleCharacter(
            serializeClassCompatibleCharacter(character),
          ),
        ).toEqual(character);
      });

      it("does not mutate source on short rest", () => {
        const copy = structuredClone(character);
        applyClassFeatureRest(character, "short");
        expect(character).toEqual(copy);
      });

      it("produces subclass unlock state", () => {
        expect(Object.keys(subclassUnlockState(character)).length).toBeGreaterThan(0);
      });
    });
  }

  it("fighter unlocks extra attack", () => {
    const snapshot = buildClassRuntimeSnapshot(golden[0]);
    expect(snapshot.unlockedFeatures.map((f) => f.id)).toContain("extra-attack");
  });

  it("cleric does not unlock level 17 feature", () => {
    const snapshot = buildClassRuntimeSnapshot(golden[1]);
    expect(snapshot.unlockedFeatures.map((f) => f.id)).not.toContain("supreme-healing");
  });

  it("multiclass uses individual class levels", () => {
    const snapshot = buildClassRuntimeSnapshot(golden[3]);
    expect(snapshot.characterLevel).toBe(5);
    expect(snapshot.classLevels).toEqual({ rogue: 3, fighter: 2 });
    expect(snapshot.unlockedFeatures.map((f) => f.id)).toEqual([
      "cunning-action",
      "action-surge",
    ]);
  });

  it("PB-based uses resolve from total level", () => {
    const snapshot = buildClassRuntimeSnapshot(golden[4]);
    const feature = snapshot.unlockedFeatures.find(
      (entry) => entry.id === "dark-ones-own-luck",
    );
    expect(feature?.maxUses).toBe(3);
  });

  it("class-level uses resolve from class level", () => {
    const snapshot = buildClassRuntimeSnapshot(golden[5]);
    const feature = snapshot.unlockedFeatures.find(
      (entry) => entry.id === "focus-points",
    );
    expect(feature?.maxUses).toBe(6);
  });

  it("short rest restores short resources only", () => {
    const result = applyClassFeatureRest(golden[0], "short");
    expect(result.classFeatures?.[0].currentUses).toBe(1);
    expect(result.classFeatures?.[1].currentUses).toBe(1);
  });

  it("long rest restores long resources", () => {
    const result = applyClassFeatureRest(golden[2], "long");
    expect(result.classFeatures?.[0].currentUses).toBe(1);
  });

  it("legacy single-class character migrates safely", () => {
    const legacy: Golden = {
      id: "legacy",
      name: "Legacy",
      classId: "rogue",
      level: 2,
    };

    const snapshot = buildClassRuntimeSnapshot(legacy);
    expect(snapshot.classLevels).toEqual({ rogue: 2 });
    expect(snapshot.unlockedFeatures).toEqual([]);
  });

  it("invalid payload rejected", () => {
    expect(() =>
      deserializeClassCompatibleCharacter("[]"),
    ).toThrow("Invalid class-compatible character payload.");
  });
});
