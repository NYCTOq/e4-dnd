import { describe, expect, it } from "vitest";
import { advanceOngoingSpellEffects, endOngoingSpellEffect, resolveOngoingEffectSave, startOngoingSpellEffect, type OngoingEffectCharacter } from "./spellOngoingEffectRuntime";

describe("N-MEGA7D ongoing spell effects", () => {
  it("starts and persists a concentration effect with targets", () => {
    const character = startOngoingSpellEffect({} as OngoingEffectCharacter, { spellId: "hold-person", castLevel: 2, concentration: true, durationRounds: 10, repeatSaveAbility: "wisdom", saveDc: 15, targetCount: 2 });
    expect(character.concentrating).toBe(true);
    expect(character.ongoingSpellEffects?.[0].targets).toHaveLength(2);
  });

  it("ends a target on a successful repeat save", () => {
    const started = startOngoingSpellEffect({} as OngoingEffectCharacter, { spellId: "hold-person", castLevel: 2, repeatSaveAbility: "wisdom", saveDc: 15 });
    const effect = started.ongoingSpellEffects![0];
    const result = resolveOngoingEffectSave(started, effect.id, effect.targets[0].id, 15);
    expect(result.succeeded).toBe(true);
    expect(result.ended).toBe(true);
    expect(result.character.ongoingSpellEffects?.[0].targets[0].active).toBe(false);
  });

  it("keeps a target active after a failed save", () => {
    const started = startOngoingSpellEffect({} as OngoingEffectCharacter, { spellId: "hold-person", castLevel: 2, saveDc: 15 });
    const effect = started.ongoingSpellEffects![0];
    const result = resolveOngoingEffectSave(started, effect.id, effect.targets[0].id, 14);
    expect(result.succeeded).toBe(false);
    expect(result.character.ongoingSpellEffects?.[0].targets[0].active).toBe(true);
  });

  it("expires timed effects and clears concentration", () => {
    const started = startOngoingSpellEffect({} as OngoingEffectCharacter, { spellId: "fog", castLevel: 1, concentration: true, durationRounds: 1 });
    const advanced = advanceOngoingSpellEffects(started);
    expect(advanced.ongoingSpellEffects).toEqual([]);
    expect(advanced.concentrating).toBe(false);
    expect(advanced.concentrationSpellId).toBeNull();
  });

  it("can end an effect manually", () => {
    const started = startOngoingSpellEffect({} as OngoingEffectCharacter, { spellId: "bless", castLevel: 1, concentration: true });
    const ended = endOngoingSpellEffect(started, started.ongoingSpellEffects![0].id);
    expect(ended.ongoingSpellEffects).toEqual([]);
    expect(ended.concentrating).toBe(false);
  });
});
