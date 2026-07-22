import { describe, expect, it } from "vitest";
import { inspectAndRepairFullBackup } from "./backupSafetyRuntime";

const backup = {
  format: "e4-dnd-full-backup",
  version: 3,
  exportedAt: "2026-01-01T00:00:00.000Z",
  data: {
    characters: [{ id: "a" }, { id: "a" }],
    campaigns: [],
    homebrewSpells: [],
    homebrewItems: [],
    homebrewMonsters: [],
    favoriteMonsterIds: ["wolf", "wolf"],
    appSettings: {},
  },
};

describe("backup safety runtime", () => {
  it("repairs duplicate ids before import", () => {
    const report = inspectAndRepairFullBackup(backup);
    expect(report.safeToImport).toBe(true);
    expect(report.repaired).toBe(true);
    expect(report.duplicateCounts.characters).toBe(1);
    expect(report.duplicateCounts.favoriteMonsterIds).toBe(1);
  });

  it("blocks backups from a future version", () => {
    const report = inspectAndRepairFullBackup({ ...backup, version: 999 });
    expect(report.safeToImport).toBe(false);
    expect(report.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "future-version", severity: "blocker" })]));
  });

  it("blocks malformed roots", () => {
    expect(inspectAndRepairFullBackup([]).safeToImport).toBe(false);
  });

  it("defaults missing app settings", () => {
    const value = { ...backup, data: { ...backup.data, appSettings: null } };
    const report = inspectAndRepairFullBackup(value);
    expect(report.safeToImport).toBe(true);
    expect(report.repaired).toBe(true);
  });
});
