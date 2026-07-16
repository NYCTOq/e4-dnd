import type { CharacterInventoryItem } from "../character/character.types";
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
export function recoverItemCharges(inventory: CharacterInventoryItem[], items: readonly DndItemData[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return inventory.map((entry) => itemMap.get(entry.itemId)?.chargeRecovery ? { ...entry, chargesUsed: 0 } : entry);
}
