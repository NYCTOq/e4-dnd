import { describe, expect, it } from "vitest";
import { createHomebrewPackage, type HomebrewEntity } from "./homebrewFoundation";
import {
  getHomebrewConflictWinner,
  moveHomebrewPackagePriority,
  normalizeHomebrewLibraryPreferences,
  resolveHomebrewMarketplaceLibrary,
  toggleHomebrewPackage,
} from "./homebrewMarketplaceLibrary";

const feat = (id: string, name: string): HomebrewEntity<"feat"> => ({
  schemaVersion: 1, type: "feat", id, name, tags: [],
  payload: { id, name, ruleset: "dnd_2014", category: "general", summary: name, benefits: [] },
  createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z",
});
const pkg = (id: string, version: string, entity: HomebrewEntity) => createHomebrewPackage({ id, name: id, version, entities: [entity] });

describe("homebrew marketplace library", () => {
  it("normalizes missing preferences and preserves order", () => {
    const result = normalizeHomebrewLibraryPreferences([pkg("a", "1.0.0", feat("a-feat", "A")), pkg("b", "1.0.0", feat("b-feat", "B"))], []);
    expect(result.map((item) => [item.packageId, item.enabled, item.priority])).toEqual([["a", true, 0], ["b", true, 1]]);
  });
  it("moves package priority deterministically", () => {
    const moved = moveHomebrewPackagePriority([{ packageId: "a", enabled: true, priority: 0 }, { packageId: "b", enabled: true, priority: 1 }], "b", "up");
    expect(moved.map((item) => item.packageId)).toEqual(["b", "a"]);
  });
  it("allows packages to be disabled without deleting them", () => {
    expect(toggleHomebrewPackage([{ packageId: "a", enabled: true, priority: 0 }], "a")[0].enabled).toBe(false);
  });
  it("resolves entity conflicts using package priority", () => {
    const sameA = feat("shared-feat", "From A");
    const sameB = feat("shared-feat", "From B");
    const packages = [pkg("a", "1.0.0", sameA), pkg("b", "2.0.0", sameB)];
    const resolution = resolveHomebrewMarketplaceLibrary(packages, [
      { packageId: "a", enabled: true, priority: 1 },
      { packageId: "b", enabled: true, priority: 0 },
    ]);
    expect(resolution.activeEntities[0].name).toBe("From B");
    expect(getHomebrewConflictWinner(resolution, "feat", "shared-feat")?.id).toBe("b");
  });
  it("reports marketplace updates without forcing installation", () => {
    const resolution = resolveHomebrewMarketplaceLibrary([pkg("a", "1.0.0", feat("a-feat", "A"))], [], [{ packageId: "a", latestVersion: "1.2.0" }]);
    expect(resolution.entries[0].updateAvailable).toBe(true);
    expect(resolution.entries[0].updateVersion).toBe("1.2.0");
  });
  it("removes disabled packages from conflict resolution", () => {
    const packages = [pkg("a", "1.0.0", feat("shared", "A")), pkg("b", "1.0.0", feat("shared", "B"))];
    const resolution = resolveHomebrewMarketplaceLibrary(packages, [
      { packageId: "a", enabled: false, priority: 0 },
      { packageId: "b", enabled: true, priority: 1 },
    ]);
    expect(resolution.conflicts).toHaveLength(0);
    expect(resolution.activeEntities[0].name).toBe("B");
  });
  it("blocks duplicate package IDs", () => {
    const repeated = pkg("same", "1.0.0", feat("one", "One"));
    const result = resolveHomebrewMarketplaceLibrary([repeated, { ...repeated, version: "2.0.0" }]);
    expect(result.blockers.some((item) => item.includes("Tekrarlanan paket ID"))).toBe(true);
  });
});
