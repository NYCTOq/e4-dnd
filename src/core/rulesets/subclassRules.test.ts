import { describe, expect, it } from "vitest";
import type { DndSubclassData } from "./ruleset.types";
import { getAlwaysPreparedSpells, getSubclassesForClass, getUnlockedSubclassFeatures, isSubclassAvailable } from "./subclassRules";
import type { DndSpellData } from "./ruleset.types";
const sample: DndSubclassData = { id:"life", name:"Life Domain", className:"Cleric", ruleset:"dnd_2014", selectionLevel:1, description:"", features:[{level:1,name:"A",summary:""},{level:6,name:"B",summary:""}] };
describe("subclass rules",()=>{
 it("filters by class",()=>expect(getSubclassesForClass([sample],"Cleric")).toHaveLength(1));
 it("returns unlocked features",()=>expect(getUnlockedSubclassFeatures(sample,5).map(x=>x.name)).toEqual(["A"]));
 it("checks selection level",()=>expect(isSubclassAvailable(sample,1)).toBe(true));
});

describe("always prepared subclass spells", () => {
  const life = { ...sample, bonusSpells: ["Bless", "Lesser Restoration"] };
  const spells = [{ id: "bless", name: "Bless", level: 1 }, { id: "lesser-restoration", name: "Lesser Restoration", level: 2 }] as DndSpellData[];
  it("unlocks bonus spells only up to the castable spell level", () => expect(getAlwaysPreparedSpells(life, 1, spells).map((spell) => spell.id)).toEqual(["bless"]));
});
