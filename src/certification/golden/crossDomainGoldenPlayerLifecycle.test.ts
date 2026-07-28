import { describe, expect, it } from "vitest";
import { createGoldenLifecycleCharacters, lifecycleIdentitySnapshot, runGoldenLifecycle } from "./crossDomainGoldenPlayerLifecycle";

const profiles=createGoldenLifecycleCharacters();
describe("v5.121C golden player lifecycle integration",()=>{
  it("covers both editions, martial, caster and multiclass",()=>{expect(profiles).toHaveLength(4);expect(new Set(profiles.map(p=>p.ruleset))).toEqual(new Set(["dnd_2014","dnd_2024"]));expect(profiles.some(p=>(p.classes?.length??0)>1)).toBe(true);expect(profiles.some(p=>(p.spellSlots?.length??0)>0)).toBe(true);});
  for(const profile of profiles) describe(profile.name,()=>{
    const lifecycle=runGoldenLifecycle(profile);
    it("runs seven deterministic checkpoints",()=>{expect(lifecycle.map(x=>x.checkpoint)).toEqual(["created","edited","leveled","played","short-rested","long-rested","restored"]);});
    it("preserves immutable source",()=>{expect(profile.revision).toBe(1);expect(profile.name).not.toContain("Edited");});
    it("edit and level-up advance revision and level",()=>{const sourceLevel=profile.level??0;expect(lifecycle[1].character.revision).toBe(2);expect(lifecycle[2].character.level).toBe(sourceLevel+1);});
    it("play spends HP or resources without destroying identity",()=>{const leveledHp=lifecycle[2].character.currentHp??lifecycle[2].character.maxHp??1;expect(lifecycle[3].character.currentHp).toBeLessThan(leveledHp);expect(lifecycleIdentitySnapshot(lifecycle[3].character)).toEqual(lifecycleIdentitySnapshot(profile));});
    it("long rest restores HP, death saves and slots",()=>{const rested=lifecycle[5].character;expect(rested.currentHp).toBe(rested.maxHp);expect(rested.deathSaves).toEqual({successes:0,failures:0});expect((rested.spellSlots??[]).every(slot=>slot.used===0)).toBe(true);});
    it("backup restore is exact",()=>{expect(lifecycle[6].character).toEqual(lifecycle[5].character);});
    it("identity, catalog selections and inventory survive all checkpoints",()=>{const expected=lifecycleIdentitySnapshot(profile);for(const snapshot of lifecycle) expect(lifecycleIdentitySnapshot(snapshot.character)).toEqual(expected);});
  });
  it("produces 28 golden lifecycle checkpoints",()=>{expect(profiles.flatMap(runGoldenLifecycle)).toHaveLength(28);});
});
