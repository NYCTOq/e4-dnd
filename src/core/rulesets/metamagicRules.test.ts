import { describe, expect, it } from "vitest";
import { getMetamagicChoiceCount, getMetamagicOptions } from "./metamagicRules";
describe("metamagic rules",()=>{
 it("unlocks 2014 metamagic at level three",()=>{expect(getMetamagicChoiceCount("Sorcerer",2,"dnd_2014")).toBe(0);expect(getMetamagicChoiceCount("Sorcerer",3,"dnd_2014")).toBe(2);});
 it("adds choices at levels ten and seventeen",()=>{expect(getMetamagicChoiceCount("Sorcerer",10,"dnd_2014")).toBe(3);expect(getMetamagicChoiceCount("Sorcerer",17,"dnd_2014")).toBe(4);});
 it("provides costs and original summaries",()=>expect(getMetamagicOptions("dnd_2014").every(item=>item.cost>0&&item.summary.length>20)).toBe(true));
});
