import { describe, expect, it } from "vitest";
import {
  discoverClassCharacterStorageKey,
  mutateCharacterFeature,
  mutateFeatureInCollection,
  mutateFeatureInStorage,
  parseClassCharacterCollection,
} from "../../core/rulesets/classFeaturePersistenceBridge";

const fighter = {
  id: "fighter",
  classId: "fighter",
  level: 5,
  classFeatures: [
    {
      id: "action-surge",
      classId: "fighter",
      level: 2,
      activation: "action" as const,
      currentUses: 1,
      maxUses: 1,
      recovery: "short" as const,
    },
    {
      id: "future",
      classId: "fighter",
      level: 10,
      activation: "passive" as const,
    },
  ],
};

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

describe("v5.112D2 class feature persistence bridge", () => {
  it("spends unlocked feature", () => {
    const result = mutateCharacterFeature(
      fighter,
      "action-surge",
      "spend",
    );

    expect(result.classFeatures?.[0].currentUses).toBe(0);
  });

  it("restores unlocked feature", () => {
    const spent = mutateCharacterFeature(
      fighter,
      "action-surge",
      "spend",
    );
    const restored = mutateCharacterFeature(
      spent,
      "action-surge",
      "restore",
    );

    expect(restored.classFeatures?.[0].currentUses).toBe(1);
  });

  it("does not mutate source", () => {
    const snapshot = structuredClone(fighter);
    mutateCharacterFeature(fighter, "action-surge", "spend");
    expect(fighter).toEqual(snapshot);
  });

  it("cannot mutate locked feature", () => {
    const result = mutateCharacterFeature(
      fighter,
      "future",
      "spend",
    );
    expect(result).toEqual(fighter);
  });

  it("updates wrapped collection and preserves metadata", () => {
    const result = mutateFeatureInCollection(
      { characters: [fighter], campaign: "Alabasta" },
      "fighter",
      "action-surge",
      "spend",
    );

    expect(result.updated).toBe(true);
    expect(result.collection).toMatchObject({ campaign: "Alabasta" });
  });

  it("persists mutation to storage", () => {
    const storage = new MemoryStorage();
    storage.setItem("characters", JSON.stringify([fighter]));

    mutateFeatureInStorage(
      storage as unknown as Storage,
      "characters",
      "fighter",
      "action-surge",
      "spend",
    );

    expect(
      JSON.parse(storage.getItem("characters") ?? "[]")[0]
        .classFeatures[0].currentUses,
    ).toBe(0);
  });

  it("discovers storage key", () => {
    const storage = new MemoryStorage();
    storage.setItem("e4-dnd-characters", JSON.stringify([fighter]));

    expect(
      discoverClassCharacterStorageKey(storage as unknown as Storage),
    ).toBe("e4-dnd-characters");
  });

  it("rejects malformed collections", () => {
    expect(parseClassCharacterCollection("{")).toBeNull();
    expect(
      parseClassCharacterCollection(JSON.stringify({ noCharacters: [] })),
    ).toBeNull();
  });
});
