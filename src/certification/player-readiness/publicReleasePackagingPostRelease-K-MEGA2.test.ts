import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

const exists = (relativePath: string) =>
  fs.existsSync(path.join(projectRoot, relativePath));

describe("K-MEGA2 public release packaging and post-release baseline", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );

  it("keeps the project on the public 6.2.0 release", () => {
    expect(packageJson.version).toBe("6.2.0");
    expect(packageJson.e4Release).toMatchObject({
      channel: "public-release",
      releaseId: "K-MEGA1",
      saveSchemaVersion: 2,
      compatibilityFloor: "6.1.0",
      gitTag: "v6.2.0",
    });
  });

  const artifacts = [
    "release/PUBLIC_RELEASE_METADATA_K_MEGA1.json",
    "release/PUBLIC_RELEASE_ARCHIVE_K_MEGA1.json",
    "release/PUBLIC_RELEASE_NOTES_6.2.0.md",
    "release/PUBLIC_ROLLBACK_RUNBOOK_K_MEGA1.md",
    "release/POST_RELEASE_BASELINE_K_MEGA2.md",
    "release/HOTFIX_CHANNEL_RUNBOOK_K_MEGA2.md",
    "release/PUBLIC_RELEASE_PACKAGE_CHECKLIST_K_MEGA2.md",
    "scripts/generate-post-release-baseline-K-MEGA2.mjs",
    "scripts/verify-public-package-K-MEGA2.mjs",
  ];

  for (const artifact of artifacts) {
    it(`keeps ${artifact} present`, () => {
      expect(exists(artifact)).toBe(true);
    });
  }
});
