import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

describe("J-MEGA2 deployment package and rollback closure", () => {
  const requiredArtifacts = [
    "release/RELEASE_CANDIDATE_METADATA_J_MEGA1.json",
    "release/RELEASE_CANDIDATE_BUNDLE_J_MEGA1.json",
    "release/ROLLBACK_PLAN_G_MEGA1.md",
    "release/DEPLOYMENT_CHECKLIST_J_MEGA2.md",
    "release/LIVE_SMOKE_RUNBOOK_J_MEGA2.md",
    "release/CACHE_UPDATE_STRATEGY_J_MEGA2.md",
    "release/ROLLBACK_BUNDLE_CHECKLIST_J_MEGA2.md",
    "scripts/generate-deployment-package-J-MEGA2.mjs",
    "scripts/verify-deployment-package-J-MEGA2.mjs",
  ];

  for (const artifact of requiredArtifacts) {
    it(`keeps ${artifact} present`, () => {
      expect(exists(artifact)).toBe(true);
    });
  }

  it("keeps release candidate version at 6.2.0", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    );

    expect(packageJson.version).toBe("6.2.0");
    expect(packageJson.e4Release).toMatchObject({
      saveSchemaVersion: 2,
    });

    expect([
      "release-candidate",
      "public-release",
    ]).toContain(packageJson.e4Release.channel);

    expect([
      "J-MEGA1",
      "K-MEGA1",
    ]).toContain(packageJson.e4Release.releaseId);
  });
});
