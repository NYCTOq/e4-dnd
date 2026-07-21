import { describe, expect, it } from "vitest";
import { getClassFeatureActions, getClassResources, mergeClassResources } from "./classFeatureEngine";

const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 18, cha: 16 };
describe("class feature engine", () => {
  it("scales class resources by level and ability", () => {
    expect(getClassResources("Sorcerer", 7, abilities, "dnd_2014")[0].max).toBe(7);
    expect(getClassResources("Bard", 5, abilities, "dnd_2014")[0]).toMatchObject({ max: 3, recovery: "short" });
  });
  it("preserves used values while increasing maximum", () => {
    expect(mergeClassResources([{ id: "rage", name: "Rage", max: 2, used: 2, recovery: "long" }], getClassResources("Barbarian", 6, abilities, "dnd_2014"))[0]).toMatchObject({ max: 4, used: 2 });
  });
  it("exposes sheet-ready actions with resource links", () => {
    expect(getClassFeatureActions("Fighter", 2, "dnd_2024").map((item) => item.resourceId)).toContain("action-surge");
    expect(getClassFeatureActions("Paladin", 3, "dnd_2024").map((item) => item.resourceId)).toContain("channel-divinity");
  });
  it("does not grant level-locked resources early",()=>{expect(getClassResources("Druid",1,abilities,"dnd_2014")).toEqual([]);expect(getClassResources("Cleric",1,abilities,"dnd_2024")).toEqual([])});
});
