import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import {
  CHARACTER_BACKUP_VERSION,
  createCharacterBackup,
  parseCharacterBackup,
} from "./characterBackup";

describe("character backup migration and validation", () => {
  it("round-trips the current envelope format", () => {
    const parsed = parseCharacterBackup(createCharacterBackup([makeCharacter()]));
    expect(parsed.sourceVersion).toBe(CHARACTER_BACKUP_VERSION);
    expect(parsed.migrated).toBe(false);
    expect(parsed.characters[0].name).toBe("Test Hero");
  });

  it("migrates legacy raw character arrays", () => {
    const legacy = [{
      ...makeCharacter(),
      featIds: undefined,
      spellSlots: undefined,
      resources: undefined,
    }];
    const parsed = parseCharacterBackup(legacy);
    expect(parsed.legacyArray).toBe(true);
    expect(parsed.migrated).toBe(true);
    expect(parsed.characters[0].featIds).toEqual([]);
    expect(parsed.characters[0].resources.length).toBeGreaterThanOrEqual(0);
  });

  it("rejects duplicate IDs before replacing current data", () => {
    const character = makeCharacter();
    expect(() => parseCharacterBackup(createCharacterBackup([character, character])))
      .toThrow("aynı ID");
  });

  it("rejects malformed ability blocks with an indexed error", () => {
    const broken = { ...makeCharacter(), abilities: { str: 10 } };
    expect(() => parseCharacterBackup([broken])).toThrow("1. karakter");
  });

  it("rejects backups from a newer app version", () => {
    const backup = createCharacterBackup([makeCharacter()]);
    expect(() => parseCharacterBackup({ ...backup, version: CHARACTER_BACKUP_VERSION + 1 }))
      .toThrow("daha yeni");
  });
});
