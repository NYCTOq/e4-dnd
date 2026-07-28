import type { CharacterSpellEffect, RulesetId } from "../character/character.types";
import type { DndSpellData } from "./ruleset.types";
import { resolveGlobalSpell } from "./globalSpellRuntime";
import {
  canCharacterCastSpell,
  normalizeSpellSlots,
  setCharacterConcentration,
  spendCharacterSpellSlot,
  type SpellCompatibleCharacter,
  type SpellSlotState,
} from "./spellCharacterCombatAdapter";

export type SpellCastFailure = "invalid-cast-level" | "slot-unavailable";

export type SpellCastTransaction<T extends SpellCompatibleCharacter> =
  | { ok: false; reason: SpellCastFailure; character: T }
  | {
      ok: true;
      character: T;
      rolled: number | null;
      resolved: number | null;
      perTarget: number[];
      effect: CharacterSpellEffect | null;
      replacedConcentration: boolean;
    };

export function executeSpellCast<T extends SpellCompatibleCharacter>(input: {
  character: T;
  spell: DndSpellData;
  castLevel?: number;
  pact?: boolean;
  ruleset?: RulesetId;
  saveSucceeded?: boolean;
  targetCount?: number;
  random?: () => number;
  spellcastingAbilityModifier?: number;
}): SpellCastTransaction<T> {
  const castLevel = input.castLevel ?? input.spell.level;
  if (castLevel < input.spell.level) {
    return { ok: false, reason: "invalid-cast-level", character: structuredClone(input.character) };
  }
  if (!canCharacterCastSpell(input.character, input.spell.level, castLevel, Boolean(input.pact))) {
    return { ok: false, reason: "slot-unavailable", character: structuredClone(input.character) };
  }

  let next = input.spell.level === 0
    ? structuredClone(input.character)
    : spendCharacterSpellSlot(input.character, castLevel, Boolean(input.pact));
  const replacedConcentration = Boolean(input.spell.concentration && next.concentrating);
  if (input.spell.concentration) next = setCharacterConcentration(next, input.spell.id);

  const outcome = resolveGlobalSpell({
    spell: input.spell,
    characterLevel: Math.max(1, Math.floor(Number(input.character.level ?? 1))),
    slotLevel: castLevel,
    currentEffects: Array.isArray((input.character as { spellEffects?: CharacterSpellEffect[] }).spellEffects)
      ? (input.character as { spellEffects?: CharacterSpellEffect[] }).spellEffects
      : [],
    saveSucceeded: input.saveSucceeded,
    targetCount: input.targetCount,
    random: input.random,
    spellcastingAbilityModifier: input.spellcastingAbilityModifier,
    ruleset: input.ruleset,
  });

  if (outcome.effect) {
    (next as { spellEffects?: CharacterSpellEffect[] }).spellEffects = outcome.nextEffects;
  }

  return {
    ok: true,
    character: next,
    rolled: outcome.rolled,
    resolved: outcome.resolved,
    perTarget: outcome.perTarget,
    effect: outcome.effect,
    replacedConcentration,
  };
}

export function advanceSpellEffectRounds(effects: CharacterSpellEffect[], rounds = 1): CharacterSpellEffect[] {
  const step = Math.max(0, Math.floor(rounds));
  return effects
    .map((effect) => effect.remainingRounds === null
      ? effect
      : { ...effect, remainingRounds: Math.max(0, effect.remainingRounds - step) })
    .filter((effect) => effect.remainingRounds === null || effect.remainingRounds > 0);
}

function restoreSlots(slots: SpellSlotState[] | undefined): SpellSlotState[] {
  return normalizeSpellSlots(slots).map((slot) => ({ ...slot, used: 0 }));
}

export function recoverSpellcastingResources<T extends SpellCompatibleCharacter>(character: T, rest: "short" | "long"): T {
  const next = structuredClone(character);
  if (rest === "long") next.spellSlots = restoreSlots(next.spellSlots);
  next.pactSlots = restoreSlots(next.pactSlots).map((slot) => ({ ...slot, pact: true }));
  return next;
}

export function applySpellDamage<T extends SpellCompatibleCharacter>(character: T, damage: number): T {
  const next = structuredClone(character);
  next.currentHp = Math.max(0, Math.floor(Number(next.currentHp ?? 0)) - Math.max(0, Math.floor(damage)));
  return next;
}

export function applySpellHealing<T extends SpellCompatibleCharacter>(character: T, healing: number): T {
  const next = structuredClone(character);
  const maxHp = Math.max(0, Math.floor(Number(next.maxHp ?? 0)));
  next.currentHp = Math.min(maxHp, Math.max(0, Math.floor(Number(next.currentHp ?? 0))) + Math.max(0, Math.floor(healing)));
  return next;
}
