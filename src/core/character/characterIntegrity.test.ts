import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { auditCharacterIntegrity } from "./characterIntegrity";

describe("character integrity certification", () => {
  it("certifies a structurally playable legacy character", () => expect(auditCharacterIntegrity(makeCharacter(), null)).toMatchObject({ status: "ready", errors: 0 }));
  it("blocks duplicate inventory, invalid attunement and equipped references", () => {
    const inventory = ["a", "b", "c", "d"].map((itemId) => ({ itemId, quantity: 1, attuned: true }));
    const report = auditCharacterIntegrity(makeCharacter({ inventory: [...inventory, inventory[0]], equippedWeaponIds: ["missing"] }), null);
    expect(report.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining(["inventory-shape", "equipment", "attunement"]));
  });
  it("blocks invalid slot, expertise and combat counters", () => {
    const report = auditCharacterIntegrity(makeCharacter({ skillProficiencies: ["Arcana"], expertiseSkills: ["Stealth"], spellSlots: [{ level: 1, max: 2, used: 3 }], exhaustion: 7, deathSaves: { successes: 4, failures: 0 } }), null);
    expect(report.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining(["skills", "spell-slots", "exhaustion", "death-saves"]));
  });
  it("uses weighted scoring without allowing errors to report ready", () => {
    const report = auditCharacterIntegrity(makeCharacter({ name: "", maxHp: 0, currentHp: 2 }), null);
    expect(report.status).toBe("needs-attention");
    expect(report.score).toBeLessThan(100);
  });
});
