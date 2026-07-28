import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const artifacts = [
  "src/certification/discovery/remainingPlayerExperienceDiscovery.ts",
  "src/certification/discovery/remainingPlayerExperienceDiscovery.test.ts",
  "scripts/discover-remaining-player-experience-v5-122A.mjs",
  "certification-reports/remaining-player-experience-discovery-v5.122A.json",
  "certification-reports/remaining-player-experience-discovery-v5.122A.md",
];

describe("v5.122A remaining player experience artifact contract", () => {
  for (const artifact of artifacts) it(`${artifact} exists`, async () => { await expect(access(resolve(artifact))).resolves.toBeUndefined(); });
  it("machine report selects the character hub and has no missing evidence", async () => {
    const report = JSON.parse(await readFile(resolve("certification-reports/remaining-player-experience-discovery-v5.122A.json"), "utf8"));
    expect(report).toMatchObject({ status: "READY_FOR_EXPERIENCE_MATRIX", selectedDomain: "character-hub-actionability", nextPackage: "v5.122B", domainCount: 8 });
    expect(report.missingEvidence).toEqual([]);
  });
});
