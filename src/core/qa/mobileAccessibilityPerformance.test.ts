import { describe, expect, it } from "vitest";
import {
  getAccessibilityPerformanceReport,
  getCatalogRenderBudget,
} from "./mobileAccessibilityPerformance";

const healthy = {
  viewportWidth: 390,
  scrollWidth: 390,
  clientWidth: 390,
  interactiveTargetSizes: [44, 48, 52],
  hasSkipLink: true,
  mainIsFocusable: true,
  visibleFocusStyle: true,
  reducedMotionSupported: true,
  renderedCatalogItems: 80,
  totalCatalogItems: 300,
};

describe("mobile accessibility and performance", () => {
  it("caps large catalogs before filtering", () => {
    expect(getCatalogRenderBudget(300)).toBe(80);
    expect(getCatalogRenderBudget(300, true)).toBe(300);
  });

  it("passes a healthy mobile shell", () => {
    expect(getAccessibilityPerformanceReport(healthy)).toMatchObject({
      ready: true,
      score: 100,
      blockers: [],
    });
  });

  it("blocks horizontal overflow and undersized targets", () => {
    const report = getAccessibilityPerformanceReport({
      ...healthy,
      scrollWidth: 430,
      interactiveTargetSizes: [36, 44],
    });
    expect(report.ready).toBe(false);
    expect(report.blockers).toEqual(
      expect.arrayContaining([
        "Sayfada yatay taşma var.",
        "1 dokunmatik hedef 44 px altında.",
      ]),
    );
  });

  it("blocks catalog over-rendering", () => {
    const report = getAccessibilityPerformanceReport({
      ...healthy,
      renderedCatalogItems: 140,
    });
    expect(report.blockers.some((item) => item.includes("render bütçesi"))).toBe(true);
  });
});
