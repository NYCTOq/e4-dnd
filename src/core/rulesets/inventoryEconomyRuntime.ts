import type { Character, CharacterInventoryItem } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";

export type EconomyTransaction = { id: string; kind: "earn" | "spend"; amount: number; label: string; createdAt: string };
export type InventoryRuntimeIssue = { severity: "blocker" | "warning"; message: string };

const coin = (value: number) => Math.max(0, Math.round((Number.isFinite(value) ? value : 0) * 100) / 100);
export function getCarryingCapacity(strength: number) { return Math.max(0, Math.floor(strength || 0) * 15); }
export function getInventoryRuntimeWeight(inventory: CharacterInventoryItem[], items: DndItemData[]) {
  const map = new Map(items.map((item) => [item.id, item]));
  return inventory.reduce((total, entry) => total + Math.max(0, entry.quantity || 0) * Math.max(0, map.get(entry.itemId)?.weight ?? 0), 0);
}
export function normalizeInventoryStack(inventory: CharacterInventoryItem[]) {
  const merged = new Map<string, CharacterInventoryItem>();
  for (const entry of inventory) {
    const quantity = Math.max(0, Math.floor(entry.quantity || 0));
    if (!entry.itemId || quantity === 0) continue;
    const current = merged.get(entry.itemId);
    merged.set(entry.itemId, current ? { ...current, quantity: current.quantity + quantity, attuned: current.attuned || entry.attuned, chargesUsed: Math.max(current.chargesUsed ?? 0, entry.chargesUsed ?? 0) } : { ...entry, quantity });
  }
  return [...merged.values()];
}
export function applyGoldTransaction(gold: number, kind: EconomyTransaction["kind"], amount: number) {
  const safe = coin(amount);
  if (kind === "spend" && safe > gold) return { ok: false as const, gold, reason: "Yetersiz altın." };
  return { ok: true as const, gold: coin(kind === "earn" ? gold + safe : gold - safe) };
}
export function getInventoryEconomySnapshot(character: Character, items: DndItemData[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const inventory = normalizeInventoryStack(character.inventory);
  const weight = getInventoryRuntimeWeight(inventory, items);
  const capacity = getCarryingCapacity(character.abilities.str);
  const carriedIds = new Set(inventory.map((entry) => entry.itemId));
  const equippedIds = [character.equippedArmorId, character.equippedShieldId, ...character.equippedWeaponIds].filter((id): id is string => Boolean(id));
  const issues: InventoryRuntimeIssue[] = [];
  for (const id of equippedIds) if (!carriedIds.has(id)) issues.push({ severity: "blocker", message: `${itemMap.get(id)?.name ?? id} kuşanılmış görünüyor ama envanterde yok.` });
  const attuned = inventory.filter((entry) => entry.attuned).length;
  if (attuned > 3) issues.push({ severity: "blocker", message: `Attunement sınırı aşıldı: ${attuned}/3.` });
  if (weight > capacity) issues.push({ severity: "warning", message: `Taşıma kapasitesi aşıldı: ${weight.toFixed(1)}/${capacity} lb.` });
  const unknown = inventory.filter((entry) => !itemMap.has(entry.itemId));
  if (unknown.length) issues.push({ severity: "warning", message: `${unknown.length} envanter kaydı katalogda bulunamadı.` });
  const ammunition = inventory.filter((entry) => itemMap.get(entry.itemId)?.category === "ammunition").reduce((sum, entry) => sum + entry.quantity, 0);
  const consumables = inventory.filter((entry) => itemMap.get(entry.itemId)?.tags?.some((tag) => tag.toLowerCase() === "consumable")).reduce((sum, entry) => sum + entry.quantity, 0);
  return { inventory, weight, capacity, loadPercent: capacity ? Math.round((weight / capacity) * 100) : 0, attuned, ammunition, consumables, gold: coin(character.gold), issues, ready: !issues.some((issue) => issue.severity === "blocker") };
}
