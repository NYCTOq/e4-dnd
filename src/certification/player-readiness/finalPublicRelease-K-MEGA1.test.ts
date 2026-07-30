import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const exists = (relativePath: string) =>
  fs.existsSync(path.join(projectRoot, relativePath));

describe("K-MEGA1 final public release certification", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );

  const metadata = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "release/PUBLIC_RELEASE_METADATA_K_MEGA1.json"),
      "utf8",
    ),
  );

  it("promotes 6.2.0 to public release", () => {
    expect(packageJson.version).toBe("6.2.0");
    expect(packageJson.e4Release).toMatchObject({
      channel: "public-release",
      releaseId: "K-MEGA1",
      saveSchemaVersion: 2,
      compatibilityFloor: "6.1.0",
      gitTag: "v6.2.0",
    });
  });

  it("aligns public release metadata", () => {
    expect(metadata.version).toBe("6.2.0");
    expect(metadata.channel).toBe("public-release");
    expect(metadata.releaseId).toBe("K-MEGA1");
    expect(metadata.gitTag).toBe("v6.2.0");
  });

  const artifacts = [
    "release/PUBLIC_RELEASE_NOTES_6.2.0.md",
    "release/PUBLIC_RELEASE_CHECKLIST_K_MEGA1.md",
    "release/GITHUB_RELEASE_HANDOFF_K_MEGA1.md",
    "release/PUBLIC_ROLLBACK_RUNBOOK_K_MEGA1.md",
    "scripts/generate-public-release-archive-K-MEGA1.mjs",
    "scripts/verify-public-release-archive-K-MEGA1.mjs",
    "src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts",
  ];

  for (const artifact of artifacts) {
    it(`keeps ${artifact} present`, () => {
      expect(exists(artifact)).toBe(true);
    });
  }
});
