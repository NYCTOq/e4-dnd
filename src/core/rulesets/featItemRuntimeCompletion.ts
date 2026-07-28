import type { CharacterInventoryItem } from "../character/character.types";
import type { DndItemData } from "./ruleset.types";
import type { FeatAction } from "./advancedFeatRuntimeRules";

export type FeatUseState = { used: number; maximum: number; remaining: number; unlimited: boolean };

export function getFeatUseState(action: FeatAction, uses: Record<string, number>): FeatUseState {
  const unlimited = action.maxUses >= 99;
  const used = unlimited ? 0 : Math.min(action.maxUses, Math.max(0, uses[action.id] ?? 0));
  return { used, maximum: action.maxUses, remaining: unlimited ? action.maxUses : Math.max(0, action.maxUses - used), unlimited };
}

export function spendFeatUse(action: FeatAction, uses: Record<string, number>) {
  const state = getFeatUseState(action, uses);
  if (state.unlimited || state.remaining <= 0) return uses;
  return { ...uses, [action.id]: state.used + 1 };
}

export function recoverFeatUses(rest: "short" | "long", uses: Record<string, number>) {
  return rest === "long" ? {} : uses;
}

export type ItemChargeState = { maximum: number; used: number; remaining: number; ready: boolean; reason: string | null };

export function getItemChargeState(item: DndItemData, entry: CharacterInventoryItem | undefined): ItemChargeState | null {
  if (!item.charges) return null;
  const used = Math.min(item.charges, Math.max(0, entry?.chargesUsed ?? 0));
  const remaining = Math.max(0, item.charges - used);
  const attunementMissing = Boolean(item.requiresAttunement && !entry?.attuned);
  return {
    maximum: item.charges,
    used,
    remaining,
    ready: Boolean(entry && !attunementMissing && remaining >= (item.chargeCost ?? 1)),
    reason: !entry ? "Item envanterde değil." : attunementMissing ? "Önce attunement gerekli." : remaining < (item.chargeCost ?? 1) ? "Yeterli charge yok." : null,
  };
}

export function summarizeRecoveredCharges(before: CharacterInventoryItem[], after: CharacterInventoryItem[], items: readonly DndItemData[]) {
  const names = new Map(items.map((item) => [item.id, item.name]));
  const recovered: string[] = [];
  for (const next of after) {
    const previous = before.find((entry) => entry.itemId === next.itemId);
    const amount = Math.max(0, (previous?.chargesUsed ?? 0) - (next.chargesUsed ?? 0));
    if (amount > 0) recovered.push(`${names.get(next.itemId) ?? next.itemId} +${amount} charge`);
  }
  return recovered;
}
