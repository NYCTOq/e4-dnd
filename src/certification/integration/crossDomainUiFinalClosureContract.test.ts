import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
const artifacts=["e2e/cross-domain-player-lifecycle-v5.121D.spec.ts","scripts/audit-cross-domain-ui-final-closure-v5-121D.mjs","certification-reports/cross-domain-ui-final-closure-v5.121D.json","certification-reports/cross-domain-ui-final-closure-v5.121D.md"];
describe("v5.121D cross-domain UI artifact contract",()=>{for(const path of artifacts)it(`${path} exists`,()=>expect(existsSync(path)).toBe(true));it("report has no blockers",()=>{const report=JSON.parse(readFileSync("certification-reports/cross-domain-ui-final-closure-v5.121D.json","utf8"));expect(report.releaseBlockers).toEqual([]);expect(report.physicalScenarios).toBe(8);});});
