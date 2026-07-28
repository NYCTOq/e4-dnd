import fs from "node:fs";
import { describe, expect, it } from "vitest";
const required=[
  "src/certification/golden/characterHubGoldenIntegration.ts",
  "src/certification/golden/characterHubGoldenIntegration.test.ts",
  "scripts/generate-character-hub-golden-v5-122C.mjs",
  "certification-reports/character-hub-golden-integration-v5.122C.json",
  "certification-reports/character-hub-golden-integration-v5.122C.md",
];
describe("v5.122C golden character hub artifact contract",()=>{
  for(const file of required) it(`${file} exists`,()=>expect(fs.existsSync(file)).toBe(true));
  it("release report has no blockers",()=>{const report=JSON.parse(fs.readFileSync("certification-reports/character-hub-golden-integration-v5.122C.json","utf8"));expect(report).toMatchObject({status:"GREEN",profileCount:4,checkpointCount:6,surfaceCount:3,projectionCount:72,mismatchCount:0,nextPackage:"v5.122D"});});
});
