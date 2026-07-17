import { describe, expect, it } from "vitest";
import type { DndClassData, DndSubclassData, RulesetData } from "./ruleset.types";
import { buildClassSubclassRuntimeClosureReport, certifyClassRuntime, certifySubclassRuntime, formatClassSubclassRuntimeClosureSummary } from "./classSubclassRuntimeClosure";
const klass=(name="Fighter"):DndClassData=>({id:name.toLowerCase(),name,hitDie:10,primaryAbilities:["str"],savingThrows:["str","con"],spellcastingAbility:null,armorProficiencies:[],weaponProficiencies:[],skillChoices:{choose:2,from:[]},description:"x",subclassLevel:3,spellProgression:"none",levels:Array.from({length:20},(_,i)=>({level:i+1,proficiencyBonus:2,features:[i===0?"Second Wind":i===19?"Extra Attack capstone":`Feature ${i+1}`]}))});
const subclass=(feature="Combat Superiority",summary="Spend a superiority die as an action."):DndSubclassData=>({id:"battle-master",name:"Battle Master",className:"Fighter",ruleset:"dnd_2014",selectionLevel:3,description:"x",features:[{level:3,name:feature,summary}]});
const data=():RulesetData=>({id:"dnd_2014",name:"2014",classes:[klass()],subclasses:[subclass()],races:[],backgrounds:[],feats:[],spells:[],items:[],monsters:[]});
describe("class and subclass runtime closure",()=>{
 it("certifies dedicated class engines and level 20 progression",()=>expect(certifyClassRuntime(klass(),"dnd_2014")).toMatchObject({blocked:0,status:"needs-work"}));
 it("blocks classes without a dedicated runtime engine",()=>expect(certifyClassRuntime(klass("Mystic"),"dnd_2014").blocked).toBeGreaterThan(0));
 it("maps subclass actions and resources to automatic closure",()=>expect(certifySubclassRuntime(subclass()).entries[0]).toMatchObject({status:"automatic",mechanics:expect.arrayContaining(["action","resource"])}));
 it("keeps narrative subclass features as table rulings",()=>expect(certifySubclassRuntime(subclass("Dream Oracle","DM determines a narrative divination vision.")).entries[0].status).toBe("table-ruling"));
 it("blocks incomplete subclass feature metadata",()=>expect(certifySubclassRuntime(subclass("Broken"," ")).status).toBe("blocked"));
 it("builds release-friendly aggregate reports",()=>{const report=buildClassSubclassRuntimeClosureReport(data());expect(report.classes).toHaveLength(1);expect(report.subclasses).toHaveLength(1);expect(formatClassSubclassRuntimeClosureSummary(report)).toContain("1 class")});
});
