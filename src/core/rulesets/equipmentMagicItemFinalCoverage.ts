import type { CharacterInventoryItem } from "../character/character.types";
import type { DndItemData, RulesetData } from "./ruleset.types";
import { getAttunementEligibility, getItemChargeState, getItemSpellCastingPlan, getWeaponPropertyRuntime } from "./equipmentClosureRuntime";
import { findAmmunitionId } from "./equipmentRuntimeRules";
import { getItemDamageProfile, getItemHealingFormula, getItemRestoration, isConsumableItem } from "./itemUseRules";

export type EquipmentCoverageDisposition = "automatic" | "guided" | "table-ruling" | "blocked";
export type EquipmentCoverageFamily = "weapon" | "armor" | "ammunition" | "consumable" | "attunement" | "charges" | "item-spell" | "restoration" | "passive-magic" | "gear";
export type EquipmentCoverageEntry = { itemId:string; itemName:string; family:EquipmentCoverageFamily; disposition:EquipmentCoverageDisposition; reason:string; blockers:string[]; warnings:string[] };
export type EquipmentMagicItemCoverageReport = { version:string; ready:boolean; score:number; automatic:number; guided:number; manual:number; blocked:number; blockers:string[]; warnings:string[]; entries:EquipmentCoverageEntry[] };

const hasCurse = (item:DndItemData) => item.tags?.some(tag => /curse|cursed/i.test(tag)) ?? false;

function familyFor(item:DndItemData): EquipmentCoverageFamily {
  if (item.category === "weapon") return "weapon";
  if (item.category === "armor" || item.category === "shield") return "armor";
  if (item.category === "ammunition") return "ammunition";
  if (isConsumableItem(item)) return "consumable";
  if (item.grantedSpellName) return "item-spell";
  if (item.requiresAttunement) return "attunement";
  if (item.charges) return "charges";
  if (item.curesConditions?.length || item.clearsExhaustion || item.restoresHitDice) return "restoration";
  if (item.magical) return "passive-magic";
  return "gear";
}

export function certifyEquipmentItem(item:DndItemData, allItems:DndItemData[]):EquipmentCoverageEntry {
  const blockers:string[]=[]; const warnings:string[]=[];
  if (!item.id.trim() || !item.name.trim()) blockers.push("Item id/name missing.");
  if (!Number.isFinite(item.weight) || item.weight < 0) blockers.push("Invalid item weight.");
  if (!item.description.trim()) blockers.push("Item description missing.");
  if (item.category === "weapon") {
    if (!item.damage) blockers.push("Weapon damage formula missing.");
    if (!item.damageType) blockers.push("Weapon damage type missing.");
    const props=getWeaponPropertyRuntime(item);
    if (props.ammunition && !findAmmunitionId(item, allItems)) blockers.push("Matching ammunition entry missing.");
    if (item.mastery && !item.weaponCategory) warnings.push("Weapon mastery exists without weapon category.");
  }
  if (item.category === "armor" && item.armorClass == null && item.armorClassBonus == null) blockers.push("Armor class metadata missing.");
  if (item.requiresAttunement && !item.magical) blockers.push("Attunement item must be magical.");
  if (item.charges != null) {
    if (item.charges <= 0) blockers.push("Charge maximum must be positive.");
    if (!item.chargeRecovery) warnings.push("Charged item has no recharge policy.");
    if ((item.chargeCost ?? 1) > item.charges) blockers.push("Charge cost exceeds maximum charges.");
  }
  if (item.grantedSpellName && !item.magical) blockers.push("Granted spell item must be magical.");
  if (item.grantedSpellName && !item.charges && item.chargeCost) warnings.push("Item spell has a charge cost but no charge pool.");
  if (item.itemDamageFormula && !item.extraDamageType && !item.damageType) blockers.push("Item damage type missing.");
  if (item.itemSaveDc && !item.itemSaveAbility) blockers.push("Item save DC requires a save ability.");
  if (item.healingFormula && !getItemHealingFormula(item)) blockers.push("Healing formula is invalid.");
  if (item.curesConditions?.length || item.clearsExhaustion || item.restoresHitDice) getItemRestoration(item);
  if (hasCurse(item)) warnings.push("Curse removal remains a guided table decision.");
  const family=familyFor(item);
  let disposition:EquipmentCoverageDisposition="automatic";
  let reason="Shared equipment runtime resolves this item family.";
  if (blockers.length) { disposition="blocked"; reason="Required runtime metadata is incomplete."; }
  else if (hasCurse(item) || item.id === "bag-of-holding") { disposition="table-ruling"; reason="Narrative or extradimensional edge cases require table adjudication."; }
  else if (family === "item-spell" || family === "restoration" || item.itemDamageFormula) { disposition="guided"; reason="Play Mode can resolve the mechanics after target/save/condition selection."; }
  return { itemId:item.id,itemName:item.name,family,disposition,reason,blockers,warnings };
}

export function buildEquipmentMagicItemCoverageReport(data:RulesetData|null, version="5.7.0"):EquipmentMagicItemCoverageReport {
  if (!data) return {version,ready:false,score:0,automatic:0,guided:0,manual:0,blocked:1,blockers:["Ruleset item data could not be loaded."],warnings:[],entries:[]};
  const ids=new Set<string>(); const duplicateBlockers:string[]=[];
  for (const item of data.items) { if (ids.has(item.id)) duplicateBlockers.push(`Duplicate item id: ${item.id}`); ids.add(item.id); }
  const entries=data.items.map(item=>certifyEquipmentItem(item,data.items));
  const blockers=[...duplicateBlockers,...entries.flatMap(e=>e.blockers.map(b=>`${e.itemName}: ${b}`))];
  const warnings=entries.flatMap(e=>e.warnings.map(w=>`${e.itemName}: ${w}`));
  const count=(d:EquipmentCoverageDisposition)=>entries.filter(e=>e.disposition===d).length;
  const automatic=count("automatic"), guided=count("guided"), manual=count("table-ruling"), blocked=count("blocked");
  const score=entries.length ? Math.round(((automatic + guided*.8 + manual*.5)/entries.length)*100) : 0;
  return {version,ready:blockers.length===0,score,automatic,guided,manual,blocked,blockers,warnings,entries};
}

export function previewItemRuntime(item:DndItemData, inventory:CharacterInventoryItem[], _allItems:DndItemData[], spellSaveDc=10, spellAttackBonus=2) {
  return {
    attunement:getAttunementEligibility(inventory,item),
    charges:getItemChargeState(inventory,item),
    spell:item.grantedSpellName?getItemSpellCastingPlan(item,spellSaveDc,spellAttackBonus):null,
    damage:getItemDamageProfile(item),
    healing:getItemHealingFormula(item),
    restoration:getItemRestoration(item),
  };
}

export function formatEquipmentMagicItemCoverageSummary(report:EquipmentMagicItemCoverageReport){
  return `Equipment coverage v${report.version} · ${report.ready?"READY":"BLOCKED"} · ${report.score}% · ${report.automatic} automatic · ${report.guided} guided · ${report.manual} table-ruling · ${report.blocked} blocked`;
}
