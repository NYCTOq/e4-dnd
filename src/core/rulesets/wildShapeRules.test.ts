import { describe,expect,it } from "vitest";
import { getWildShapeForms,getWildShapeKnownCount,isWildShapeFormEligible } from "./wildShapeRules";
describe("wild shape rules",()=>{
  it("tracks 2024 known forms",()=>expect([2,4,8].map(level=>getWildShapeKnownCount("Druid",level,"dnd_2024"))).toEqual([4,6,8]));
  it("locks swim and fly by level",()=>{const forms=getWildShapeForms();expect(isWildShapeFormEligible(forms.find(x=>x.id==="crocodile")!,2,"dnd_2014","")).toBe(false);expect(isWildShapeFormEligible(forms.find(x=>x.id==="giant-eagle")!,8,"dnd_2014","")).toBe(true)});
  it("supports Moon Druid CR growth",()=>expect(isWildShapeFormEligible(getWildShapeForms().find(x=>x.id==="brown-bear")!,2,"dnd_2014","Circle of the Moon")).toBe(true));
});
