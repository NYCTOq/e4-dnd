import type { CharacterSpellEffect, CharacterSpellSlot } from "../character/character.types";
import type { DndSpellData, SpellResolutionType } from "./ruleset.types";
import { getSpellBehavior } from "./spellBehaviorRules";
import { addSpellEffect, createSpellEffect } from "./spellEffectRules";
import { getCastableSlotLevels, getSpellRollFormula, rollFormula } from "./spellResolution";

export type SaveDamageRule = "full" | "half" | "none";
export type SpellRuntimeTier = "automatic" | "assisted" | "manual";

export interface SpellRuntimePlan {
  spellId: string;
  slotLevel: number;
  resolution: SpellResolutionType;
  formula: string | null;
  targetCount: number;
  area: string | null;
  saveAbility: DndSpellData["saveAbility"] | null;
  saveDamageRule: SaveDamageRule;
  concentration: boolean;
  repeatSave: boolean;
  summoning: boolean;
  movement: boolean;
  reaction: boolean;
  ritual: boolean;
  materialWarning: string | null;
  tier: SpellRuntimeTier;
  guidance: string[];
}

export interface SpellRuntimeOutcome {
  rolled: number | null;
  resolved: number | null;
  perTarget: number[];
  effect: CharacterSpellEffect | null;
  nextEffects: CharacterSpellEffect[];
}

const hasText = (value: string | undefined, pattern: RegExp) => pattern.test(value ?? "");

export function getDefaultSpellSaveRule(spell: DndSpellData): SaveDamageRule {
  if (spell.attackType !== "saving-throw" && !spell.saveAbility) return "full";
  const text = `${spell.description} ${spell.higherLevels ?? ""}`;
  if (hasText(text, /half as much|half damage|yarısı|yarı hasar/i)) return "half";
  if (spell.damageDice && spell.level > 0 && !spell.conditionEffect) return "half";
  return "none";
}

export function resolveSpellSave(total: number, saveSucceeded: boolean, rule: SaveDamageRule) {
  if (!saveSucceeded) return Math.max(0, total);
  if (rule === "half") return Math.floor(Math.max(0, total) / 2);
  if (rule === "none") return 0;
  return Math.max(0, total);
}

export function resolveSpellHealing(currentHp: number, maxHp: number, healing: number) {
  const safeMax = Math.max(0, maxHp);
  const safeCurrent = Math.min(safeMax, Math.max(0, currentHp));
  const applied = Math.min(Math.max(0, healing), safeMax - safeCurrent);
  return { currentHp: safeCurrent + applied, applied, overheal: Math.max(0, healing - applied) };
}

export function getSpellRuntimePlan(spell: DndSpellData, characterLevel: number, slotLevel = spell.level): SpellRuntimePlan {
  const behavior = getSpellBehavior(spell, slotLevel);
  const formula = getSpellRollFormula(spell, characterLevel, slotLevel);
  const resolution = spell.attackType ?? (spell.saveAbility ? "saving-throw" : "automatic");
  const guidance: string[] = [];
  if (behavior.repeatSave) guidance.push("Hedef uygun tur sonunda saving throw'u tekrarlar.");
  if (behavior.summoning) guidance.push("Summon/companion istatistikleri ve komut ekonomisi masa üzerinde doğrulanır.");
  if (behavior.movement) guidance.push("Varış noktası, görüş ve boş alan koşulları doğrulanır.");
  if (spell.conditionEffect) guidance.push(`${spell.conditionEffect} condition etkisini uygula ve süreyi takip et.`);
  if (behavior.materialWarning) guidance.push(`Material: ${behavior.materialWarning}`);
  const automatic = Boolean(formula) && ["automatic", "spell-attack", "saving-throw"].includes(resolution);
  const assisted = automatic || Boolean(spell.effectType || behavior.area || behavior.repeatSave || behavior.summoning || behavior.movement || spell.conditionEffect);
  return {
    spellId: spell.id,
    slotLevel,
    resolution,
    formula,
    targetCount: behavior.targetCount,
    area: behavior.area,
    saveAbility: spell.saveAbility ?? null,
    saveDamageRule: getDefaultSpellSaveRule(spell),
    concentration: spell.concentration,
    repeatSave: behavior.repeatSave,
    summoning: behavior.summoning,
    movement: behavior.movement,
    reaction: Boolean(spell.reactionTrigger || /reaction/i.test(spell.castingTime)),
    ritual: behavior.ritual,
    materialWarning: behavior.materialWarning,
    tier: automatic ? "automatic" : assisted ? "assisted" : "manual",
    guidance,
  };
}

export function resolveGlobalSpell(input: {
  spell: DndSpellData;
  characterLevel: number;
  slotLevel?: number;
  currentEffects?: CharacterSpellEffect[];
  saveSucceeded?: boolean;
  targetCount?: number;
  random?: () => number;
}): SpellRuntimeOutcome {
  const slotLevel = input.slotLevel ?? input.spell.level;
  const plan = getSpellRuntimePlan(input.spell, input.characterLevel, slotLevel);
  const rolled = plan.formula ? rollFormula(plan.formula, input.random) : null;
  const resolved = rolled === null ? null : resolveSpellSave(rolled, Boolean(input.saveSucceeded), plan.saveDamageRule);
  const count = Math.max(1, input.targetCount ?? plan.targetCount);
  const perTarget = resolved === null ? [] : Array.from({ length: count }, () => resolved);
  const effect = createSpellEffect(input.spell);
  const nextEffects = effect ? addSpellEffect(input.currentEffects ?? [], effect) : input.currentEffects ?? [];
  return { rolled, resolved, perTarget, effect, nextEffects };
}

export function getGlobalCastableSlotLevels(spell: DndSpellData, slots: CharacterSpellSlot[], pactSlots: CharacterSpellSlot[] = []) {
  return [...new Set([...getCastableSlotLevels(spell, slots), ...getCastableSlotLevels(spell, pactSlots)])].sort((a, b) => a - b);
}

export function endConcentration(effects: CharacterSpellEffect[]) {
  return effects.filter((effect) => !effect.concentration);
}

export function dispelSpellEffects(effects: CharacterSpellEffect[], options: { spellId?: string; effectId?: string; condition?: string } = {}) {
  const condition = options.condition?.toLowerCase();
  return effects.filter((effect) => {
    if (options.effectId && effect.id === options.effectId) return false;
    if (options.spellId && effect.spellId === options.spellId) return false;
    if (condition && effect.summary.toLowerCase().includes(condition)) return false;
    return true;
  });
}
