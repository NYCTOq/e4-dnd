export type SpellDamageRelation =
  | "normal"
  | "resistant"
  | "immune"
  | "vulnerable";

export function runtimeSpellAbilityModifier(score: number): number {
  return Math.floor((Math.floor(score) - 10) / 2);
}

export function runtimeSpellProficiencyBonus(level: number): number {
  const normalized = Math.min(20, Math.max(1, Math.floor(level)));
  return 2 + Math.floor((normalized - 1) / 4);
}

export function runtimeSpellSaveDc(
  characterLevel: number,
  abilityScore: number,
  bonus = 0,
): number {
  return 8 +
    runtimeSpellProficiencyBonus(characterLevel) +
    runtimeSpellAbilityModifier(abilityScore) +
    Math.floor(bonus);
}

export function runtimeSpellAttackBonus(
  characterLevel: number,
  abilityScore: number,
  bonus = 0,
): number {
  return runtimeSpellProficiencyBonus(characterLevel) +
    runtimeSpellAbilityModifier(abilityScore) +
    Math.floor(bonus);
}

export function runtimeCantripScalingDice(level: number): number {
  const normalized = Math.min(20, Math.max(1, Math.floor(level)));

  if (normalized >= 17) return 4;
  if (normalized >= 11) return 3;
  if (normalized >= 5) return 2;
  return 1;
}

export function runtimeUpcastDiceCount(
  baseDice: number,
  baseLevel: number,
  castLevel: number,
  dicePerLevel = 1,
): number {
  const extra = Math.max(
    0,
    Math.floor(castLevel) - Math.floor(baseLevel),
  );

  return Math.max(0, Math.floor(baseDice)) +
    extra * Math.max(0, Math.floor(dicePerLevel));
}

export function runtimeConsumeSpellSlot(
  used: number,
  maximum: number,
  amount = 1,
): number {
  const max = Math.max(0, Math.floor(maximum));
  const current = Math.min(max, Math.max(0, Math.floor(used)));

  return Math.min(
    max,
    current + Math.max(0, Math.floor(amount)),
  );
}

export function runtimeRestoreSpellSlot(
  used: number,
  maximum: number,
  amount = 1,
): number {
  const max = Math.max(0, Math.floor(maximum));
  const current = Math.min(max, Math.max(0, Math.floor(used)));

  return Math.max(
    0,
    current - Math.max(0, Math.floor(amount)),
  );
}

export function runtimeApplyDamageRelation(
  damage: number,
  relation: SpellDamageRelation,
): number {
  const value = Math.max(0, Math.floor(damage));

  switch (relation) {
    case "immune":
      return 0;
    case "resistant":
      return Math.floor(value / 2);
    case "vulnerable":
      return value * 2;
    default:
      return value;
  }
}

export function runtimeApplySavingThrowDamage(
  damage: number,
  success: boolean,
  onSuccess: "none" | "half" | "full",
): number {
  const value = Math.max(0, Math.floor(damage));

  if (!success) return value;
  if (onSuccess === "none") return 0;
  if (onSuccess === "half") return Math.floor(value / 2);

  return value;
}

export function runtimeApplyHealing(
  currentHp: number,
  maxHp: number,
  healing: number,
): number {
  const max = Math.max(0, Math.floor(maxHp));
  const current = Math.min(max, Math.max(0, Math.floor(currentHp)));

  return Math.min(
    max,
    current + Math.max(0, Math.floor(healing)),
  );
}

export function runtimeConcentrationAfterDamage(
  damage: number,
  constitutionSaveTotal: number,
): {
  dc: number;
  maintained: boolean;
} {
  const value = Math.max(0, Math.floor(damage));
  const dc = Math.max(10, Math.floor(value / 2));

  return {
    dc,
    maintained: Math.floor(constitutionSaveTotal) >= dc,
  };
}

export function runtimeCanCastWithSlot(
  spellLevel: number,
  castLevel: number,
  used: number,
  maximum: number,
): boolean {
  if (spellLevel === 0) return true;

  return (
    Math.floor(castLevel) >= Math.floor(spellLevel) &&
    Math.max(0, Math.floor(used)) < Math.max(0, Math.floor(maximum))
  );
}

export function runtimeResolveTargetCount(
  requested: number,
  maximum: number | null,
): number {
  const value = Math.max(0, Math.floor(requested));

  return maximum === null
    ? value
    : Math.min(value, Math.max(0, Math.floor(maximum)));
}

export function resolveSpellDamagePipeline(input: {
  rolledDamage: number;
  saveSucceeded: boolean;
  onSuccessfulSave: "none" | "half" | "full";
  relation: SpellDamageRelation;
}): number {
  const afterSave = runtimeApplySavingThrowDamage(
    input.rolledDamage,
    input.saveSucceeded,
    input.onSuccessfulSave,
  );

  return runtimeApplyDamageRelation(afterSave, input.relation);
}
