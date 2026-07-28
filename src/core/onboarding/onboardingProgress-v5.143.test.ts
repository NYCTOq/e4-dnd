import { describe, expect, it } from "vitest";
import { getOnboardingPercent, getOnboardingSteps } from "./onboardingProgress";

describe("v5.143 onboarding progress", () => {
  it("starts with actionable incomplete steps", () => {
    const steps = getOnboardingSteps({ characterCount: 0, hasOpenedPlayMode: false, hasBackup: false, isInstalled: false });
    expect(steps).toHaveLength(4);
    expect(steps.every((step) => !step.complete)).toBe(true);
    expect(getOnboardingPercent(steps)).toBe(0);
  });

  it("derives progress from real product signals", () => {
    const steps = getOnboardingSteps({ characterCount: 1, hasOpenedPlayMode: true, hasBackup: false, isInstalled: false });
    expect(getOnboardingPercent(steps)).toBe(50);
  });

  it("marks all steps complete", () => {
    const steps = getOnboardingSteps({ characterCount: 2, hasOpenedPlayMode: true, hasBackup: true, isInstalled: true });
    expect(getOnboardingPercent(steps)).toBe(100);
  });

  it("keeps stable routes for every onboarding action", () => {
    const steps = getOnboardingSteps({ characterCount: 0, hasOpenedPlayMode: false, hasBackup: false, isInstalled: false });
    expect(steps.map((step) => step.to)).toEqual(["/builder", "/play-mode", "/backup", "/settings"]);
  });
});
