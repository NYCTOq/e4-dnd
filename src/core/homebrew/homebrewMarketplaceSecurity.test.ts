import { describe, expect, it } from "vitest";
import { createHomebrewPackage } from "./homebrewFoundation";
import { createHomebrewShareManifest } from "./homebrewPackageSharing";
import { createHomebrewMarketplaceEnvelope, verifyHomebrewMarketplaceEnvelope, type HomebrewMarketplaceSource } from "./homebrewMarketplaceTrust";
import {
  createHomebrewSecurityEvent,
  evaluateHomebrewMarketplaceSync,
  markHomebrewMarketplaceSourceSynced,
  pruneHomebrewSecurityEvents,
  validateHomebrewRevocationList,
  verifyHomebrewMarketplaceRevocations,
  type HomebrewMarketplaceRevocationList,
} from "./homebrewMarketplaceSecurity";

const source = (extra: Partial<HomebrewMarketplaceSource> = {}): HomebrewMarketplaceSource => ({
  id: "official", name: "Official", trustLevel: "trusted", enabled: true, addedAt: "2026-01-01T00:00:00.000Z", ...extra,
});
const revocations = (extra: Partial<HomebrewMarketplaceRevocationList> = {}): HomebrewMarketplaceRevocationList => ({
  format: "e4-dnd-homebrew-revocations", schemaVersion: 1, sourceId: "official", updatedAt: "2026-07-18T00:00:00.000Z", expiresAt: "2027-01-01T00:00:00.000Z", revokedSignerIds: [], revokedPackages: [], ...extra,
});

 describe("homebrew marketplace sync, revocation and security audit", () => {
  it("reports sources that were never synced", () => {
    expect(evaluateHomebrewMarketplaceSync(source(), new Date("2026-07-18T00:00:00Z")).state).toBe("never");
  });
  it("marks a source current after sync", () => {
    const synced = markHomebrewMarketplaceSourceSynced(source({ syncIntervalHours: 24 }), "2026-07-18T00:00:00Z");
    expect(evaluateHomebrewMarketplaceSync(synced, new Date("2026-07-18T12:00:00Z")).state).toBe("current");
  });
  it("blocks stale revocation lists", () => {
    const report = validateHomebrewRevocationList(revocations({ expiresAt: "2026-01-01T00:00:00Z" }), source(), new Date("2026-07-18T00:00:00Z"));
    expect(report.valid).toBe(false);
  });
  it("blocks revoked package versions", async () => {
    const manifest = createHomebrewShareManifest([{ package: createHomebrewPackage({ id: "sand", name: "Sand", version: "1.0.0", entities: [] }), dependencies: [] }], "5.0.0");
    const envelope = await createHomebrewMarketplaceEnvelope(manifest, "official");
    const verification = await verifyHomebrewMarketplaceEnvelope(envelope, [source()]);
    const report = verifyHomebrewMarketplaceRevocations(envelope, verification, [revocations({ revokedPackages: [{ packageId: "sand", version: "1.0.0", reason: "Security issue", revokedAt: "2026-07-18T00:00:00Z" }] })]);
    expect(report.revoked).toBe(true);
    expect(report.valid).toBe(false);
  });
  it("blocks revoked signer ids", async () => {
    const manifest = createHomebrewShareManifest([], "5.0.0");
    const envelope = await createHomebrewMarketplaceEnvelope(manifest, "official");
    envelope.integrity.signerId = "key-1";
    const verification = await verifyHomebrewMarketplaceEnvelope(envelope, [source()]);
    const report = verifyHomebrewMarketplaceRevocations(envelope, verification, [revocations({ revokedSignerIds: ["key-1"] })]);
    expect(report.blockers.join(" ")).toContain("key-1");
  });
  it("keeps a bounded deduplicated security audit", () => {
    const event = createHomebrewSecurityEvent("verify", "info", "OK", "official", "2026-07-18T00:00:00Z");
    expect(pruneHomebrewSecurityEvents([event, event], 10)).toHaveLength(1);
  });
});
