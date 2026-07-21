import { describe, expect, it } from "vitest";
import { createFullBackup, parseFullBackup } from "./fullBackup";
import { DEFAULT_APP_SETTINGS } from "../../shared/settings/appSettings";
import { makeCharacter } from "../../test/fixtures";

describe("fullBackup", () => {
  it("round-trips a current backup", () => {
    const backup = createFullBackup({
      characters: [makeCharacter()],
      campaigns: [],
      homebrewSpells: [],
      homebrewItems: [],
      homebrewMonsters: [],
      favoriteMonsterIds: ["monster-1"],
      appSettings: DEFAULT_APP_SETTINGS,
    });
    expect(parseFullBackup(backup).data.characters[0].name).toBe("Test Hero");
  });

  it("migrates version one backups to default app settings", () => {
    const backup = createFullBackup({
      characters: [], campaigns: [], homebrewSpells: [], homebrewItems: [], homebrewMonsters: [],
      favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
    });
    const legacy = { ...backup, version: 1, data: { ...backup.data, appSettings: undefined } };
    expect(parseFullBackup(legacy).data.appSettings).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("rejects duplicate character IDs", () => {
    const duplicate = makeCharacter();
    const backup = createFullBackup({
      characters: [duplicate, duplicate], campaigns: [], homebrewSpells: [], homebrewItems: [],
      homebrewMonsters: [], favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
    });
    expect(() => parseFullBackup(backup)).toThrow("aynı ID");
  });

  it("rejects malformed backup versions", () => {
    const backup = createFullBackup({
      characters: [], campaigns: [], homebrewSpells: [], homebrewItems: [], homebrewMonsters: [],
      favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
    });
    expect(() => parseFullBackup({ ...backup, version: 0 })).toThrow("sürüm bilgisi");
  });

  it("rejects malformed character records", () => {
    expect(() => parseFullBackup({
      format: "e4-dnd-full-backup", version: 2, exportedAt: "", data: {
        characters: [{ id: "broken" }], campaigns: [], homebrewSpells: [], homebrewItems: [],
        homebrewMonsters: [], favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
      },
    })).toThrow("geçersiz karakter");
  });
});
