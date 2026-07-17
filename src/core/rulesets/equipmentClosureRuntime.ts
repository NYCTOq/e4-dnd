import type { CharacterInventoryItem } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";
import { getAttunedItemCount, MAX_ATTUNED_ITEMS } from "./magicItemRules";
import { getCarryingCapacity, getEncumbrance, getInventoryWeight } from "./equipmentRuntimeRules";

export type WeaponPropertyRuntime = {
  ammunition: boolean;
  finesse: boolean;
  heavy: boolean;
  light: boolean;
  loading: boolean;
  reach: boolean;
  thrown: boolean;
  twoHanded: boolean;
  versatile: string | null;
  range: string | null;
};

export function getWeaponPropertyRuntime(item: DndItemData): WeaponPropertyRuntime {
  const values = (item.properties ?? []).map((value) => value.toLowerCase());
  const has = (pattern: RegExp) => values.some((value) => pattern.test(value));
  const versatile = values.find((value) => value.startsWith("versatile"))?.match(/\(([^)]+)\)/)?.[1] ?? null;
  return {
    ammunition: has(/ammunition/), finesse: has(/finesse/), heavy: has(/heavy/), light: has(/light/),
    loading: has(/loading/), reach: has(/reach/), thrown: has(/thrown/), twoHanded: has(/two[- ]handed/),
    versatile, range: item.range ?? null,
  };
}

export function addInventoryEntries(inventory: CharacterInventoryItem[], additions: Array<{ itemId: string; quantity: number }>) {
  const totals = new Map(inventory.map((entry) => [entry.itemId, { ...entry }]));
  for (const addition of additions) {
    if (addition.quantity <= 0) continue;
    const current = totals.get(addition.itemId);
    totals.set(addition.itemId, current ? { ...current, quantity: current.quantity + addition.quantity } : { itemId: addition.itemId, quantity: addition.quantity });
  }
  return [...totals.values()];
}

export function expandPackIntoInventory(inventory: CharacterInventoryItem[], pack: DndItemData, quantity = 1) {
  if (pack.category !== "pack" || !pack.contents?.length) return inventory;
  const multiplier = Math.max(1, Math.floor(quantity));
  return addInventoryEntries(inventory, pack.contents.map((entry) => ({ itemId: entry.itemId, quantity: entry.quantity * multiplier })));
}

export function getAttunementEligibility(inventory: CharacterInventoryItem[], item: DndItemData) {
  const entry = inventory.find((candidate) => candidate.itemId === item.id);
  const count = getAttunedItemCount(inventory);
  if (!item.requiresAttunement) return { allowed: false, reason: "Bu eşya attunement gerektirmiyor.", count, limit: MAX_ATTUNED_ITEMS };
  if (!entry) return { allowed: false, reason: "Eşya envanterde değil.", count, limit: MAX_ATTUNED_ITEMS };
  if (!entry.attuned && count >= MAX_ATTUNED_ITEMS) return { allowed: false, reason: "Attunement sınırı dolu.", count, limit: MAX_ATTUNED_ITEMS };
  return { allowed: true, reason: null, count, limit: MAX_ATTUNED_ITEMS };
}

export function getItemChargeState(inventory: CharacterInventoryItem[], item: DndItemData) {
  const used = inventory.find((entry) => entry.itemId === item.id)?.chargesUsed ?? 0;
  const maximum = item.charges ?? 0;
  const remaining = Math.max(0, maximum - used);
  const cost = Math.max(1, item.chargeCost ?? 1);
  return { maximum, used, remaining, cost, canUse: maximum === 0 || remaining >= cost };
}

export function getItemSpellCastingPlan(item: DndItemData, characterSpellSaveDc: number, characterSpellAttackBonus: number) {
  return {
    spellName: item.grantedSpellName ?? null,
    chargeCost: Math.max(0, item.chargeCost ?? 0),
    saveDc: item.itemSaveDc ?? characterSpellSaveDc,
    attackBonus: item.attackBonus ?? characterSpellAttackBonus,
    requiresAttunement: Boolean(item.requiresAttunement),
    cursed: item.tags?.some((tag) => /curse|cursed/i.test(tag)) ?? false,
  };
}

export function getEquipmentLoadSummary(strength: number, inventory: CharacterInventoryItem[], items: DndItemData[]) {
  const weight = getInventoryWeight(inventory, items);
  const capacity = getCarryingCapacity(strength);
  const encumbrance = getEncumbrance(strength, weight);
  return { ...encumbrance, remainingCapacity: Math.max(0, capacity - weight) };
}
