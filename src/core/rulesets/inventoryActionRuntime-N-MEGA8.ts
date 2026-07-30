import type { Character, CharacterInventoryItem } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";
import { consumeInventoryItem, createItemEffect, getItemHealingFormula, isConsumableItem } from "./itemUseRules";
import { rollFormula } from "./spellResolution";

export type InventoryActionResult =
  | { ok: true; character: Character; message: string }
  | { ok: false; character: Character; reason: string };

function copy(character: Character, patch: Partial<Character>): Character {
  return { ...character, ...patch, updatedAt: new Date().toISOString() };
}

function stack(inventory: CharacterInventoryItem[], itemId: string) {
  return inventory.find((entry) => entry.itemId === itemId);
}

export function addInventoryItem(character: Character, itemId: string, quantity = 1): InventoryActionResult {
  const amount = Math.max(1, Math.floor(quantity));
  if (!itemId) return { ok: false, character, reason: "Eşya seçilmedi." };
  const current = stack(character.inventory, itemId);
  const inventory = current
    ? character.inventory.map((entry) => entry.itemId === itemId ? { ...entry, quantity: entry.quantity + amount } : entry)
    : [...character.inventory, { itemId, quantity: amount }];
  return { ok: true, character: copy(character, { inventory }), message: `${amount} eşya envantere eklendi.` };
}

export function setInventoryQuantity(character: Character, itemId: string, quantity: number): InventoryActionResult {
  const amount = Math.max(0, Math.floor(quantity));
  if (!stack(character.inventory, itemId)) return { ok: false, character, reason: "Eşya envanterde yok." };
  const inventory = amount === 0
    ? character.inventory.filter((entry) => entry.itemId !== itemId)
    : character.inventory.map((entry) => entry.itemId === itemId ? { ...entry, quantity: amount } : entry);
  const removed = amount === 0;
  return { ok: true, character: copy(character, {
    inventory,
    equippedArmorId: removed && character.equippedArmorId === itemId ? null : character.equippedArmorId,
    equippedShieldId: removed && character.equippedShieldId === itemId ? null : character.equippedShieldId,
    equippedWeaponIds: removed ? character.equippedWeaponIds.filter((id) => id !== itemId) : character.equippedWeaponIds,
  }), message: removed ? "Eşya envanterden kaldırıldı." : `Adet ${amount} olarak güncellendi.` };
}

export function equipInventoryItem(character: Character, item: DndItemData): InventoryActionResult {
  if (!stack(character.inventory, item.id)) return { ok: false, character, reason: "Kuşanmak için eşya envanterde olmalı." };
  if (item.requiresAttunement && !stack(character.inventory, item.id)?.attuned) return { ok: false, character, reason: "Bu eşya kuşanmadan önce attunement gerektiriyor." };
  if (item.category === "armor") return { ok: true, character: copy(character, { equippedArmorId: item.id }), message: `${item.name} zırh olarak kuşanıldı.` };
  if (item.category === "shield") return { ok: true, character: copy(character, { equippedShieldId: item.id }), message: `${item.name} kalkan olarak kuşanıldı.` };
  if (item.category === "weapon") {
    if (character.equippedWeaponIds.includes(item.id)) return { ok: false, character, reason: "Silah zaten kuşanılmış." };
    if (character.equippedWeaponIds.length >= 2) return { ok: false, character, reason: "Aynı anda en fazla iki silah hazır tutulabilir." };
    return { ok: true, character: copy(character, { equippedWeaponIds: [...character.equippedWeaponIds, item.id] }), message: `${item.name} silah olarak hazırlandı.` };
  }
  return { ok: false, character, reason: "Bu eşya kuşanılamaz." };
}

export function unequipInventoryItem(character: Character, itemId: string): InventoryActionResult {
  const changed = character.equippedArmorId === itemId || character.equippedShieldId === itemId || character.equippedWeaponIds.includes(itemId);
  if (!changed) return { ok: false, character, reason: "Eşya kuşanılmış değil." };
  return { ok: true, character: copy(character, {
    equippedArmorId: character.equippedArmorId === itemId ? null : character.equippedArmorId,
    equippedShieldId: character.equippedShieldId === itemId ? null : character.equippedShieldId,
    equippedWeaponIds: character.equippedWeaponIds.filter((id) => id !== itemId),
  }), message: "Eşya çıkarıldı." };
}

