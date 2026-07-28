export type ActionEconomyKind = "action" | "bonus-action" | "reaction" | "none";

export type GameplayGuardInput = {
  economy?: ActionEconomyKind;
  actionUsed?: boolean;
  bonusActionUsed?: boolean;
  reactionUsed?: boolean;
  blockedByCondition?: boolean;
  blockedByEffect?: boolean;
  resourceRemaining?: number;
  resourceCost?: number;
  slotRemaining?: number;
  requiresSlot?: boolean;
};

export type GameplayGuardResult = { allowed: true } | { allowed: false; reason: string };

export function evaluateGameplayGuard(input: GameplayGuardInput): GameplayGuardResult {
  if (input.blockedByCondition) return { allowed: false, reason: "Aktif condition bu işlemi engelliyor." };
  if (input.blockedByEffect) return { allowed: false, reason: "Aktif bir etki bu işlemi engelliyor." };

  if (input.economy === "action" && input.actionUsed) return { allowed: false, reason: "Bu tur Action zaten kullanıldı." };
  if (input.economy === "bonus-action" && input.bonusActionUsed) return { allowed: false, reason: "Bu tur Bonus Action zaten kullanıldı." };
  if (input.economy === "reaction" && input.reactionUsed) return { allowed: false, reason: "Reaction yeniden kullanıma hazır değil." };

  const cost = Math.max(0, Math.floor(input.resourceCost ?? 0));
  if (typeof input.resourceRemaining === "number" && input.resourceRemaining < cost) {
    return { allowed: false, reason: `Kaynak yetersiz: ${cost} gerekli, ${Math.max(0, input.resourceRemaining)} kaldı.` };
  }

  if (input.requiresSlot && (input.slotRemaining ?? 0) < 1) {
    return { allowed: false, reason: "Uygun büyü slotu kalmadı." };
  }

  return { allowed: true };
}

export function getCastingEconomy(castingTime: string): ActionEconomyKind {
  const normalized = castingTime.trim().toLocaleLowerCase("en-US");
  if (normalized.includes("bonus")) return "bonus-action";
  if (normalized.includes("reaction")) return "reaction";
  return "action";
}

export function getConcentrationSaveDc(damage: number): number {
  const normalizedDamage = Math.max(0, Math.floor(damage));
  return Math.max(10, Math.floor(normalizedDamage / 2));
}
