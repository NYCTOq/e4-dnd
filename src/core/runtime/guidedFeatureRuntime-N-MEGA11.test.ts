import { describe, expect, it } from "vitest";
import { addGuidedFeature, recoverGuidedFeatures, spendGuidedFeatureUse, toggleGuidedFeature } from "./guidedFeatureRuntime";

describe("N-MEGA11 guided feature runtime", () => {
  const base = { id:"channel-divinity", name:"Channel Divinity", source:"Cleric", maxUses:2, recovery:"short-rest" as const, economy:"action" as const };
  it("adds, spends and blocks over-spending", () => {
    const added = addGuidedFeature([], base);
    const spent = spendGuidedFeatureUse(spendGuidedFeatureUse(added, base.id), base.id);
    expect(spent[0].used).toBe(2);
    expect(spendGuidedFeatureUse(spent, base.id)[0].used).toBe(2);
  });
  it("recovers only matching recovery groups", () => {
    const spent = spendGuidedFeatureUse(addGuidedFeature([], base), base.id);
    expect(recoverGuidedFeatures(spent,"long-rest")[0].used).toBe(1);
    expect(recoverGuidedFeatures(spent,"short-rest")[0].used).toBe(0);
  });
  it("tracks active guided effects", () => {
    const added = addGuidedFeature([], base);
    expect(toggleGuidedFeature(added, base.id)[0].active).toBe(true);
  });
});
