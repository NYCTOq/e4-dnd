import { describe, expect, it } from "vitest";
import type { E4FullBackup } from "../../features/backup/fullBackup";
import { DEFAULT_APP_SETTINGS } from "../../shared/settings/appSettings";
import {
  buildStablePlayerReleaseManifest,
  formatStablePlayerReleaseSummary,
  STABLE_PLAYER_RELEASE_VERSION,
} from "./stablePlayerRelease";

const backup: E4FullBackup = {
  format: "e4-dnd-full-backup",
  version: 2,
  exportedAt: "2026-07-17T00:00:00.000Z",
  data: {
    characters: [], campaigns: [], homebrewSpells: [], homebrewItems: [], homebrewMonsters: [],
    favoriteMonsterIds: [], appSettings: DEFAULT_APP_SETTINGS,
  },
};

const passingInput = {
  backupCandidate: backup,
  unitTestsPassed: true,
  productionBuildPassed: true,
  browserE2ePassed: true,
  runtimeMissingCount: 0,
  playerJourneyCertified: true,
  dataIntegrityCertified: true,
};

describe("stable player release", () => {
  it("publishes the v5 stable manifest when every release gate passes", () => {
    const manifest = buildStablePlayerReleaseManifest(passingInput);
    expect(manifest).toMatchObject({ version: STABLE_PLAYER_RELEASE_VERSION, channel: "stable", stable: true, blockers: [] });
    expect(manifest.score).toBe(100);
  });

  it("blocks a mismatched application version", () => {
    const manifest = buildStablePlayerReleaseManifest({ ...passingInput, appVersion: "4.12.0" });
    expect(manifest.stable).toBe(false);
    expect(manifest.blockers.join(" ")).toContain("Version gate");
  });

  it("blocks unresolved runtime coverage", () => {
    const manifest = buildStablePlayerReleaseManifest({ ...passingInput, runtimeMissingCount: 2 });
    expect(manifest.stable).toBe(false);
    expect(manifest.blockers.join(" ")).toContain("2 missing behavior");
  });

  it("blocks failed player journey and integrity certifications", () => {
    const manifest = buildStablePlayerReleaseManifest({ ...passingInput, playerJourneyCertified: false, dataIntegrityCertified: false });
    expect(manifest.blockers).toContain("Player journey certification failed.");
    expect(manifest.blockers).toContain("Character data integrity certification failed.");
  });

  it("keeps missing optional certification results visible as warnings", () => {
    const manifest = buildStablePlayerReleaseManifest({ ...passingInput, playerJourneyCertified: undefined, dataIntegrityCertified: undefined });
    expect(manifest.stable).toBe(true);
    expect(manifest.warnings).toHaveLength(2);
  });

  it("formats a compact release summary", () => {
    const summary = formatStablePlayerReleaseSummary(buildStablePlayerReleaseManifest(passingInput));
    expect(summary).toContain("E4 D&D v5.0.0 [STABLE]");
    expect(summary).toContain("score 100/100");
  });
});
