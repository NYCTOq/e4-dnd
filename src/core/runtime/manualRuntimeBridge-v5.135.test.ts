import { describe, expect, it, vi } from "vitest";
import { addManualRuntimeEffect, advanceManualRuntimeEffects, removeManualRuntimeEffect } from "./manualRuntimeBridge";

describe("v5.135 manual runtime bridge", () => {
  it("adds a persistent manual effect with normalized duration", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "effect-1" });
    const [effect] = addManualRuntimeEffect([], { name: "  Spirit Shroud  ", kind: "spell", note: "bonus damage", rounds: 3.8 });
    expect(effect).toMatchObject({ id: "effect-1", name: "Spirit Shroud", kind: "spell", note: "bonus damage", remainingRounds: 3 });
  });

  it("keeps indefinite effects while advancing timed effects", () => {
    const effects = [
      { id: "a", name: "Aura", kind: "subclass" as const, note: "", remainingRounds: null, createdAt: "x" },
      { id: "b", name: "Bless", kind: "spell" as const, note: "", remainingRounds: 2, createdAt: "x" },
    ];
    expect(advanceManualRuntimeEffects(effects)).toEqual([
      effects[0],
      { ...effects[1], remainingRounds: 1 },
    ]);
  });

  it("expires timed effects at zero", () => {
    const effects = [{ id: "b", name: "Bless", kind: "spell" as const, note: "", remainingRounds: 1, createdAt: "x" }];
    expect(advanceManualRuntimeEffects(effects)).toEqual([]);
  });

  it("removes only the selected effect", () => {
    const effects = [
      { id: "a", name: "A", kind: "other" as const, note: "", remainingRounds: null, createdAt: "x" },
      { id: "b", name: "B", kind: "other" as const, note: "", remainingRounds: null, createdAt: "x" },
    ];
    expect(removeManualRuntimeEffect(effects, "a")).toEqual([effects[1]]);
  });
});
