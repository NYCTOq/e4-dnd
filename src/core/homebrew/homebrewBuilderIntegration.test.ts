import { describe, expect, it } from "vitest";
import type { RulesetData } from "../rulesets/ruleset.types";
import type { HomebrewPackage } from "./homebrewFoundation";
import { getHomebrewBuilderCatalog, getHomebrewLevelUpOptions, getHomebrewSelectionLabel, mergeHomebrewIntoRuleset } from "./homebrewBuilderIntegration";

const base = {
  id: "dnd-2014", name: "2014", version: "1", classes: [], subclasses: [], races: [], backgrounds: [], feats: [], spells: [], items: [], monsters: [],
} as unknown as RulesetData;
const now = new Date().toISOString();
const pkg = {
  format: "e4-dnd-homebrew", schemaVersion: 1, id: "pkg", name: "Test", version: "1", createdAt: now,
  entities: [
    { schemaVersion: 1, type: "class", id: "blood-mage", name: "Blood Mage", tags: [], createdAt: now, updatedAt: now, payload: { id: "blood-mage", name: "Blood Mage", hitDie: 8, levels: Array.from({length:20},(_,i)=>({level:i+1,features:[]})) } },
    { schemaVersion: 1, type: "subclass", id: "crimson-order", name: "Crimson Order", tags: [], createdAt: now, updatedAt: now, payload: { id: "crimson-order", name: "Crimson Order", className: "Blood Mage", selectionLevel: 3, features: [] } },
    { schemaVersion: 1, type: "species", id: "sandborn", name: "Sandborn", tags: [], createdAt: now, updatedAt: now, payload: { id: "sandborn", name: "Sandborn", speed: 30, traits: [] } },
    { schemaVersion: 1, type: "background", id: "wanderer", name: "Wanderer", tags: [], createdAt: now, updatedAt: now, payload: { id: "wanderer", name: "Wanderer", skillProficiencies: [] } },
    { schemaVersion: 1, type: "feat", id: "blood-gift", name: "Blood Gift", tags: [], createdAt: now, updatedAt: now, payload: { id: "blood-gift", name: "Blood Gift", description: "Gift", category: "general" } },
  ],
} as unknown as HomebrewPackage;

describe("homebrew builder integration", () => {
  it("indexes builder entity families", () => expect(getHomebrewBuilderCatalog([pkg]).classes[0]?.id).toBe("blood-mage"));
  it("merges class, subclass, species, background and feat payloads", () => { const merged=mergeHomebrewIntoRuleset(base,[pkg])!; expect([merged.classes.length,merged.subclasses.length,merged.races.length,merged.backgrounds.length,merged.feats.length]).toEqual([1,1,1,1,1]); });
  it("replaces duplicate ids instead of duplicating options", () => { const seeded={...base,classes:[{...(pkg.entities[0] as any).payload,name:"Old"}]} as RulesetData; expect(mergeHomebrewIntoRuleset(seeded,[pkg])?.classes).toHaveLength(1); });
  it("exposes homebrew classes and feats to level-up", () => { const options=getHomebrewLevelUpOptions(base,[pkg]); expect(options.classes[0]?.name).toBe("Blood Mage"); expect(options.feats[0]?.name).toBe("Blood Gift"); });
  it("marks homebrew options in user-facing labels", () => expect(getHomebrewSelectionLabel("blood-mage","Blood Mage",[pkg])).toContain("Homebrew"));
  it("keeps base ruleset unchanged when no packages exist", () => expect(mergeHomebrewIntoRuleset(base,[])?.classes).toEqual([]));
});
