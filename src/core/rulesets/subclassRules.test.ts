import { describe, expect, it } from "vitest";
import type { DndSubclassData } from "./ruleset.types";
import { getSubclassesForClass, getUnlockedSubclassFeatures, isSubclassAvailable } from "./subclassRules";
const sample: DndSubclassData = { id:"life", name:"Life Domain", className:"Cleric", ruleset:"dnd_2014", selectionLevel:1, description:"", features:[{level:1,name:"A",summary:""},{level:6,name:"B",summary:""}] };
describe("subclass rules",()=>{
 it("filters by class",()=>expect(getSubclassesForClass([sample],"Cleric")).toHaveLength(1));
 it("returns unlocked features",()=>expect(getUnlockedSubclassFeatures(sample,5).map(x=>x.name)).toEqual(["A"]));
 it("checks selection level",()=>expect(isSubclassAvailable(sample,1)).toBe(true));
});
