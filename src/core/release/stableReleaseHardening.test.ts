import { describe, expect, it } from "vitest";
import { DEFAULT_APP_SETTINGS } from "../../shared/settings/appSettings";
import { createFullBackup } from "../../features/backup/fullBackup";
import { makeCharacter } from "../../test/fixtures";
import { buildStableReleaseHardeningReport, createRollbackBackup, inspectBackupCandidate } from "./stableReleaseHardening";

const backup = createFullBackup({ characters:[makeCharacter()], campaigns:[], homebrewSpells:[], homebrewItems:[], homebrewMonsters:[], favoriteMonsterIds:[], appSettings:DEFAULT_APP_SETTINGS });

describe("stable release hardening", () => {
  it("certifies a valid backup and hydration path", () => expect(inspectBackupCandidate(backup).status).toBe("pass"));
  it("blocks malformed restore candidates", () => expect(inspectBackupCandidate({ format:"wrong" }).status).toBe("fail"));
  it("creates a detached rollback backup", () => { const rollback=createRollbackBackup(backup); rollback.data.characters[0].name="Changed"; expect(backup.data.characters[0].name).not.toBe("Changed"); });
  it("passes the release gate when hard blockers are clear", () => { const report=buildStableReleaseHardeningReport({appVersion:"4.12.0",backupCandidate:backup,unitTestsPassed:true,productionBuildPassed:true,browserE2ePassed:true}); expect(report.ready).toBe(true); expect(report.score).toBe(100); });
  it("keeps an unexecuted browser run as a warning", () => { const report=buildStableReleaseHardeningReport({appVersion:"4.12.0",backupCandidate:backup,unitTestsPassed:true,productionBuildPassed:true,browserE2ePassed:null}); expect(report.ready).toBe(true); expect(report.warnings.some((item)=>item.includes("Browser"))).toBe(true); });
  it("blocks migration failures and unresolved crashes", () => { const report=buildStableReleaseHardeningReport({appVersion:"4.12.0",backupCandidate:backup,unitTestsPassed:true,productionBuildPassed:true,migrationFailures:["legacy inventory"],crashCount:1}); expect(report.ready).toBe(false); expect(report.blockers).toHaveLength(2); });
});
