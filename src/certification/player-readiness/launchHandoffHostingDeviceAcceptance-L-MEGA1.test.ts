import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const exists = (relativePath: string) =>
  fs.existsSync(path.join(projectRoot, relativePath));

describe("L-MEGA1 launch handoff and physical-device acceptance", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );

  it("keeps the certified public release baseline", () => {
    expect(packageJson.version).toBe("6.2.0");
    expect(packageJson.e4Release).toMatchObject({
      channel: "public-release",
      releaseId: "K-MEGA1",
      saveSchemaVersion: 2,
      compatibilityFloor: "6.1.0",
      gitTag: "v6.2.0",
    });
  });

  const required = [
    "release/E4_DND_6.2.0_PUBLIC.zip",
    "release/E4_DND_6.2.0_PUBLIC.sha256",
    "release/POST_RELEASE_BASELINE_K_MEGA2.json",
    "release/LAUNCH_HANDOFF_L_MEGA1.md",
    "release/PHYSICAL_DEVICE_ACCEPTANCE_L_MEGA1.md",
    "release/LIVE_HOSTING_SMOKE_L_MEGA1.md",
    "release/LAUNCH_EVIDENCE_CHECKLIST_L_MEGA1.md",
    "deployment/hosting-examples/apache-spa-pwa.htaccess.example",
    "deployment/hosting-examples/nginx-spa-pwa.conf.example",
    "scripts/generate-launch-evidence-L-MEGA1.mjs",
  ];

  for (const artifact of required) {
    it(`keeps ${artifact} present`, () => {
      expect(exists(artifact)).toBe(true);
    });
  }
});
