import { describe, expect, it } from "vitest";
import { createHomebrewPackage } from "./homebrewFoundation";
import type { HomebrewMarketplaceSource } from "./homebrewMarketplaceTrust";
import type { HomebrewMarketplaceRevocationList } from "./homebrewMarketplaceSecurity";
import type { HomebrewQuarantineRecord } from "./homebrewSecurityCenter";
import {
  appendHomebrewSourceHealthPoint,
  buildHomebrewSecurityReleaseCertificate,
  resolveHomebrewQuarantineWithTrustedReplacement,
  summarizeHomebrewSourceHealth,
} from "./homebrewSecurityResolution";

const source = (trustLevel: HomebrewMarketplaceSource["trustLevel"] = "trusted"): HomebrewMarketplaceSource => ({ id: "official", name: "Official", trustLevel, enabled: true, addedAt: "2026-01-01T00:00:00Z", lastSyncedAt: "2026-07-18T08:00:00Z" });
const oldPkg = createHomebrewPackage({ id: "sand", name: "Sand", version: "1.0.0", entities: [] });
const newPkg = createHomebrewPackage({ id: "sand", name: "Sand", version: "1.1.0", entities: [] });
const quarantine: HomebrewQuarantineRecord = { id: "q1", packageId: "sand", packageName: "Sand", version: "1.0.0", sourceId: "official", reason: "issue", quarantinedAt: "2026-07-18T07:00:00Z", package: oldPkg };
const revocations: HomebrewMarketplaceRevocationList[] = [{ format: "e4-dnd-homebrew-revocations", schemaVersion: 1, sourceId: "official", updatedAt: "2026-07-18T07:00:00Z", expiresAt: "2026-08-18T07:00:00Z", revokedSignerIds: [], revokedPackages: [{ packageId: "sand", version: "1.0.0", reason: "issue", revokedAt: "2026-07-18T07:00:00Z" }] }];

describe("homebrew security resolution, health dashboard and release certification", () => {
  it("keeps bounded source health history", () => {
    let history = [] as ReturnType<typeof appendHomebrewSourceHealthPoint>;
    for (let index = 0; index < 5; index += 1) history = appendHomebrewSourceHealthPoint(history, { sourceId: "official", checkedAt: `2026-07-18T0${index}:00:00Z`, state: "healthy", score: 90, message: "ok" }, 3);
    expect(history).toHaveLength(3);
  });
  it("marks repeated source failures critical", () => {
    const history = [0, 1, 2].map((index) => ({ sourceId: "official", checkedAt: `2026-07-18T0${index}:00:00Z`, state: "critical" as const, score: 20, message: "offline" }));
    expect(summarizeHomebrewSourceHealth(source(), history, undefined, new Date("2026-07-18T09:00:00Z")).state).toBe("critical");
  });
  it("replaces quarantine with a trusted clean version", () => {
    const result = resolveHomebrewQuarantineWithTrustedReplacement([], [quarantine], "q1", { packageId: "sand", replacement: newPkg, sourceId: "official", verifiedAt: "2026-07-18T08:00:00Z", checksumVerified: true, signatureVerified: true }, revocations, [source()]);
    expect(result.blockers).toHaveLength(0);
    expect(result.packages[0].version).toBe("1.1.0");
  });
  it("blocks unsigned replacements under trusted policy", () => {
    const result = resolveHomebrewQuarantineWithTrustedReplacement([], [quarantine], "q1", { packageId: "sand", replacement: newPkg, sourceId: "official", verifiedAt: "2026-07-18T08:00:00Z", checksumVerified: true, signatureVerified: false }, revocations, [source()]);
    expect(result.blockers.join(" ")).toContain("dijital imza");
  });
  it("blocks replacements that remain revoked", () => {
    const result = resolveHomebrewQuarantineWithTrustedReplacement([], [quarantine], "q1", { packageId: "sand", replacement: oldPkg, sourceId: "official", verifiedAt: "2026-07-18T08:00:00Z", checksumVerified: true, signatureVerified: true }, revocations, [source()]);
    expect(result.blockers.join(" ")).toContain("geri çağırma");
  });
  it("fails release certificate while quarantine remains", () => {
    const certificate = buildHomebrewSecurityReleaseCertificate([source()], [], [quarantine], [], revocations, undefined, new Date("2026-07-18T09:00:00Z"));
    expect(certificate.ready).toBe(false);
    expect(certificate.blockers.join(" ")).toContain("karantinada");
  });
  it("passes release certificate for healthy clean state", () => {
    const health = [{ sourceId: "official", checkedAt: "2026-07-18T08:30:00Z", state: "healthy" as const, score: 100, message: "ok" }];
    const certificate = buildHomebrewSecurityReleaseCertificate([source()], health, [], [], revocations, undefined, new Date("2026-07-18T09:00:00Z"));
    expect(certificate.ready).toBe(true);
  });
  it("reports declining source trend", () => {
    const health = [
      { sourceId: "official", checkedAt: "2026-07-18T08:00:00Z", state: "warning" as const, score: 60, message: "slow" },
      { sourceId: "official", checkedAt: "2026-07-18T07:00:00Z", state: "healthy" as const, score: 95, message: "ok" },
      { sourceId: "official", checkedAt: "2026-07-18T06:00:00Z", state: "healthy" as const, score: 90, message: "ok" },
    ];
    expect(summarizeHomebrewSourceHealth(source(), health, undefined, new Date("2026-07-18T09:00:00Z")).trend).toBe("declining");
  });
});
