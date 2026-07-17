import { describe, expect, it } from "vitest";
import items2014 from "../../../public/data/dnd_2014/items.json";
import items2024 from "../../../public/data/dnd_2024/items.json";
import { ITEM_EXPANSION_2014, ITEM_EXPANSION_2024 } from "./itemExpansion";
import type { DndItemData, RulesetData } from "./ruleset.types";
import { buildEquipmentMagicItemCoverageReport } from "./equipmentMagicItemFinalCoverage";
const ruleset=(id:"dnd_2014"|"dnd_2024", base:DndItemData[], expansion:DndItemData[]):RulesetData=>({id,name:id,classes:[],subclasses:[],races:[],backgrounds:[],feats:[],spells:[],items:[...base,...expansion.filter(x=>!base.some(y=>y.id===x.id))],monsters:[]});
describe("equipment final coverage real data",()=>{
 it("certifies 2014 item data without blockers",()=>{const r=buildEquipmentMagicItemCoverageReport(ruleset("dnd_2014",items2014 as DndItemData[],ITEM_EXPANSION_2014));expect(r.blockers).toEqual([]);expect(r.entries.length).toBeGreaterThan(100);});
 it("certifies 2024 item data without blockers",()=>{const r=buildEquipmentMagicItemCoverageReport(ruleset("dnd_2024",items2024 as DndItemData[],ITEM_EXPANSION_2024));expect(r.blockers).toEqual([]);expect(r.ready).toBe(true);});
});
