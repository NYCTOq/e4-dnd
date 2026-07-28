import { describe, expect, it } from "vitest";
import { GOLDEN_CHARACTER_HUB_PROFILES, buildGoldenCharacterHubCheckpoints, buildGoldenCharacterHubProjections, buildGoldenCharacterHubReport } from "./characterHubGoldenIntegration";

describe("v5.122C golden character hub integration",()=>{
  it("covers four edition-aware golden character profiles",()=>{expect(GOLDEN_CHARACTER_HUB_PROFILES).toHaveLength(4);expect(new Set(GOLDEN_CHARACTER_HUB_PROFILES.map(p=>p.edition))).toEqual(new Set(["dnd_2014","dnd_2024"]));});
  for (const profile of GOLDEN_CHARACTER_HUB_PROFILES) {
    describe(profile.name,()=>{
      const checkpoints=buildGoldenCharacterHubCheckpoints(profile);
      it("runs six deterministic hub checkpoints",()=>expect(checkpoints).toHaveLength(6));
      it("keeps critical recovery above active play and level-up",()=>{const row=checkpoints.find(c=>c.id==="critical");expect(row).toBeDefined();expect(row?.input).toMatchObject({currentHp:0,pendingLevel:true,activePlay:true});});
      it("keeps active play above pending level-up",()=>{const row=checkpoints.find(c=>c.id==="active-play");expect(row?.input.pendingLevel).toBe(true);expect(row?.input.activePlay).toBe(true);});
      it("preserves profile identity across every checkpoint",()=>{for(const row of checkpoints){expect(row.input.characterId).toBe(profile.id);expect(row.input.maxHp).toBe(profile.maxHp);expect(row.input.level).toBe(profile.level);}});
    });
  }
  it("projects 72 dashboard/list/detail decisions",()=>expect(buildGoldenCharacterHubProjections()).toHaveLength(72));
  it("matches the canonical oracle with zero mismatches",()=>expect(buildGoldenCharacterHubReport()).toMatchObject({status:"GREEN",profileCount:4,checkpointCount:6,surfaceCount:3,projectionCount:72,mismatchCount:0,nextPackage:"v5.122D"}));
  it("preserves route continuity for every non-empty checkpoint",()=>{for(const row of buildGoldenCharacterHubProjections()){expect(row.actual.route).toContain(row.profile.id);}});
});
