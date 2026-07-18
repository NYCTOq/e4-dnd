import { describe, expect, it } from "vitest";
import { createHomebrewPackage } from "./homebrewFoundation";
import { createHomebrewShareManifest } from "./homebrewPackageSharing";
import {
  calculateHomebrewManifestChecksum,
  createHomebrewMarketplaceEnvelope,
  normalizeHomebrewMarketplaceSources,
  verifyHomebrewMarketplaceEnvelope,
  type HomebrewMarketplaceSource,
} from "./homebrewMarketplaceTrust";

const source = (trustLevel: HomebrewMarketplaceSource["trustLevel"] = "trusted"): HomebrewMarketplaceSource => ({
  id: "official", name: "Official", trustLevel, enabled: true, addedAt: "2026-01-01T00:00:00.000Z",
});
const manifest = () => createHomebrewShareManifest([{ package: createHomebrewPackage({ id: "sand", name: "Sand", version: "1.0.0", entities: [] }), dependencies: [] }], "5.0.0");

describe("homebrew marketplace source registry and verification", () => {
  it("creates a stable SHA-256 checksum", async () => {
    const value = manifest();
    expect(await calculateHomebrewManifestChecksum(value)).toBe(await calculateHomebrewManifestChecksum(structuredClone(value)));
  });
  it("accepts an intact package from a trusted source", async () => {
    const envelope = await createHomebrewMarketplaceEnvelope(manifest(), "official");
    const report = await verifyHomebrewMarketplaceEnvelope(envelope, [source()]);
    expect(report.valid).toBe(true);
    expect(report.checksumValid).toBe(true);
    expect(report.trusted).toBe(true);
  });
  it("blocks checksum tampering", async () => {
    const envelope = await createHomebrewMarketplaceEnvelope(manifest(), "official");
    envelope.manifest.packages[0].package.name = "Tampered";
    expect((await verifyHomebrewMarketplaceEnvelope(envelope, [source()])).valid).toBe(false);
  });
  it("blocks unknown, disabled and blocked sources", async () => {
    const envelope = await createHomebrewMarketplaceEnvelope(manifest(), "official");
    expect((await verifyHomebrewMarketplaceEnvelope(envelope, [])).valid).toBe(false);
    expect((await verifyHomebrewMarketplaceEnvelope(envelope, [{ ...source(), enabled: false }])).valid).toBe(false);
    expect((await verifyHomebrewMarketplaceEnvelope(envelope, [source("blocked")])).valid).toBe(false);
  });
  it("warns for unsigned community sources", async () => {
    const envelope = await createHomebrewMarketplaceEnvelope(manifest(), "official");
    const report = await verifyHomebrewMarketplaceEnvelope(envelope, [source("community")]);
    expect(report.valid).toBe(true);
    expect(report.warnings.length).toBeGreaterThanOrEqual(2);
  });
  it("normalizes duplicate source registrations", () => {
    expect(normalizeHomebrewMarketplaceSources([source(), { ...source(), name: "Duplicate" }])).toHaveLength(1);
  });
});
