import { describe, expect, it } from "vitest";
import { makeCharacter } from "../../test/fixtures";
import { applyRestToCharacter, getDefaultRestOptions, restoreRestSnapshot } from "./restAutomation";

describe("rest automation", () => {
  it("long rest restores hp, slots, resources and half hit dice", () => {
    const character = makeCharacter({ currentHp: 4, maxHp: 20, tempHp: 5, exhaustion: 2, spellSlots: [{ level: 1, max: 4, used: 3 }], hitDice: [{ die: 8, max: 6, used: 5 }], resources: [{ id: "cd", name: "Channel Divinity", max: 2, used: 2, recovery: "short" }] });
    const result = applyRestToCharacter(character, "long", getDefaultRestOptions("long"));
    expect(result.character.currentHp).toBe(20); expect(result.character.tempHp).toBe(0); expect(result.character.spellSlots[0].used).toBe(0); expect(result.character.hitDice[0].used).toBe(2); expect(result.character.resources[0].used).toBe(0); expect(result.character.exhaustion).toBe(1);
  });
  it("short rest only restores short resources and optional healing", () => {
    const character = makeCharacter({ currentHp: 5, maxHp: 20, resources: [{ id: "short", name: "Second Wind", max: 2, used: 2, recovery: "short" }, { id: "long", name: "Daily Power", max: 1, used: 1, recovery: "long" }] });
    const result = applyRestToCharacter(character, "short", { ...getDefaultRestOptions("short"), shortRestHealing: 7 });
    expect(result.character.currentHp).toBe(12); expect(result.character.resources.map((item) => item.used)).toEqual([0, 1]);
  });
  it("rest snapshot restores previous data", () => {
    const original = makeCharacter({ id: "hero", currentHp: 3 }); const changed = { ...original, currentHp: 20 };
    const restored = restoreRestSnapshot([changed], { id: "rest", kind: "long", createdAt: "now", characterIds: ["hero"], summaries: [], before: [original] });
    expect(restored[0].currentHp).toBe(3);
  });
});

describe("Barbarian Rage recovery",()=>{
  it("restores only one 2024 Rage use on a Short Rest",()=>{
    const character=makeCharacter({resources:[{id:"rage",name:"Rage",max:4,used:3,recovery:"long",shortRecoveryAmount:1}]});
    expect(applyRestToCharacter(character,"short",getDefaultRestOptions("short")).character.resources[0].used).toBe(2);
  });
});
