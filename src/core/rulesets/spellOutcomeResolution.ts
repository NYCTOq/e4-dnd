import { getSpellRollFormula, rollFormula } from "./spellResolution";
import { getSpellBehavior } from "./spellBehaviorRules";
import { runtimeApplyDamageRelation, type SpellDamageRelation } from "./spellRuntimeCombatRules";

export type ResolvableSpell = {
  id: string;
  name?: string;
  level: number;
  attackType?: string;
  damageDice?: string;
  healingDice?: string;
  damageType?: string;
  saveAbility?: string;
  saveDamageRule?: "full" | "half" | "none";
  target?: string;
  area?: string;
  ritual?: boolean;
  description?: string;
  higherLevels?: string;
  effectType?: string;
  tags?: string[];
  scaling?: { mode?: string; dicePerStep?: string; flatPerStep?: number; additionalTargetsPerStep?: number };
};

export type SpellOutcomeRequest = {
  spell: ResolvableSpell;
  characterLevel: number;
  castLevel?: number;
  spellAttackBonus?: number;
  spellSaveDc?: number;
  attackD20?: number;
  targetArmorClass?: number;
  targetSaveTotal?: number;
  random?: () => number;
};

export type SpellOutcome = {
  formula: string | null;
  rawTotal: number | null;
  appliedTotal: number | null;
  kind: "damage" | "healing" | "utility";
  attackTotal: number | null;
  attackHit: boolean | null;
  saveSucceeded: boolean | null;
  saveDc: number | null;
  damageType: string | null;
  castLevel: number;
  summary: string;
};

export type SpellTargetInput = {
  id: string;
  label?: string;
  armorClass?: number;
  saveTotal?: number;
  damageRelation?: SpellDamageRelation;
};

export type SpellTargetOutcome = SpellOutcome & {
  targetId: string;
  targetLabel: string;
  damageRelation: SpellDamageRelation;
};

export type MultiTargetSpellOutcome = {
  spellId: string;
  castLevel: number;
  area: string | null;
  maximumTargets: number | null;
  requestedTargets: number;
  resolvedTargets: number;
  targetOutcomes: SpellTargetOutcome[];
  totalApplied: number;
  summary: string;
};

const clampD20 = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(20, Math.max(1, Math.floor(value)))
    : null;

/** Resolves the numerical outcome of one spell against one target without mutating character state. */
export function resolveSpellOutcome(request: SpellOutcomeRequest): SpellOutcome {
  const { spell } = request;
  const castLevel = spell.level === 0 ? 0 : Math.max(spell.level, Math.floor(request.castLevel ?? spell.level));
  const formula = getSpellRollFormula(spell as never, Math.max(1, Math.floor(request.characterLevel)), castLevel);
  const rawTotal = formula ? rollFormula(formula, request.random ?? Math.random) : null;
  const kind: SpellOutcome["kind"] = spell.healingDice ? "healing" : spell.damageDice ? "damage" : "utility";

  const attackD20 = clampD20(request.attackD20);
  const attackTotal = attackD20 === null ? null : attackD20 + Math.floor(request.spellAttackBonus ?? 0);
  const attackHit = attackTotal === null || typeof request.targetArmorClass !== "number"
    ? null
    : attackTotal >= request.targetArmorClass;

  const saveDc = spell.saveAbility ? Math.floor(request.spellSaveDc ?? 0) : null;
  const saveSucceeded = saveDc === null || typeof request.targetSaveTotal !== "number"
    ? null
    : request.targetSaveTotal >= saveDc;

  let appliedTotal = rawTotal;
  if (kind === "damage" && rawTotal !== null) {
    if (attackHit === false) appliedTotal = 0;
    if (saveSucceeded === true) {
      if (spell.saveDamageRule === "half") appliedTotal = Math.floor(rawTotal / 2);
      else if (spell.saveDamageRule === "none" || !spell.saveDamageRule) appliedTotal = 0;
    }
  }

  const parts: string[] = [];
  parts.push(spell.name ?? spell.id);
  if (castLevel > spell.level) parts.push(castLevel + ". seviye upcast");
  if (formula) parts.push(formula + " = " + rawTotal);
  if (attackHit !== null) parts.push(attackHit ? "saldırı isabet" : "saldırı ıskaladı");
  if (saveSucceeded !== null) parts.push(saveSucceeded ? "hedef save başarılı" : "hedef save başarısız");
  if (appliedTotal !== rawTotal && appliedTotal !== null) parts.push("uygulanan: " + appliedTotal);

  return {
    formula,
    rawTotal,
    appliedTotal,
    kind,
    attackTotal,
    attackHit,
    saveSucceeded,
    saveDc,
    damageType: spell.damageType ?? null,
    castLevel,
    summary: parts.join(" · "),
  };
}

