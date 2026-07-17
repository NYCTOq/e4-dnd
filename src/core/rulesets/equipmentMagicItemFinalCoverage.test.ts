import { describe, expect, it } from "vitest";
import type { DndItemData, RulesetData } from "./ruleset.types";
import { buildEquipmentMagicItemCoverageReport, certifyEquipmentItem, formatEquipmentMagicItemCoverageSummary, previewItemRuntime } from "./equipmentMagicItemFinalCoverage";
const item=(v:Partial<DndItemData>&Pick<DndItemData,"id"|"name"|"category">):DndItemData=>({cost:"",weight:0,description:"ok",...v});
const data=(items:DndItemData[]):RulesetData=>({id:"dnd_2014",name:"test",classes:[],subclasses:[],races:[],backgrounds:[],feats:[],spells:[],items,monsters:[]});
describe("equipment and magic item final coverage",()=>{
 it("certifies a normal weapon automatically",()=>{const arrow=item({id:"arrows",name:"Arrows",category:"ammunition"});const bow=item({id:"bow",name:"Bow",category:"weapon",damage:"1d8",damageType:"piercing",properties:["Ammunition"],range:"150/600"});expect(certifyEquipmentItem(bow,[bow,arrow])).toMatchObject({disposition:"automatic",blockers:[]});});
 it("blocks malformed charged items",()=>{const wand=item({id:"wand",name:"Wand",category:"gear",magical:true,charges:1,chargeCost:2});expect(certifyEquipmentItem(wand,[wand]).disposition).toBe("blocked");});
 it("keeps item spells and restoration guided",()=>{const staff=item({id:"staff",name:"Staff",category:"gear",magical:true,grantedSpellName:"Cure Wounds",charges:3,chargeRecovery:"daily",chargeCost:1});expect(certifyEquipmentItem(staff,[staff]).disposition).toBe("guided");});
 it("marks cursed items as table rulings",()=>{const ring=item({id:"ring",name:"Ring",category:"gear",magical:true,tags:["cursed"]});expect(certifyEquipmentItem(ring,[ring])).toMatchObject({disposition:"table-ruling"});});
 it("produces blockers for duplicate ids and missing ruleset data",()=>{const a=item({id:"x",name:"A",category:"gear"});const b=item({id:"x",name:"B",category:"gear"});expect(buildEquipmentMagicItemCoverageReport(data([a,b])).ready).toBe(false);expect(buildEquipmentMagicItemCoverageReport(null).blockers).toContain("Ruleset item data could not be loaded.");});
 it("previews item runtime and formats release summary",()=>{const potion=item({id:"p",name:"Potion",category:"gear",tags:["consumable"],healingFormula:"2d4+2"});expect(previewItemRuntime(potion,[{itemId:"p",quantity:1}], [potion]).healing).toBe("2d4+2");expect(formatEquipmentMagicItemCoverageSummary(buildEquipmentMagicItemCoverageReport(data([potion])))).toContain("Equipment coverage v5.7.0");});
});
