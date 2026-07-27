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

const characters: DeathDyingCompatibleCharacter[] = [
  { id: "fighter", name: "Fighter", currentHp: 45, maxHp: 45, tempHp: 0 },
  { id: "wizard", name: "Wizard", currentHp: 1, maxHp: 22, tempHp: 5 },
  { id: "cleric", name: "Cleric", currentHp: 0, maxHp: 38, deathSaves: { successes: 1, failures: 1 } },
  { id: "rogue", name: "Rogue", currentHp: 0, maxHp: 31, deathSaves: { successes: 2, failures: 0 } },
  { id: "barbarian", name: "Barbarian", currentHp: 12, maxHp: 60, tempHp: 0 },
  { id: "legacy", name: "Legacy", currentHp: 0, maxHp: 8, customMetadata: { campaign: "Alabasta" } },
];

describe("v5.115C death & dying golden characters", () => {
  it("contains six golden characters", () => expect(characters).toHaveLength(6));
  for (const character of characters) {
    it(`${String(character.name)} JSON round trip`, () => {
      expect(deserializeDeathDyingCharacter(
        serializeDeathDyingCharacter(character),
      )).toEqual(character);
    });
    it(`${String(character.name)} preserves custom fields`, () => {
      expect(healDyingCharacter(character, 1).id).toBe(character.id);
    });
  }
  it("temporary HP absorbs first", () => {
    const result = applyDamageToDyingCharacter(characters[1], 7);
    expect(result.absorbedByTempHp).toBe(5);
    expect(result.character.currentHp).toBe(0);
  });
  it("zero HP damage adds failure", () => {
    expect(applyDamageToDyingCharacter(characters[2], 4)
      .character.deathSaves?.failures).toBe(2);
  });
  it("critical zero HP damage adds two", () => {
    expect(applyDamageToDyingCharacter(characters[2], 4, { critical: true })
      .dead).toBe(true);
  });
  it("massive damage kills", () => {
    expect(applyDamageToDyingCharacter(characters[4], 72)
      .massiveDamage).toBe(true);
  });
  it("natural 20 restores one HP", () => {
    const result = rollCharacterDeathSave(characters[3], 20);
    expect(result.character.currentHp).toBe(1);
    expect(characterDeathSaveState(result.character).dead).toBe(false);
  });
  it("stabilize resets counters", () => {
    const stable = stabilizeDyingCharacter(characters[3]);
    expect(characterDeathSaveState(stable)).toEqual({
      successes: 0, failures: 0, stable: true, dead: false,
    });
  });
  it("healing resets death state", () => {
    const healed = healDyingCharacter(characters[2], 8);
    expect(healed.currentHp).toBe(8);
    expect(healed.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});
