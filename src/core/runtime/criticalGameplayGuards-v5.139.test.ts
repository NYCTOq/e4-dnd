import { describe, expect, it } from "vitest";
import { evaluateGameplayGuard, getCastingEconomy, getConcentrationSaveDc } from "./criticalGameplayGuards";

describe("v5.139 critical gameplay guards", () => {
  it("reports action economy blockers", () => {
    expect(evaluateGameplayGuard({ economy: "action", actionUsed: true })).toEqual({ allowed: false, reason: "Bu tur Action zaten kullanıldı." });
    expect(evaluateGameplayGuard({ economy: "reaction", reactionUsed: true }).allowed).toBe(false);
  });

  it("reports resource and spell slot blockers", () => {
    expect(evaluateGameplayGuard({ resourceRemaining: 1, resourceCost: 2 })).toEqual({ allowed: false, reason: "Kaynak yetersiz: 2 gerekli, 1 kaldı." });
    expect(evaluateGameplayGuard({ requiresSlot: true, slotRemaining: 0 })).toEqual({ allowed: false, reason: "Uygun büyü slotu kalmadı." });
  });

  it("allows a legal action", () => {
    expect(evaluateGameplayGuard({ economy: "bonus-action", bonusActionUsed: false, resourceRemaining: 3, resourceCost: 1 })).toEqual({ allowed: true });
  });

  it("normalizes casting time economy", () => {
    expect(getCastingEconomy("1 Bonus Action")).toBe("bonus-action");
    expect(getCastingEconomy("1 Reaction, which you take...")).toBe("reaction");
    expect(getCastingEconomy("1 Action")).toBe("action");
  });

  it("uses the official concentration DC floor and half damage rule", () => {
    expect(getConcentrationSaveDc(1)).toBe(10);
    expect(getConcentrationSaveDc(21)).toBe(10);
    expect(getConcentrationSaveDc(22)).toBe(11);
    expect(getConcentrationSaveDc(40)).toBe(20);
  });
});
