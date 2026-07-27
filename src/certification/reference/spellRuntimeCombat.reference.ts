export type SpellRulesetId = "dnd_2014" | "dnd_2024";
export type SpellAbility = "intelligence" | "wisdom" | "charisma";
export type DamageRelation = "normal" | "resistant" | "immune" | "vulnerable";

export function spellAbilityModifier(score: number): number {
  return Math.floor((Math.floor(score) - 10) / 2);
}

export function spellProficiencyBonus(level: number): number {
  const normalized = Math.min(20, Math.max(1, Math.floor(level)));
  return 2 + Math.floor((normalized - 1) / 4);
}

export function spellSaveDc(
  characterLevel: number,
  abilityScore: number,
  bonus = 0,
): number {
  return 8 +
    spellProficiencyBonus(characterLevel) +
    spellAbilityModifier(abilityScore) +
    Math.floor(bonus);
}

export function spellAttackBonus(
  characterLevel: number,
  abilityScore: number,
  bonus = 0,
): number {
  return spellProficiencyBonus(characterLevel) +
    spellAbilityModifier(abilityScore) +
    Math.floor(bonus);
}

export function cantripScalingDice(characterLevel: number): number {
  const level = Math.min(20, Math.max(1, Math.floor(characterLevel)));

  if (level >= 17) return 4;
  if (level >= 11) return 3;
  if (level >= 5) return 2;
  return 1;
}

export function upcastDiceCount(
  baseDice: number,
  baseLevel: number,
  castLevel: number,
  dicePerLevel = 1,
): number {
  const upcastLevels = Math.max(
    0,
    Math.floor(castLevel) - Math.floor(baseLevel),
  );

  return Math.max(0, Math.floor(baseDice)) +
    upcastLevels * Math.max(0, Math.floor(dicePerLevel));
}

export function consumeSpellSlot(
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

export function restoreSpellSlot(
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

export function applyDamageRelation(
  damage: number,
  relation: DamageRelation,
): number {
  const value = Math.max(0, Math.floor(damage));

  if (relation === "immune") return 0;
  if (relation === "resistant") return Math.floor(value / 2);
  if (relation === "vulnerable") return value * 2;
  return value;
}

export function applySavingThrowDamage(
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

export function applyHealing(
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

export function concentrationAfterDamage(
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

export function canCastWithSlot(
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

export function resolveTargetCount(
  requested: number,
  maximum: number | null,
): number {
  const value = Math.max(0, Math.floor(requested));

  if (maximum === null) return value;

  return Math.min(
    value,
    Math.max(0, Math.floor(maximum)),
  );
}