export function toggleItemAttunement(character: Character, item: DndItemData): InventoryActionResult {
  const current = stack(character.inventory, item.id);
  if (!current) return { ok: false, character, reason: "Eşya envanterde yok." };
  if (!item.requiresAttunement) return { ok: false, character, reason: "Bu eşya attunement gerektirmiyor." };
  if (!current.attuned && character.inventory.filter((entry) => entry.attuned).length >= 3) return { ok: false, character, reason: "Attunement sınırı 3/3 dolu." };
  const inventory = character.inventory.map((entry) => entry.itemId === item.id ? { ...entry, attuned: !entry.attuned } : entry);
  const becomingUnattuned = Boolean(current.attuned);
  return { ok: true, character: copy(character, {
    inventory,
    equippedArmorId: becomingUnattuned && character.equippedArmorId === item.id ? null : character.equippedArmorId,
    equippedShieldId: becomingUnattuned && character.equippedShieldId === item.id ? null : character.equippedShieldId,
    equippedWeaponIds: becomingUnattuned ? character.equippedWeaponIds.filter((id) => id !== item.id) : character.equippedWeaponIds,
  }), message: becomingUnattuned ? "Attunement kaldırıldı." : "Attunement tamamlandı." };
}

export function spendItemCharge(character: Character, item: DndItemData, amount = item.chargeCost ?? 1): InventoryActionResult {
  const current = stack(character.inventory, item.id);
  if (!current) return { ok: false, character, reason: "Eşya envanterde yok." };
  if (!item.charges) return { ok: false, character, reason: "Bu eşyanın charge kaydı yok." };
  if (item.requiresAttunement && !current.attuned) return { ok: false, character, reason: "Charge kullanımı için attunement gerekli." };
  const cost = Math.max(1, Math.floor(amount));
  const used = current.chargesUsed ?? 0;
  if (used + cost > item.charges) return { ok: false, character, reason: `Yetersiz charge: ${item.charges - used}/${cost}.` };
  const inventory = character.inventory.map((entry) => entry.itemId === item.id ? { ...entry, chargesUsed: used + cost } : entry);
  return { ok: true, character: copy(character, { inventory }), message: `${cost} charge harcandı.` };
}

export function recoverItemCharges(character: Character, item: DndItemData): InventoryActionResult {
  const current = stack(character.inventory, item.id);
  if (!current || !item.charges) return { ok: false, character, reason: "Yenilenecek charge bulunamadı." };
  const inventory = character.inventory.map((entry) => entry.itemId === item.id ? { ...entry, chargesUsed: 0 } : entry);
  return { ok: true, character: copy(character, { inventory }), message: `${item.charges} charge hazır.` };
}

export function useInventoryItem(character: Character, item: DndItemData, random: () => number = Math.random): InventoryActionResult {
  const current = stack(character.inventory, item.id);
  if (!current) return { ok: false, character, reason: "Eşya envanterde yok." };
  if (item.requiresAttunement && !current.attuned) return { ok: false, character, reason: "Bu eşya attunement gerektiriyor." };
  let next = character;
  const healingFormula = getItemHealingFormula(item);
  const messages: string[] = [];
  if (healingFormula) {
    const healing = rollFormula(healingFormula, random);
    next = copy(next, { currentHp: Math.min(next.maxHp, next.currentHp + healing) });
    messages.push(`${healing} HP iyileşti`);
  }
  const effect = createItemEffect(item);
  if (effect) {
    next = copy(next, { activeSpellEffects: [...(next.activeSpellEffects ?? []), effect] });
    messages.push("süreli etki başladı");
  }
  if (item.charges) {
    const charged = spendItemCharge(next, item);
    if (!charged.ok) return charged;
    next = charged.character;
    messages.push(`${item.chargeCost ?? 1} charge harcandı`);
  } else if (isConsumableItem(item)) {
    next = copy(next, { inventory: consumeInventoryItem(next.inventory, item.id) });
    messages.push("1 adet tüketildi");
  }
  if (!healingFormula && !effect && !item.charges && !isConsumableItem(item)) return { ok: false, character, reason: "Bu eşyanın otomatik kullanım etkisi tanımlı değil." };
  return { ok: true, character: next, message: messages.join(" • ") };
}
