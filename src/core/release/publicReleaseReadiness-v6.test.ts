import { describe, expect, it } from "vitest";
import { evaluatePublicReleaseReadiness } from "./publicReleaseReadiness-v6";

const ready = {
  version: "6.0.0",
  hasIndex: true,
  hasManifest: true,
  hasServiceWorker: true,
  hasAssets: true,
  hasReadme: true,
  hasAttribution: true,
  securityGatePassed: true,
  bundleGatePassed: true,
};

describe("v6.0.0 public release readiness", () => {
  it("passes a complete public release", () => {
    expect(evaluatePublicReleaseReadiness(ready).passed).toBe(true);
  });
  it("blocks any version other than 6.0.0", () => {
    expect(evaluatePublicReleaseReadiness({ ...ready, version: "5.144.0" }).passed).toBe(false);
  });
  it("blocks a release without required PWA artifacts", () => {
    const result = evaluatePublicReleaseReadiness({ ...ready, hasServiceWorker: false });
    expect(result.passed).toBe(false);
    expect(result.checks.find((check) => check.id === "service-worker")?.passed).toBe(false);
  });
  it("blocks a release when security or bundle gates fail", () => {
    expect(evaluatePublicReleaseReadiness({ ...ready, securityGatePassed: false }).passed).toBe(false);
    expect(evaluatePublicReleaseReadiness({ ...ready, bundleGatePassed: false }).passed).toBe(false);
  });
});
