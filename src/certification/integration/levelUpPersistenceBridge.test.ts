import { describe, expect, it } from "vitest";
import {
  buildAbilityIncreaseChoice,
  buildFeatChoice,
  discoverLevelUpStorageKey,
  mutateCharacterLevelUpInCollection,
  parseLevelUpCharacterCollection,
  persistCharacterLevelUp,
} from "../../core/rulesets/levelUpPersistenceBridge";

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const fighter = {
  id: "fighter",
  level: 3,
  ruleset: "dnd_2014" as const,
  maxHp: 28,
  currentHp: 28,
  abilities: {
    constitution: 16,
    strength: 18,
  },
  classes: [
    {
      classId: "fighter",
      classLevel: 3,
      hitDie: 10,
    },
  ],
};

describe("v5.114D2 level-up persistence bridge", () => {
  it("parses array collection", () => {
    expect(
      parseLevelUpCharacterCollection(
        JSON.stringify([fighter]),
      ),
    ).not.toBeNull();
  });

  it("parses wrapped collection", () => {
    const parsed =
      parseLevelUpCharacterCollection(
        JSON.stringify({
          characters: [fighter],
          campaign: "Alabasta",
        }),
      );

    expect(parsed).toMatchObject({
      campaign: "Alabasta",
    });
  });

  it("applies ASI level-up", () => {
    const result =
      mutateCharacterLevelUpInCollection(
        [fighter],
        "fighter",
        buildAbilityIncreaseChoice(
          "fighter",
          "strength",
          "strength",
        ),
      );

    expect(
      Array.isArray(result)
        ? result[0].abilities?.strength
        : undefined,
    ).toBe(20);
  });

  it("applies feat level-up", () => {
    const result =
      mutateCharacterLevelUpInCollection(
        [fighter],
        "fighter",
        buildFeatChoice(
          "fighter",
          "alert",
        ),
      );

    expect(
      Array.isArray(result)
        ? result[0].feats
        : [],
    ).toContain("alert");
  });

  it("persists level-up", () => {
    const storage = new MemoryStorage();

    storage.setItem(
      "characters",
      JSON.stringify([fighter]),
    );

    expect(
      persistCharacterLevelUp(
        storage as unknown as Storage,
        "characters",
        "fighter",
        buildAbilityIncreaseChoice(
          "fighter",
          "strength",
          "strength",
        ),
      ),
    ).toBe(true);

    expect(
      JSON.parse(
        storage.getItem("characters") ?? "[]",
      )[0].level,
    ).toBe(4);
  });

  it("discovers storage key", () => {
    const storage = new MemoryStorage();

    storage.setItem(
      "e4-dnd-characters",
      JSON.stringify([fighter]),
    );

    expect(
      discoverLevelUpStorageKey(
        storage as unknown as Storage,
      ),
    ).toBe("e4-dnd-characters");
  });

  it("rejects malformed payload", () => {
    expect(
      parseLevelUpCharacterCollection("{"),
    ).toBeNull();
  });
});
