import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readJson(relativePath: string) {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, relativePath), "utf8"),
  );
}

describe("J-MEGA1 version bump and release candidate closure", () => {
  const packageJson = readJson("package.json");
  const metadata = readJson(
    "release/RELEASE_CANDIDATE_METADATA_J_MEGA1.json",
  );

  it("bumps the package to the 6.2.0 release candidate baseline", () => {
    expect(packageJson.version).toBe("6.2.0");
    expect(packageJson.e4Release).toMatchObject({
      channel: "release-candidate",
      releaseId: "J-MEGA1",
      saveSchemaVersion: 2,
      compatibilityFloor: "6.1.0",
    });
  });

  it("keeps release metadata aligned with package metadata", () => {
    expect(metadata.version).toBe(packageJson.version);
    expect(metadata.releaseId).toBe("J-MEGA1");
    expect(metadata.channel).toBe("release-candidate");
    expect(metadata.gitTag).toBe("v6.2.0-rc.1");
  });

  const requiredArtifacts = [
    "release/RELEASE_NOTES_6.2.0_RC1.md",
    "release/CHANGELOG_6.2.0.md",
    "release/GIT_RELEASE_HANDOFF_J_MEGA1.md",
    "release/RELEASE_CANDIDATE_CHECKLIST_J_MEGA1.md",
    "scripts/generate-release-candidate-bundle-J-MEGA1.mjs",
  ];

  for (const artifact of requiredArtifacts) {
    it(`keeps ${artifact} present`, () => {
      expect(fs.existsSync(path.join(projectRoot, artifact))).toBe(true);
    });
  }
});
