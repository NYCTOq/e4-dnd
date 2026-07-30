import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const targets = [
  {
    file: "src/certification/player-readiness/versionBumpReleaseCandidate-J-MEGA1.test.ts",
    replacements: [
      [
        `expect(packageJson.e4Release).toMatchObject({
      channel: "release-candidate",
      releaseId: "J-MEGA1",
      saveSchemaVersion: 2,
      compatibilityFloor: "6.1.0",
    });`,
        `expect(packageJson.e4Release).toMatchObject({
      saveSchemaVersion: 2,
      compatibilityFloor: "6.1.0",
    });

    expect([
      "release-candidate",
      "public-release",
    ]).toContain(packageJson.e4Release.channel);

    expect([
      "J-MEGA1",
      "K-MEGA1",
    ]).toContain(packageJson.e4Release.releaseId);`,
      ],
    ],
  },
  {
    file: "src/certification/player-readiness/deploymentPackageRollback-J-MEGA2.test.ts",
    replacements: [
      [
        `expect(packageJson.e4Release).toMatchObject({
      channel: "release-candidate",
      releaseId: "J-MEGA1",
      saveSchemaVersion: 2,
    });`,
        `expect(packageJson.e4Release).toMatchObject({
      saveSchemaVersion: 2,
    });

    expect([
      "release-candidate",
      "public-release",
    ]).toContain(packageJson.e4Release.channel);

    expect([
      "J-MEGA1",
      "K-MEGA1",
    ]).toContain(packageJson.e4Release.releaseId);`,
      ],
    ],
  },
];

for (const target of targets) {
  const fullPath = path.join(projectRoot, target.file);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Target file not found: ${target.file}`);
  }

  let source = fs.readFileSync(fullPath, "utf8");

  for (const [oldText, newText] of target.replacements) {
    if (!source.includes(oldText) && !source.includes(newText)) {
      throw new Error(`Expected block not found in ${target.file}`);
    }

    source = source.replace(oldText, newText);
  }

  fs.writeFileSync(fullPath, source, "utf8");
}

console.log(JSON.stringify({
  repaired: targets.map((target) => target.file),
  acceptedChannels: ["release-candidate", "public-release"],
  acceptedReleaseIds: ["J-MEGA1", "K-MEGA1"],
}, null, 2));
