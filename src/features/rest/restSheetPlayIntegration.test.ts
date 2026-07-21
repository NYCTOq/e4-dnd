import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { getSheetPlayModeConsistencySnapshot } from "../../core/character/sheetPlayModeConsistency";
import { applyRestToCharacter, getDefaultRestOptions } from "./restAutomation";

describe("sheet, play mode and rest integration", () => {
  it("restores Pact Magic on a short rest and keeps sheet/play snapshots aligned", () => {
    const character = makeCharacter({
      className: "Warlock",
      level: 9,
      pactMagicSlots: [{ level: 5, max: 2, used: 2 }],
      resources: [{ id: "invocation-use", name: "Invocation Use", max: 1, used: 1, recovery: "short" }],
    });
    const result = applyRestToCharacter(character, "short", getDefaultRestOptions("short"));
    expect(result.character.pactMagicSlots).toEqual([{ level: 5, max: 2, used: 0 }]);
    expect(result.character.resources[0].used).toBe(0);
    const snapshot = getSheetPlayModeConsistencySnapshot(result.character, null);
    expect(snapshot.pactMagicSlots).toEqual([{ level: 5, max: 2, used: 0, remaining: 2 }]);
    expect(snapshot.resources["invocation-use"]).toMatchObject({ used: 0, remaining: 1 });
  });

  it("long rest restores normal slots, clears active spell effects and reduces exhaustion", () => {
    const character = makeCharacter({
      currentHp: 3,
      maxHp: 24,
      exhaustion: 2,
      spellSlots: [{ level: 1, max: 4, used: 3 }],
      activeSpellEffects: [{ id: "bless", spellId: "bless", name: "Bless", remainingRounds: 8, concentration: true, summary: "" }],
    });
    const result = applyRestToCharacter(character, "long", getDefaultRestOptions("long"));
    expect(result.character).toMatchObject({ currentHp: 24, exhaustion: 1, activeSpellEffects: [] });
    expect(result.character.spellSlots[0].used).toBe(0);
    expect(getSheetPlayModeConsistencySnapshot(result.character, null).concentration.active).toBe(false);
  });
});
