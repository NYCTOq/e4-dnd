import { describe, expect, it } from "vitest";
import { getEffectiveMaxHp, getEffectiveSpeed, getExhaustionEffects } from "./exhaustionRules";

describe("exhaustion rules", () => {
  it("uses the 2014 six-step penalties", () => {
    const effects = getExhaustionEffects("dnd_2014", 4);
    expect(effects).toMatchObject({ abilityCheckMode: "disadvantage", attackSaveMode: "disadvantage", speedMultiplier: 0.5, maxHpMultiplier: 0.5 });
    expect(getEffectiveMaxHp(35, effects)).toBe(17);
  });

  it("uses the 2024 cumulative d20 and speed penalties", () => {
    const effects = getExhaustionEffects("dnd_2024", 3);
    expect(effects.d20Penalty).toBe(6);
    expect(getEffectiveSpeed(30, effects)).toBe(15);
  });

  it("caps exhaustion and marks level six as dead", () => {
    expect(getExhaustionEffects("dnd_2014", 99)).toMatchObject({ level: 6, dead: true });
    expect(getExhaustionEffects("dnd_2024", -2).level).toBe(0);
  });
});
