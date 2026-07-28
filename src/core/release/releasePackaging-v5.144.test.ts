import { describe, expect, it } from "vitest";
import { normalizeReleaseVersion, releaseFolderName, validateReleaseInputs } from "./releasePackaging-v5.144";

describe("v5.144 release packaging", () => {
  it("normalizes a semantic release version", () => {
    expect(normalizeReleaseVersion(" v5.144.0 ")).toBe("5.144.0");
  });

  it("creates a deterministic release folder name", () => {
    expect(releaseFolderName("5.144.0")).toBe("E4_DND_v5.144.0");
  });

  it("accepts a complete PWA build", () => {
    expect(validateReleaseInputs({ indexHtml: true, webManifest: true, serviceWorker: true, assetCount: 4, version: "5.144.0" })).toEqual({ ok: true, violations: [] });
  });

  it("blocks incomplete release inputs", () => {
    const result = validateReleaseInputs({ indexHtml: false, webManifest: true, serviceWorker: false, assetCount: 0, version: "not-a-version" });
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("dist/index.html is missing");
    expect(result.violations).toContain("dist/sw.js is missing");
  });
});
