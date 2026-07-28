import { describe, expect, it } from "vitest";
import fs from "node:fs";import path from "node:path";
const root=process.cwd();
const required=["src/certification/golden/crossDomainGoldenPlayerLifecycle.ts","src/certification/golden/crossDomainGoldenPlayerLifecycle.test.ts","scripts/generate-cross-domain-golden-lifecycle-v5-121C.mjs","certification-reports/cross-domain-golden-player-lifecycle-v5.121C.json","certification-reports/cross-domain-golden-player-lifecycle-v5.121C.md"];
describe("v5.121C golden lifecycle artifact contract",()=>{for(const rel of required)it(`${rel} exists`,()=>expect(fs.existsSync(path.join(root,rel))).toBe(true));it("release report has no blockers",()=>{const report=JSON.parse(fs.readFileSync(path.join(root,required[3]),"utf8"));expect(report.releaseBlockers).toEqual([]);expect(report.lifecycleCheckpoints).toBe(28);});});
