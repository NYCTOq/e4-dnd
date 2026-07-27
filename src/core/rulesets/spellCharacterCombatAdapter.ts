import {
  runtimeApplyHealing,
  runtimeCanCastWithSlot,
  runtimeCantripScalingDice,
  runtimeConsumeSpellSlot,
  runtimeConcentrationAfterDamage,
  runtimeRestoreSpellSlot,
  runtimeSpellAttackBonus,
  runtimeSpellSaveDc,
} from "./spellRuntimeCombatRules";

export type SpellAbilityKey =
  | "intelligence"
  | "wisdom"
  | "charisma";

export type SpellSlotState = {
  level: number;
  max: number;
  used: number;
  pact?: boolean;
};

export type CharacterSpellEntry = {
  id: string;
  name?: string;
  level: number;
  concentration?: boolean;
  damageType?: string;
  healing?: boolean;
  [key: string]: unknown;
};

export type SpellCompatibleCharacter = Record<string, unknown> & {
  id?: string;
  name?: string;
  classId?: string;
  level?: number;
  currentHp?: number;
  maxHp?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  abilities?: Partial<Record<SpellAbilityKey, number>>;
  spellcastingAbility?: SpellAbilityKey;
  spellAttackBonus?: number;
  spellSaveDc?: number;
  spellSlots?: SpellSlotState[];
  pactSlots?: SpellSlotState[];
  spells?: CharacterSpellEntry[];
  concentrating?: boolean;
  concentrationSpellId?: string | null;
};

export type SpellRuntimeSnapshot = {
  characterLevel: number;
  ability: SpellAbilityKey;
  abilityScore: number;
  spellSaveDc: number;
  spellAttackBonus: number;
  cantripDice: number;
  spellSlots: SpellSlotState[];
  pactSlots: SpellSlotState[];
};

const int = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(value)
    : fallback;

export function resolveSpellcastingAbility(
  character: SpellCompatibleCharacter,
): SpellAbilityKey {
  if (character.spellcastingAbility) {
    return character.spellcastingAbility;
  }

  switch (String(character.classId ?? "").trim().toLowerCase()) {
    case "wizard":
    case "artificer":
      return "intelligence";
    case "cleric":
    case "druid":
    case "ranger":
      return "wisdom";
    default:
      return "charisma";
  }
}

export function resolveSpellAbilityScore(
  character: SpellCompatibleCharacter,
  ability = resolveSpellcastingAbility(character),
): number {
  const nested = character.abilities?.[ability];
  if (typeof nested === "number") return int(nested, 10);

  const direct = character[ability];
  return typeof direct === "number" ? int(direct, 10) : 10;
}

export function normalizeSpellSlots(
  slots: SpellSlotState[] | undefined,
  pact = false,
): SpellSlotState[] {
  if (!Array.isArray(slots)) return [];

  return slots
    .filter((slot) => slot && typeof slot.level === "number")
    .map((slot) => {
      const max = Math.max(0, int(slot.max));
      return {
        level: Math.max(0, int(slot.level)),
        max,
        used: Math.min(max, Math.max(0, int(slot.used))),
        ...(pact || slot.pact ? { pact: true } : {}),
      };
    })
    .sort((a, b) => a.level - b.level);
}

export function buildSpellRuntimeSnapshot(
  character: SpellCompatibleCharacter,
): SpellRuntimeSnapshot {
  const characterLevel = Math.min(
    20,
    Math.max(1, int(character.level, 1)),
  );
  const ability = resolveSpellcastingAbility(character);
  const abilityScore = resolveSpellAbilityScore(character, ability);

  return {
    characterLevel,
    ability,
    abilityScore,
    spellSaveDc:
      typeof character.spellSaveDc === "number"
        ? int(character.spellSaveDc)
        : runtimeSpellSaveDc(characterLevel, abilityScore),
    spellAttackBonus:
      typeof character.spellAttackBonus === "number"
        ? int(character.spellAttackBonus)
        : runtimeSpellAttackBonus(characterLevel, abilityScore),
    cantripDice: runtimeCantripScalingDice(characterLevel),
    spellSlots: normalizeSpellSlots(character.spellSlots),
    pactSlots: normalizeSpellSlots(character.pactSlots, true),
  };
}

