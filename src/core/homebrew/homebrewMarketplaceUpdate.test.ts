import { describe, expect, it } from "vitest";
import type { HomebrewPackage } from "./homebrewFoundation";
import { createHomebrewShareManifest } from "./homebrewPackageSharing";
import { applyHomebrewMarketplaceManifest, createHomebrewPackageSnapshot, pruneHomebrewSnapshots, rollbackHomebrewPackage } from "./homebrewMarketplaceUpdate";

const pkg = (version: string): HomebrewPackage => ({
  format: "e4-dnd-homebrew", schemaVersion: 1, id: "sand", name: "Sand Pack", version,
  createdAt: "2026-01-01T00:00:00.000Z", entities: [],
});

describe("homebrew marketplace update and rollback", () => {
  it("snapshots the installed package before updating", () => {
    const manifest = createHomebrewShareManifest([{ package: pkg("2.0.0"), dependencies: [] }], "5.0.0");
    const result = applyHomebrewMarketplaceManifest([pkg("1.0.0")], manifest, [], "5.16.0");
    expect(result.blockers).toEqual([]);
    expect(result.packages[0].version).toBe("2.0.0");
    expect(result.snapshots[0].version).toBe("1.0.0");
  });

  it("does not downgrade an installed package", () => {
    const manifest = createHomebrewShareManifest([{ package: pkg("1.0.0"), dependencies: [] }], "5.0.0");
    const result = applyHomebrewMarketplaceManifest([pkg("2.0.0")], manifest, [], "5.16.0");
    expect(result.packages[0].version).toBe("2.0.0");
    expect(result.skippedPackageIds).toEqual(["sand"]);
  });

  it("rolls back from a stored snapshot", () => {
    const snapshot = createHomebrewPackageSnapshot(pkg("1.0.0"), "update", "2026-01-01T00:00:00.000Z");
    const result = rollbackHomebrewPackage([pkg("2.0.0")], [snapshot], snapshot.id);
    expect(result.blockers).toEqual([]);
    expect(result.packages[0].version).toBe("1.0.0");
    expect(result.snapshots.some((item) => item.version === "2.0.0")).toBe(true);
  });

  it("blocks rollback when the snapshot does not exist", () => {
    expect(rollbackHomebrewPackage([pkg("2.0.0")], [], "missing").blockers).toHaveLength(1);
  });

  it("keeps only the newest snapshots per package", () => {
    const snapshots = [1, 2, 3].map((day) => createHomebrewPackageSnapshot(pkg(`${day}.0.0`), "update", `2026-01-0${day}T00:00:00.000Z`));
    expect(pruneHomebrewSnapshots(snapshots, 2).map((item) => item.version)).toEqual(["3.0.0", "2.0.0"]);
  });

  it("blocks an incompatible manifest", () => {
    const manifest = createHomebrewShareManifest([{ package: pkg("2.0.0"), dependencies: [] }], "9.0.0");
    expect(applyHomebrewMarketplaceManifest([pkg("1.0.0")], manifest, [], "5.16.0").blockers.length).toBeGreaterThan(0);
  });
});
