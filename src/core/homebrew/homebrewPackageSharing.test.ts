import { describe, expect, it } from "vitest";
import { createHomebrewPackage, type HomebrewEntity } from "./homebrewFoundation";
import {
  compareHomebrewVersions,
  createHomebrewShareManifest,
  exportHomebrewShareManifest,
  importHomebrewShareManifest,
  mergeSharedHomebrewPackages,
  migrateHomebrewPackage,
  satisfiesHomebrewVersion,
  validateHomebrewShareManifest,
} from "./homebrewPackageSharing";

const feat: HomebrewEntity<"feat"> = {
  schemaVersion: 1, type: "feat", id: "sand-born", name: "Sand Born", tags: [],
  payload: { id: "sand-born", name: "Sand Born", ruleset: "dnd_2014", category: "general", summary: "Gift", benefits: ["Sand"] },
  createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z",
};
const packageOf = (id: string, version: string) => createHomebrewPackage({ id, name: id, version, entities: [{ ...feat, id: `${id}-feat`, name: `${id} feat`, payload: { ...feat.payload, id: `${id}-feat`, name: `${id} feat` } }] });

describe("homebrew package sharing", () => {
  it("compares semantic package versions", () => expect(compareHomebrewVersions("1.4.0", "1.3.9")).toBeGreaterThan(0));
  it("supports exact, caret and minimum version ranges", () => {
    expect(satisfiesHomebrewVersion("1.4.2", "^1.2.0")).toBe(true);
    expect(satisfiesHomebrewVersion("2.0.0", "^1.2.0")).toBe(false);
    expect(satisfiesHomebrewVersion("1.4.2", ">=1.4.0")).toBe(true);
  });
  it("resolves dependencies before dependent packages", () => {
    const core = packageOf("core", "1.2.0");
    const addon = packageOf("addon", "1.0.0");
    const manifest = createHomebrewShareManifest([
      { package: addon, dependencies: [{ packageId: "core", versionRange: "^1.0.0" }] },
      { package: core, dependencies: [] },
    ]);
    expect(validateHomebrewShareManifest(manifest).installOrder).toEqual(["core", "addon"]);
  });
  it("blocks missing required dependencies and version mismatches", () => {
    const addon = packageOf("addon", "1.0.0");
    const missing = createHomebrewShareManifest([{ package: addon, dependencies: [{ packageId: "core", versionRange: "^1.0.0" }] }]);
    expect(validateHomebrewShareManifest(missing).valid).toBe(false);
    const mismatch = createHomebrewShareManifest([
      { package: addon, dependencies: [{ packageId: "core", versionRange: "^2.0.0" }] },
      { package: packageOf("core", "1.5.0"), dependencies: [] },
    ]);
    expect(validateHomebrewShareManifest(mismatch).valid).toBe(false);
  });
  it("blocks circular dependencies", () => {
    const manifest = createHomebrewShareManifest([
      { package: packageOf("a", "1.0.0"), dependencies: [{ packageId: "b", versionRange: "*" }] },
      { package: packageOf("b", "1.0.0"), dependencies: [{ packageId: "a", versionRange: "*" }] },
    ]);
    expect(validateHomebrewShareManifest(manifest).blockers.some((item) => item.includes("Döngüsel"))).toBe(true);
  });
  it("migrates legacy packages and normalizes entity metadata", () => {
    const migrated = migrateHomebrewPackage({ id: "legacy", name: "Legacy", entities: [{ type: "feat", id: "legacy-feat", name: "Legacy Feat", payload: { id: "legacy-feat", name: "Legacy Feat", ruleset: "dnd_2014", category: "general", summary: "Legacy", benefits: [] } }] }, "2026-07-17T00:00:00.000Z");
    expect(migrated.migrated).toBe(true);
    expect(migrated.package.version).toBe("1.0.0");
    expect(migrated.package.entities[0].schemaVersion).toBe(1);
  });
  it("round-trips a dependency-aware share manifest", () => {
    const manifest = createHomebrewShareManifest([{ package: packageOf("core", "1.0.0"), dependencies: [] }]);
    const imported = importHomebrewShareManifest(exportHomebrewShareManifest(manifest));
    expect(imported.packages[0].package.id).toBe("core");
    expect(imported.packages[0].package.version).toBe("1.0.0");
    expect(imported.packages[0].dependencies).toEqual([]);
  });
  it("merges packages without downgrading installed versions", () => {
    const current = [packageOf("core", "2.0.0")];
    const manifest = createHomebrewShareManifest([{ package: packageOf("core", "1.0.0"), dependencies: [] }]);
    expect(mergeSharedHomebrewPackages(current, manifest)[0].version).toBe("2.0.0");
  });
});
