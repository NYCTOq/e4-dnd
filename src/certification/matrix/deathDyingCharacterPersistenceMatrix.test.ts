import { describe, expect, it } from "vitest";
import {
  applyDamageToDyingCharacter,
  characterDeathSaveState,
  deserializeDeathDyingCharacter,
  healDyingCharacter,
  rollCharacterDeathSave,
  serializeDeathDyingCharacter,
  stabilizeDyingCharacter,
  type DeathDyingCompatibleCharacter,
} from "../../core/rulesets/deathDyingCharacterAdapter";

describe("v5.115C death & dying character persistence matrix", () => {
  for (const hp of [0, 1, 5, 20])
    for (const tempHp of [0, 3, 10])
      for (const damage of [0, 1, 5, 20, 50])
        for (const critical of [false, true])
          it(`damage ${hp}/${tempHp}/${damage}/${critical}`, () => {
            const original: DeathDyingCompatibleCharacter = {
              id: "matrix", currentHp: hp, maxHp: 20, tempHp,
              deathSaves: { successes: 1, failures: 0 },
              homebrewMetadata: { source: "sand" },
            };
            const copy = structuredClone(original);
            const result = applyDamageToDyingCharacter(
              original, damage, { critical },
            );
            expect(original).toEqual(copy);
            expect(result.character.currentHp).toBeGreaterThanOrEqual(0);
            expect(characterDeathSaveState(result.character).failures)
              .toBeLessThanOrEqual(3);
            expect(result.character.homebrewMetadata)
              .toEqual({ source: "sand" });
          });

  for (let successes = 0; successes <= 3; successes += 1)
    for (let failures = 0; failures <= 3; failures += 1)
      for (const roll of [1, 2, 9, 10, 19, 20])
        it(`save ${successes}/${failures}/${roll}`, () => {
          const result = rollCharacterDeathSave({
            currentHp: 0, maxHp: 20, deathSaves: { successes, failures },
          }, roll);
          const restored =
            deserializeDeathDyingCharacter<DeathDyingCompatibleCharacter>(
              serializeDeathDyingCharacter(result.character),
            );
          expect(restored).toEqual(result.character);
          expect(characterDeathSaveState(restored).failures)
            .toBeLessThanOrEqual(3);
        });

  for (const healing of [0, 1, 5, 20, 100])
    it(`healing ${healing}`, () => {
      const result = healDyingCharacter({
        currentHp: 0, maxHp: 20,
        deathSaves: { successes: 2, failures: 2 },
      }, healing);
      expect(result.currentHp).toBe(Math.min(20, healing));
      if (healing > 0) {
        expect(result.deathSaves).toEqual({ successes: 0, failures: 0 });
      }
    });

  it("stabilization persists", () => {
    const stable = stabilizeDyingCharacter({
      currentHp: 0, maxHp: 10,
      deathSaves: { successes: 2, failures: 1 },
    });
    expect(deserializeDeathDyingCharacter<DeathDyingCompatibleCharacter>(
      serializeDeathDyingCharacter(stable),
    ).deathSaveStable).toBe(true);
  });
  it("history remains bounded", () => {
    let character: DeathDyingCompatibleCharacter = {
      currentHp: 0, maxHp: 10,
      deathSaves: { successes: 0, failures: 0 },
    };
    for (let index = 0; index < 80; index += 1) {
      character = healDyingCharacter(character, 0);
    }
    expect(character.deathDyingHistory).toHaveLength(50);
  });
  it("rejects arrays", () => {
    expect(() => deserializeDeathDyingCharacter("[]")).toThrow();
  });
});