/**
 * Resolves a spell against multiple targets.
 * Saving-throw and area spells share one damage/healing roll, matching normal table play.
 * Spell attacks roll a separate d20 and effect roll for every target.
 */
export function resolveSpellTargets(request: {
  spell: ResolvableSpell;
  characterLevel: number;
  castLevel?: number;
  spellAttackBonus?: number;
  spellSaveDc?: number;
  targets: SpellTargetInput[];
  random?: () => number;
}): MultiTargetSpellOutcome {
  const random = request.random ?? Math.random;
  const castLevel = request.spell.level === 0
    ? 0
    : Math.max(request.spell.level, Math.floor(request.castLevel ?? request.spell.level));
  const behavior = getSpellBehavior(request.spell as never, castLevel);
  const maximumTargets = behavior.area ? null : Math.max(1, behavior.targetCount);
  const targets = maximumTargets === null
    ? request.targets
    : request.targets.slice(0, maximumTargets);
  const sharedRoll = request.spell.attackType !== "spell-attack";
  const sharedRandomValues: number[] = [];
  const sharedRandom = () => {
    const value = random();
    sharedRandomValues.push(value);
    return value;
  };

  let sharedBase: SpellOutcome | null = null;
  if (sharedRoll && targets.length > 0) {
    sharedBase = resolveSpellOutcome({
      spell: request.spell,
      characterLevel: request.characterLevel,
      castLevel,
      spellAttackBonus: request.spellAttackBonus,
      spellSaveDc: request.spellSaveDc,
      targetSaveTotal: targets[0]?.saveTotal,
      targetArmorClass: targets[0]?.armorClass,
      random: sharedRandom,
    });
  }

  const targetOutcomes = targets.map((target, index): SpellTargetOutcome => {
    let outcome: SpellOutcome;
    if (sharedBase) {
      const saveDc = request.spell.saveAbility ? Math.floor(request.spellSaveDc ?? 0) : null;
      const saveSucceeded = saveDc === null || typeof target.saveTotal !== "number"
        ? null
        : target.saveTotal >= saveDc;
      let appliedTotal = sharedBase.rawTotal;
      if (sharedBase.kind === "damage" && sharedBase.rawTotal !== null && saveSucceeded === true) {
        if (request.spell.saveDamageRule === "half") appliedTotal = Math.floor(sharedBase.rawTotal / 2);
        else if (request.spell.saveDamageRule === "none" || !request.spell.saveDamageRule) appliedTotal = 0;
      }
      outcome = {
        ...sharedBase,
        saveSucceeded,
        appliedTotal,
        summary: [
          request.spell.name ?? request.spell.id,
          sharedBase.formula ? sharedBase.formula + " = " + sharedBase.rawTotal : null,
          saveSucceeded === null ? null : saveSucceeded ? "save başarılı" : "save başarısız",
          appliedTotal !== sharedBase.rawTotal && appliedTotal !== null ? "uygulanan: " + appliedTotal : null,
        ].filter(Boolean).join(" · "),
      };
    } else {
      outcome = resolveSpellOutcome({
        spell: request.spell,
        characterLevel: request.characterLevel,
        castLevel,
        spellAttackBonus: request.spellAttackBonus,
        spellSaveDc: request.spellSaveDc,
        attackD20: Math.floor(random() * 20) + 1,
        targetArmorClass: target.armorClass,
        targetSaveTotal: target.saveTotal,
        random,
      });
    }

    const relation = target.damageRelation ?? "normal";
    const relatedTotal = outcome.kind === "damage" && outcome.appliedTotal !== null
      ? runtimeApplyDamageRelation(outcome.appliedTotal, relation)
      : outcome.appliedTotal;
    const label = target.label ?? ("Hedef " + (index + 1));
    return {
      ...outcome,
      targetId: target.id,
      targetLabel: label,
      damageRelation: relation,
      appliedTotal: relatedTotal,
      summary: outcome.summary + (relation === "normal" ? "" : " · " + relation + ": " + relatedTotal),
    };
  });

  const totalApplied = targetOutcomes.reduce((sum, outcome) => sum + Math.max(0, outcome.appliedTotal ?? 0), 0);
  return {
    spellId: request.spell.id,
    castLevel,
    area: behavior.area,
    maximumTargets,
    requestedTargets: request.targets.length,
    resolvedTargets: targetOutcomes.length,
    targetOutcomes,
    totalApplied,
    summary: (request.spell.name ?? request.spell.id) + ": " + targetOutcomes.length + " hedef çözüldü · toplam uygulanan " + totalApplied,
  };
}
