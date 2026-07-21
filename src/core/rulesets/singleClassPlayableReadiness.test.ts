import { describe, expect, it } from "vitest";
import { emptyDraft } from "../../features/characters/characterShared";
import { getSingleClassPlayableReadiness } from "./singleClassPlayableReadiness";

function playableDraft() {
  return {
    ...emptyDraft,
    ruleset: "dnd_2024" as const,
    name: "Aster",
    race: "Human",
    className: "Fighter",
    maxHp: 12,
    currentHp: 12,
    inventory: [{ itemId: "longsword", quantity: 1 }],
    equippedWeaponIds: ["longsword"],
  };
}

describe("single-class playable readiness", () => {
  it("accepts an official character with valid core data and starting resources", () => {
    const status = getSingleClassPlayableReadiness(playableDraft(), []);
    expect(status.ready).toBe(true);
    expect(status.completedChecks).toBe(status.totalChecks);
  });

  it("blocks zero HP and empty starting resources", () => {
    const draft = { ...playableDraft(), maxHp: 0, inventory: [], equippedWeaponIds: [], gold: 0 };
    const status = getSingleClassPlayableReadiness(draft, []);
    expect(status.ready).toBe(false);
    expect(status.blockers.join(" ")).toMatch(/Max HP/);
    expect(status.blockers.join(" ")).toMatch(/başlangıç altını/);
  });

  it("inherits mandatory builder validation errors", () => {
    const status = getSingleClassPlayableReadiness(playableDraft(), [{ id: "skills", severity: "error", step: "Skills", message: "Eksik" }]);
    expect(status.ready).toBe(false);
    expect(status.blockers).toContain("1 zorunlu Builder hatası çözülmeli.");
  });

  it("allows gold-only creation but leaves a shopping notice", () => {
    const draft = { ...playableDraft(), inventory: [], equippedWeaponIds: [], gold: 100 };
    const status = getSingleClassPlayableReadiness(draft, []);
    expect(status.ready).toBe(true);
    expect(status.notices.join(" ")).toMatch(/alışveriş/);
  });
});
