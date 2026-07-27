import { describe, expect, it } from "vitest";
import {
  discoverCombatStorageKey,
  discoverSpellStorageKey,
  mutateCasterInCollection,
  mutateTargetInCollection,
  parseCombatTargetCollection,
  parseSpellCharacterCollection,
  persistCasterMutation,
  persistTargetMutation,
} from "../../core/rulesets/spellCastingPersistenceBridge";

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const caster = { id: "caster", classId: "wizard", level: 5, intelligence: 18, spellSlots: [{ level: 3, max: 2, used: 0 }] };
const target = { id: "target", currentHp: 15, maxHp: 20 };

describe("v5.113D2 spell casting persistence bridge", () => {
  it("spends normal slot in collection", () => {
    const result = mutateCasterInCollection([caster], "caster", { type: "spend-slot", level: 3 });
    expect((result as typeof caster[])[0].spellSlots[0].used).toBe(1);
  });
  it("sets concentration", () => {
    const result = mutateCasterInCollection([caster], "caster", { type: "set-concentration", spellId: "hold-person" });
    expect((result as Array<Record<string, unknown>>)[0].concentrationSpellId).toBe("hold-person");
  });
  it("damages and heals target", () => {
    const damaged = mutateTargetInCollection([target], "target", { type: "damage", amount: 10 });
    const healed = mutateTargetInCollection([target], "target", { type: "healing", amount: 10 });
    expect((damaged as typeof target[])[0].currentHp).toBe(5);
    expect((healed as typeof target[])[0].currentHp).toBe(20);
  });
  it("persists caster and target mutations", () => {
    const storage = new MemoryStorage();
    storage.setItem("characters", JSON.stringify([caster]));
    storage.setItem("combatTracker", JSON.stringify([target]));
    expect(persistCasterMutation(storage as unknown as Storage, "characters", "caster", { type: "spend-slot", level: 3 })).toBe(true);
    expect(persistTargetMutation(storage as unknown as Storage, "combatTracker", "target", { type: "damage", amount: 5 })).toBe(true);
  });
  it("discovers storage keys", () => {
    const storage = new MemoryStorage();
    storage.setItem("e4-dnd-characters", JSON.stringify([caster]));
    storage.setItem("e4-dnd-combat", JSON.stringify([target]));
    expect(discoverSpellStorageKey(storage as unknown as Storage)).toBe("e4-dnd-characters");
    expect(discoverCombatStorageKey(storage as unknown as Storage)).toBe("e4-dnd-combat");
  });
  it("rejects malformed collections", () => {
    expect(parseSpellCharacterCollection("{")).toBeNull();
    expect(parseCombatTargetCollection("{")).toBeNull();
  });
});
