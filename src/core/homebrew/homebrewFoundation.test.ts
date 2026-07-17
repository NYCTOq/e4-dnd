import { describe, expect, it } from "vitest";
import {
  createHomebrewPackage,
  exportHomebrewPackage,
  getHomebrewResourceMaximum,
  importHomebrewPackage,
  recoverHomebrewResource,
  validateHomebrewEntity,
  validateHomebrewPackage,
  type HomebrewEntity,
} from "./homebrewFoundation";

const feat: HomebrewEntity<"feat"> = {
  schemaVersion: 1,
  type: "feat",
  id: "sand-born",
  name: "Sand Born",
  tags: ["desert"],
  payload: { id: "sand-born", name: "Sand Born", ruleset: "dnd_2014", category: "general", summary: "Desert gift.", benefits: ["Gain sand charges."] },
  resources: [{ id: "sand", name: "Sand Charges", maximum: 2, recovery: "long-rest", levelScaling: [{ level: 9, maximum: 3 }] }],
  actions: [{ id: "sand-step", name: "Sand Step", economy: "bonus-action", resourceId: "sand", resourceCost: 1, summary: "Teleport through sand." }],
  createdAt: "2026-07-17T00:00:00.000Z",
  updatedAt: "2026-07-17T00:00:00.000Z",
};

describe("homebrew foundation", () => {
  it("validates a typed homebrew entity", () => expect(validateHomebrewEntity(feat).valid).toBe(true));
  it("blocks actions referencing missing resources", () => expect(validateHomebrewEntity({ ...feat, actions: [{ ...feat.actions![0], resourceId: "missing" }] }).valid).toBe(false));
  it("round-trips a versioned package", () => {
    const pkg = createHomebrewPackage({ id: "desert-pack", name: "Desert Pack", version: "1.0.0", entities: [feat] });
    expect(importHomebrewPackage(exportHomebrewPackage(pkg))).toEqual(pkg);
  });
  it("blocks duplicate entity IDs", () => {
    const pkg = createHomebrewPackage({ id: "dup", name: "Dup", version: "1", entities: [feat, feat] });
    expect(validateHomebrewPackage(pkg).valid).toBe(false);
  });
  it("scales resource maximum by level", () => expect(getHomebrewResourceMaximum(feat.resources![0], 10)).toBe(3));
  it("recovers resources only on the configured trigger", () => {
    expect(recoverHomebrewResource(feat.resources![0], 2, "short-rest", 10)).toBe(2);
    expect(recoverHomebrewResource(feat.resources![0], 2, "long-rest", 10)).toBe(0);
  });
});
