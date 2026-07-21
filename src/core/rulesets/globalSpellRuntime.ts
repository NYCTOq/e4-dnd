import type { CharacterSpellEffect, CharacterSpellSlot, RulesetId } from "../character/character.types";
import type { DndSpellData, SpellResolutionType } from "./ruleset.types";
import { getSpellBehavior } from "./spellBehaviorRules";
import { getControlSpellRuntime, type ControlSpellRuntime } from "./spellControlRules";
import { getDefenseMovementSpellRuntime, type DefenseMovementSpellRuntime } from "./spellDefenseMovementRules";
import { getSummonPersistentSpellRuntime, type SummonPersistentSpellRuntime } from "./spellSummonPersistentRules";
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
  control: ControlSpellRuntime | null;
  defenseMovement: DefenseMovementSpellRuntime | null;
  summonPersistent: SummonPersistentSpellRuntime | null;
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
  if (spell.saveDamageRule) return spell.saveDamageRule;
  const text = `${spell.description} ${spell.higherLevels ?? ""}`;
  if (hasText(text, /half as much|half damage|save for half|yarısı|yarı hasar/i)) return "half";
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

export function getSpellRuntimePlan(spell: DndSpellData, characterLevel: number, slotLevel = spell.level, ruleset: RulesetId = "dnd_2014"): SpellRuntimePlan {
  const behavior = getSpellBehavior(spell, slotLevel);
  const formula = getSpellRollFormula(spell, characterLevel, slotLevel);
  const resolution = spell.attackType ?? (spell.saveAbility ? "saving-throw" : "automatic");
  const control = getControlSpellRuntime(spell, ruleset, slotLevel);
  const defenseMovement = getDefenseMovementSpellRuntime(spell, ruleset, slotLevel);
  const summonPersistent = getSummonPersistentSpellRuntime(spell, ruleset, slotLevel);
  const guidance: string[] = [];
  if (behavior.repeatSave) guidance.push("Hedef uygun tur sonunda saving throw'u tekrarlar.");
  if (behavior.summoning) guidance.push("Summon/companion istatistikleri ve komut ekonomisi masa üzerinde doğrulanır.");
  if (behavior.movement) guidance.push("Varış noktası, görüş ve boş alan koşulları doğrulanır.");
  if (spell.conditionEffect) guidance.push(`${spell.conditionEffect} condition etkisini uygula ve süreyi takip et.`);
  if (control) guidance.push(...control.guidance);
  if (defenseMovement) guidance.push(...defenseMovement.guidance);
  if (summonPersistent) guidance.push(...summonPersistent.guidance);
  if (spell.id === "magic-missile") guidance.push("Her dart ayrı hedefe yönlendirilebilir; aynı hedefe giden dartların hasarını birlikte uygula.");
  if (spell.id === "guiding-bolt") guidance.push("Bir sonraki saldırı atışı, hedefe karşı süre dolmadan yapılırsa Advantage kazanır.");
  if (spell.id === "spirit-guardians") guidance.push(/ends its turn/i.test(spell.description) ? "2024: Emanation hedefe girdiğinde, hedef Emanation’a girdiğinde veya turunu orada bitirdiğinde, tur başına en fazla bir save." : "2014: Hedef alana ilk kez girdiğinde veya turuna alanda başladığında save yapar.");
  if (behavior.materialWarning) guidance.push(`Material: ${behavior.materialWarning}`);
  const automatic = Boolean(formula) && ["automatic", "spell-attack", "saving-throw"].includes(resolution);
  const assisted = automatic || Boolean(spell.effectType || behavior.area || behavior.repeatSave || behavior.summoning || behavior.movement || spell.conditionEffect || summonPersistent);
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
    control,
    defenseMovement,
    summonPersistent,
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
  spellcastingAbilityModifier?: number;
  ruleset?: RulesetId;
}): SpellRuntimeOutcome {
  const slotLevel = input.slotLevel ?? input.spell.level;
  const plan = getSpellRuntimePlan(input.spell, input.characterLevel, slotLevel, input.ruleset ?? "dnd_2014");
  const isMagicMissile = input.spell.id === "magic-missile";
  const count = Math.max(1, input.targetCount ?? plan.targetCount);
  const projectileRolls = isMagicMissile ? Array.from({ length: count }, () => rollFormula("1d4+1", input.random)) : [];
  const baseRoll = isMagicMissile ? projectileRolls.reduce((sum, value) => sum + value, 0) : plan.formula ? rollFormula(plan.formula, input.random) : null;
  const addsAbilityModifier = baseRoll !== null && /spellcasting ability modifier/i.test(`${input.spell.description} ${input.spell.higherLevels ?? ""}`);
  const rolled = baseRoll === null ? null : baseRoll + (addsAbilityModifier ? (input.spellcastingAbilityModifier ?? 0) : 0);
  const resolved = rolled === null ? null : resolveSpellSave(rolled, Boolean(input.saveSucceeded), plan.saveDamageRule);
  const perTarget = isMagicMissile ? projectileRolls : resolved === null ? [] : Array.from({ length: count }, () => resolved);
  const effect = createSpellEffect(input.spell, input.ruleset ?? "dnd_2014", slotLevel);
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
