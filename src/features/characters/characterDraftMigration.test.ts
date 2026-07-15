import { describe, expect, it } from "vitest";
import { emptyDraft, normalizeCharacterDraft } from "./characterShared";

describe("character draft migration", () => {
  it("adds arrays introduced after an older autosaved draft", () => {
    const draft = normalizeCharacterDraft({ name: "Eski Kahraman", abilities: { str: 15 } });
    expect(draft.name).toBe("Eski Kahraman");
    expect(draft.featIds).toEqual([]);
    expect(draft.expertiseSkills).toEqual([]);
    expect(draft.equippedWeaponIds).toEqual([]);
  });
  it("keeps saved selections while filling nested defaults", () => {
    const draft = normalizeCharacterDraft({ skillProficiencies: ["Arcana"], deathSaves: { successes: 2 } });
    expect(draft.skillProficiencies).toEqual(["Arcana"]);
    expect(draft.deathSaves).toEqual({ successes: 2, failures: 0 });
  });
  it("replaces malformed array fields instead of crashing includes calls", () => expect(normalizeCharacterDraft({ featIds: undefined }).featIds).toEqual(emptyDraft.featIds));
});
