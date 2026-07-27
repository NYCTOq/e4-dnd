import { describe, expect, it } from "vitest";
import {
  applyRestInStorage,
  applyRestToCharacterCollection,
  discoverCharacterStorageKey,
  parseCharacterCollection,
} from "../../core/rulesets/restRecoveryPersistenceBridge";

const fighter = {
  id: "fighter",
  name: "Fighter",
  ruleset: "dnd_2014",
  currentHp: 5,
  maxHp: 30,
  hitDice: [{ die: 10, max: 5, used: 3 }],
  resources: [
    { id: "action-surge", current: 0, max: 1, recovery: "short" as const },
  ],
  deathSaves: { successes: 2, failures: 1 },
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

describe("v5.111D2 rest persistence bridge", () => {
  it("updates array collection", () => {
    const result = applyRestToCharacterCollection(
      [fighter],
      "fighter",
      "short",
    );

    expect(result.updated).toBe(true);
    expect(result.character?.resources?.[0].current).toBe(1);
  });

  it("updates wrapped collection and preserves metadata", () => {
    const result = applyRestToCharacterCollection(
      { characters: [fighter], campaignId: "alabasta" },
      "fighter",
      "long",
    );

    expect(result.updated).toBe(true);
    expect(result.collection).toMatchObject({ campaignId: "alabasta" });
    expect(result.character?.currentHp).toBe(30);
  });

  it("does not mutate source collection", () => {
    const source = [fighter];
    const snapshot = structuredClone(source);

    applyRestToCharacterCollection(source, "fighter", "long");
    expect(source).toEqual(snapshot);
  });

  it("returns unchanged result for unknown character", () => {
    expect(
      applyRestToCharacterCollection([fighter], "missing", "short").updated,
    ).toBe(false);
  });

  it("parses arrays and wrapped collections", () => {
    expect(parseCharacterCollection(JSON.stringify([fighter]))).toHaveLength(1);
    expect(
      parseCharacterCollection(
        JSON.stringify({ characters: [fighter], version: 1 }),
      ),
    ).toMatchObject({ version: 1 });
  });

  it("rejects malformed payloads", () => {
    expect(parseCharacterCollection("{")).toBeNull();
    expect(parseCharacterCollection(JSON.stringify({ noCharacters: [] }))).toBeNull();
  });

  it("persists successful storage rest", () => {
    const storage = new MemoryStorage();
    storage.setItem("characters", JSON.stringify([fighter]));

    const result = applyRestInStorage(
      storage as unknown as Storage,
      "characters",
      "fighter",
      "long",
    );

    expect(result.updated).toBe(true);
    expect(
      JSON.parse(storage.getItem("characters") ?? "[]")[0].currentHp,
    ).toBe(30);
  });

  it("discovers preferred and fallback storage keys", () => {
    const storage = new MemoryStorage();
    storage.setItem("random", JSON.stringify({ noise: true }));
    storage.setItem("e4-dnd-characters", JSON.stringify([fighter]));

    expect(
      discoverCharacterStorageKey(storage as unknown as Storage),
    ).toBe("e4-dnd-characters");
  });
});