export function canCharacterCastSpell(
  character: SpellCompatibleCharacter,
  spellLevel: number,
  castLevel: number,
  pact = false,
): boolean {
  if (spellLevel === 0) return true;

  const snapshot = buildSpellRuntimeSnapshot(character);
  const slots = pact ? snapshot.pactSlots : snapshot.spellSlots;
  const slot = slots.find((entry) => entry.level === castLevel);

  if (!slot) return false;

  return runtimeCanCastWithSlot(
    spellLevel,
    castLevel,
    slot.used,
    slot.max,
  );
}

export function spendCharacterSpellSlot<
  T extends SpellCompatibleCharacter,
>(
  character: T,
  castLevel: number,
  pact = false,
): T {
  const next = structuredClone(character);
  const key = pact ? "pactSlots" : "spellSlots";
  const slots = normalizeSpellSlots(
    next[key] as SpellSlotState[] | undefined,
    pact,
  );

  next[key] = slots.map((slot) =>
    slot.level === castLevel
      ? {
          ...slot,
          used: runtimeConsumeSpellSlot(slot.used, slot.max),
        }
      : slot,
  );

  return next;
}

export function restoreCharacterSpellSlot<
  T extends SpellCompatibleCharacter,
>(
  character: T,
  castLevel: number,
  pact = false,
): T {
  const next = structuredClone(character);
  const key = pact ? "pactSlots" : "spellSlots";
  const slots = normalizeSpellSlots(
    next[key] as SpellSlotState[] | undefined,
    pact,
  );

  next[key] = slots.map((slot) =>
    slot.level === castLevel
      ? {
          ...slot,
          used: runtimeRestoreSpellSlot(slot.used, slot.max),
        }
      : slot,
  );

  return next;
}

export function setCharacterConcentration<
  T extends SpellCompatibleCharacter,
>(
  character: T,
  spellId: string | null,
): T {
  return {
    ...structuredClone(character),
    concentrating: Boolean(spellId),
    concentrationSpellId: spellId,
  };
}

export function applyConcentrationDamage<
  T extends SpellCompatibleCharacter,
>(
  character: T,
  damage: number,
  constitutionSaveTotal: number,
): {
  character: T;
  dc: number;
  maintained: boolean;
} {
  const result = runtimeConcentrationAfterDamage(
    damage,
    constitutionSaveTotal,
  );

  return {
    character: result.maintained
      ? structuredClone(character)
      : setCharacterConcentration(character, null),
    ...result,
  };
}

export function applyHealingToSpellTarget<
  T extends SpellCompatibleCharacter,
>(
  target: T,
  healing: number,
): T {
  const next = structuredClone(target);
  const maxHp = Math.max(0, int(next.maxHp));
  const currentHp = Math.min(maxHp, Math.max(0, int(next.currentHp)));

  next.currentHp = runtimeApplyHealing(
    currentHp,
    maxHp,
    healing,
  );

  return next;
}

export function applyDamageToSpellTarget<
  T extends SpellCompatibleCharacter,
>(
  target: T,
  damage: number,
): T {
  const next = structuredClone(target);
  const maxHp = Math.max(0, int(next.maxHp));
  const currentHp = Math.min(maxHp, Math.max(0, int(next.currentHp)));

  next.currentHp = Math.max(
    0,
    currentHp - Math.max(0, int(damage)),
  );

  return next;
}

export function serializeSpellCompatibleCharacter(
  character: SpellCompatibleCharacter,
): string {
  return JSON.stringify(character);
}

export function deserializeSpellCompatibleCharacter<
  T extends SpellCompatibleCharacter,
>(payload: string): T {
  const parsed: unknown = JSON.parse(payload);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid spell-compatible character payload.");
  }

  return parsed as T;
}
