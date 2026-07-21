import type { CharacterDraft } from "../character/character.types";
import { findAmmunitionId, getEquipmentLegality, getInventoryWeight, getEncumbrance } from "./equipmentRuntimeRules";
import type { DndItemData, RulesetData } from "./ruleset.types";

export type LevelOneEquipmentReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function getInventoryQuantity(draft: CharacterDraft, itemId: string) {
  return draft.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}

function describeItem(item: DndItemData | undefined, fallback: string) {
  return item?.name ?? fallback;
}

export function getLevelOneEquipmentReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneEquipmentReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden ekipman hazırlığı doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const classData = rulesetData.classes.find((candidate) => candidate.name === draft.className) ?? null;
  if (!classData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Class seçilmeden başlangıç ekipmanı doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const itemMap = new Map(rulesetData.items.map((item) => [item.id, item]));
  const positiveInventory = draft.inventory.filter((entry) => entry.quantity > 0);
  const inventoryIds = new Set(positiveInventory.map((entry) => entry.itemId));
  const equippedIds = unique([draft.equippedArmorId, draft.equippedShieldId, ...(draft.equippedWeaponIds ?? [])]);
  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const hasStartingSource = positiveInventory.length > 0 || draft.gold > 0;
  checks.push(hasStartingSource);
  if (!hasStartingSource) blockers.push("Başlangıç ekipmanı veya başlangıç altını bulunmalı.");
  if (!positiveInventory.length && draft.gold > 0) notices.push("Karakter altınla başlıyor; ilk oyun öncesi ekipman alışverişi tamamlanmalı.");
  summary.push(positiveInventory.length ? `${positiveInventory.length} envanter kaydı` : `${draft.gold} gp başlangıç altını`);

  const missingInventoryItems = positiveInventory.filter((entry) => !itemMap.has(entry.itemId));
  const catalogValid = missingInventoryItems.length === 0;
  checks.push(catalogValid);
  if (!catalogValid) blockers.push(`${missingInventoryItems.length} envanter kaydı eşya kataloğunda bulunmuyor.`);

  const staleEquippedIds = equippedIds.filter((itemId) => !inventoryIds.has(itemId) || !itemMap.has(itemId));
  const equippedReferencesValid = staleEquippedIds.length === 0;
  checks.push(equippedReferencesValid);
  if (!equippedReferencesValid) blockers.push(`${staleEquippedIds.length} kuşanılmış eşya envanterde veya katalogda bulunmuyor.`);

  const equippedItems = equippedIds.map((itemId) => itemMap.get(itemId)).filter((item): item is DndItemData => Boolean(item));
  const legalityIssues = equippedItems.flatMap((item) => {
    const legality = getEquipmentLegality(item, [classData], draft.abilities);
    return legality.issues.map((issue) => `${item.name}: ${issue}`);
  });
  const equippedLegalityValid = legalityIssues.length === 0;
  checks.push(equippedLegalityValid);
  if (!equippedLegalityValid) blockers.push(...legalityIssues);

  const rangedWeapons = equippedItems.filter((item) => item.category === "weapon" && (Boolean(item.range) || item.properties?.some((value) => /ammunition/i.test(value))));
  const missingAmmoWeapons = rangedWeapons.filter((weapon) => {
    const ammoId = findAmmunitionId(weapon, rulesetData.items);
    return ammoId !== null && getInventoryQuantity(draft, ammoId) <= 0;
  });
  const ammoReady = missingAmmoWeapons.length === 0;
  checks.push(ammoReady);
  if (!ammoReady) blockers.push(`Mühimmat eksik: ${missingAmmoWeapons.map((item) => item.name).join(", ")}.`);

  const armor = draft.equippedArmorId ? itemMap.get(draft.equippedArmorId) : undefined;
  const shield = draft.equippedShieldId ? itemMap.get(draft.equippedShieldId) : undefined;
  const slotTypesValid = (!armor || armor.category === "armor") && (!shield || shield.category === "shield") && (draft.equippedWeaponIds ?? []).every((id) => itemMap.get(id)?.category === "weapon");
  checks.push(slotTypesValid);
  if (!slotTypesValid) blockers.push("Kuşanılmış eşyalardan biri yanlış ekipman slotunda bulunuyor.");

  const inventoryWeight = getInventoryWeight(positiveInventory, rulesetData.items);
  const encumbrance = getEncumbrance(draft.abilities.str, inventoryWeight);
  summary.push(`Yük ${inventoryWeight}/${encumbrance.capacity} lb`);
  if (encumbrance.overloaded) blockers.push("Taşınan ağırlık kapasitenin iki katını aşıyor.");
  else if (encumbrance.encumbered) notices.push("Taşınan ağırlık kapasiteyi aşıyor; hareket cezası uygulanabilir.");

  if (equippedItems.length) summary.push(`Kuşanılmış: ${equippedItems.map((item) => item.name).join(", ")}`);
  if (draft.equippedWeaponIds.length === 0) notices.push("Kuşanılmış silah yok; saldırı seçeneği Combat Readiness panelinde ayrıca değerlendirilir.");
  if (armor?.stealthDisadvantage) notices.push(`${describeItem(armor, "Zırh")} Stealth kontrollerinde Disadvantage uygular.`);

  return {
    applicable: true,
    ready: blockers.length === 0,
    blockers,
    notices,
    completedChecks: checks.filter(Boolean).length,
    totalChecks: checks.length,
    summary,
  };
}
