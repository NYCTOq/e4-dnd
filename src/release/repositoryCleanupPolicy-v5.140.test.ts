import { describe, expect, it } from "vitest";
import { classifyRootArtifact } from "./repositoryCleanupPolicy";

describe("v5.140 repository cleanup policy", () => {
  it("keeps canonical project documents", () => {
    expect(classifyRootArtifact("README.md")).toBe("keep");
    expect(classifyRootArtifact("CI.md")).toBe("keep");
  });
  it("archives historical apply scripts", () => {
    expect(classifyRootArtifact("APPLY_OLD_MEGA_v5.99.ps1")).toBe("archive-script");
  });
  it("archives versioned reports and matrices", () => {
    expect(classifyRootArtifact("BARBARIAN_CERTIFICATION_v5.31.md")).toBe("archive-doc");
    expect(classifyRootArtifact("SOME_MATRIX_v5.44.csv")).toBe("archive-doc");
  });
  it("archives generated manifests without touching package.json", () => {
    expect(classifyRootArtifact("manifest.v5.121C2.json")).toBe("archive-manifest");
    expect(classifyRootArtifact("package.json")).toBe("keep");
  });
  it("keeps unrelated runtime files", () => {
    expect(classifyRootArtifact("index.html")).toBe("keep");
    expect(classifyRootArtifact("notes.json")).toBe("keep");
  });
});
