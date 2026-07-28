import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
const required=["src/core/character/characterHubActionability.ts","src/features/characters/CharacterHubActionLink.tsx","e2e/character-hub-actionability-v5.122D.spec.ts","scripts/audit-character-hub-ui-v5-122D.mjs","certification-reports/character-hub-ui-final-closure-v5.122D.json","certification-reports/character-hub-ui-final-closure-v5.122D.md"];
describe("v5.122D character hub UI artifact contract",()=>{
 for(const path of required) it(`${path} exists`,()=>expect(existsSync(path)).toBe(true));
 it("report has no blockers",()=>expect(JSON.parse(readFileSync("certification-reports/character-hub-ui-final-closure-v5.122D.json","utf8")).releaseBlockers).toEqual([]));
});
