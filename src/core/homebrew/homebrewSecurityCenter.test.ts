import { describe, expect, it } from "vitest";
import { createHomebrewPackage } from "./homebrewFoundation";
import type { HomebrewMarketplaceRevocationList } from "./homebrewMarketplaceSecurity";
import type { HomebrewMarketplaceSource } from "./homebrewMarketplaceTrust";
import {
  canRestoreHomebrewQuarantine,
  getAutomaticSyncSources,
  restoreHomebrewQuarantine,
  runAutomaticHomebrewSourceSync,
  scanAndQuarantineHomebrewPackages,
} from "./homebrewSecurityCenter";

const pkg = createHomebrewPackage({ id: "sand", name: "Sand", version: "1.0.0", entities: [] });
const list = (revoked = true): HomebrewMarketplaceRevocationList => ({
  format: "e4-dnd-homebrew-revocations", schemaVersion: 1, sourceId: "official", updatedAt: "2026-07-18T00:00:00Z",
  revokedSignerIds: [], revokedPackages: revoked ? [{ packageId: "sand", version: "1.0.0", reason: "Security issue", revokedAt: "2026-07-18T00:00:00Z" }] : [],
});
const source = (extra: Partial<HomebrewMarketplaceSource> = {}): HomebrewMarketplaceSource => ({ id: "official", name: "Official", baseUrl: "https://example.test/feed.json", trustLevel: "trusted", enabled: true, addedAt: "2026-01-01T00:00:00Z", syncIntervalHours: 24, ...extra });

describe("homebrew security center, automatic sync and quarantine", () => {
  it("quarantines installed revoked packages", () => {
    const report = scanAndQuarantineHomebrewPackages([pkg], [{ packageId: "sand", enabled: true, priority: 0 }], [list()]);
    expect(report.safePackages).toHaveLength(0);
    expect(report.quarantines).toHaveLength(1);
    expect(report.preferences[0].enabled).toBe(false);
  });
  it("does not duplicate quarantine records", () => {
    const first = scanAndQuarantineHomebrewPackages([pkg], [], [list()]);
    const second = scanAndQuarantineHomebrewPackages([pkg], [], [list()], first.quarantines);
    expect(second.quarantines).toHaveLength(1);
  });
  it("blocks restore while package remains revoked", () => {
    const record = scanAndQuarantineHomebrewPackages([pkg], [], [list()]).quarantines[0];
    expect(canRestoreHomebrewQuarantine(record, [list()]).allowed).toBe(false);
  });
  it("restores package after revocation is cleared", () => {
    const record = scanAndQuarantineHomebrewPackages([pkg], [], [list()]).quarantines[0];
    const result = restoreHomebrewQuarantine([], [record], record.id, [list(false)]);
    expect(result.blockers).toHaveLength(0);
    expect(result.packages[0].id).toBe("sand");
  });
  it("selects due sources for automatic sync", () => {
    expect(getAutomaticSyncSources([source()], new Date("2026-07-18T00:00:00Z"))).toHaveLength(1);
  });
  it("records automatic sync success and failure", async () => {
    const success = await runAutomaticHomebrewSourceSync([source()], async () => "{\"ok\":true}", new Date("2026-07-18T00:00:00Z"));
    expect(success.downloaded).toHaveLength(1);
    const failure = await runAutomaticHomebrewSourceSync([source()], async () => { throw new Error("offline"); }, new Date("2026-07-18T00:00:00Z"));
    expect(failure.blockers.join(" ")).toContain("offline");
  });
});
