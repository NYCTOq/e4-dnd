import type { CharacterInventoryItem, CharacterSpellSlot } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";

export const MAX_ATTUNED_ITEMS = 3;
export function getAttunedItemCount(inventory: CharacterInventoryItem[]) { return inventory.filter((entry) => entry.attuned).length; }
export function toggleItemAttunement(inventory: CharacterInventoryItem[], item: DndItemData) {
  if (!item.requiresAttunement) return inventory;
  const current = inventory.find((entry) => entry.itemId === item.id);
  if (!current || (!current.attuned && getAttunedItemCount(inventory) >= MAX_ATTUNED_ITEMS)) return inventory;
  return inventory.map((entry) => entry.itemId === item.id ? { ...entry, attuned: !entry.attuned } : entry);
}
export function spendItemCharge(inventory: CharacterInventoryItem[], item: DndItemData, amount = 1) {
  if (!item.charges) return inventory;
  return inventory.map((entry) => entry.itemId === item.id ? { ...entry, chargesUsed: Math.min(item.charges!, Math.max(0, entry.chargesUsed ?? 0) + Math.max(1, Math.floor(amount))) } : entry);
}
export function getChargeRecoveryAmount(recovery: string | undefined, maximum: number, random: () => number = Math.random) {
  if (!recovery) return 0;
  const match = recovery.toLowerCase().match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (!match) return recovery.toLowerCase().includes("daily") ? maximum : 0;
  let total = Number(match[3] ?? 0);
  for (let index = 0; index < Number(match[1]); index += 1) total += Math.floor(random() * Number(match[2])) + 1;
  return Math.min(maximum, total);
}
export function recoverItemCharges(inventory: CharacterInventoryItem[], items: readonly DndItemData[], random: () => number = Math.random) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return inventory.map((entry) => {
    const item = itemMap.get(entry.itemId);
    if (!item?.chargeRecovery || !item.charges) return entry;
    const recovered = getChargeRecoveryAmount(item.chargeRecovery, item.charges, random);
    return { ...entry, chargesUsed: Math.max(0, (entry.chargesUsed ?? 0) - recovered) };
  });
}
export function getAttunedMagicItemBonuses(inventory: CharacterInventoryItem[], items: readonly DndItemData[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return inventory.filter((entry) => entry.attuned).reduce((total, entry) => {
    const bonus = itemMap.get(entry.itemId)?.armorBonus ?? 0;
    return { armorClass: total.armorClass + bonus, savingThrows: total.savingThrows + bonus };
  }, { armorClass: 0, savingThrows: 0 });
}
export function recoverHighestSpentSpellSlot(slots: CharacterSpellSlot[], maximumLevel = 3) {
  const target = [...slots].filter((slot) => slot.level <= maximumLevel && slot.used > 0).sort((a, b) => b.level - a.level)[0];
  return target ? slots.map((slot) => slot.level === target.level ? { ...slot, used: slot.used - 1 } : slot) : slots;
}
