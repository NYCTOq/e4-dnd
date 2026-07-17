import type { AbilityKey, Character, CharacterCondition } from "../character/character.types";
import type { DndFeatData, DndItemData, DndSpellData, RulesetData } from "../rulesets/ruleset.types";
import type { HomebrewEntity, HomebrewPackage } from "./homebrewFoundation";
import { getHomebrewCharacterEntities } from "./homebrewRuntimeIntegration";

export type HomebrewFeatRuntime = {
  entityId: string;
  feat: DndFeatData;
  selectedChoices: string[];
  choiceComplete: boolean;
  passiveSummaries: string[];
};

export type HomebrewSpellRuntime = {
  entityId: string;
  spell: DndSpellData;
  prepared: boolean;
  known: boolean;
  automatic: boolean;
  formula?: string;
  warnings: string[];
};

export type HomebrewItemRuntime = {
  entityId: string;
  item: DndItemData;
  quantity: number;
  attuned: boolean;
  attunementReady: boolean;
  chargesRemaining?: number;
  usable: boolean;
  effectSummary: string[];
};

export type HomebrewContentRuntime = {
  feats: HomebrewFeatRuntime[];
  spells: HomebrewSpellRuntime[];
  items: HomebrewItemRuntime[];
  blockers: string[];
  warnings: string[];
  ready: boolean;
};

function homebrewEntities(packages: HomebrewPackage[], type: HomebrewEntity["type"]): HomebrewEntity[] {
  return packages.flatMap((pkg) => pkg.entities).filter((entity) => entity.type === type);
}

function getSpellFormula(spell: DndSpellData): string | undefined {
  return spell.damageDice ?? spell.healingDice;
}

function spellWarnings(spell: DndSpellData): string[] {
  const warnings: string[] = [];
  if (spell.effectType === "damage" && !spell.damageDice && spell.attackType !== "ability-check") warnings.push("Damage formülü tanımlı değil.");
  if (spell.effectType === "healing" && !spell.healingDice) warnings.push("Healing formülü tanımlı değil.");
  if (spell.attackType === "saving-throw" && !spell.saveAbility) warnings.push("Saving throw ability tanımlı değil.");
  if (spell.castingTime.toLowerCase().includes("reaction") && !spell.reactionTrigger) warnings.push("Reaction trigger tanımlı değil.");
  if (spell.materialConsumed && !spell.materialCost) warnings.push("Tüketilen material için maliyet tanımlı değil.");
  return warnings;
}

function itemEffectSummary(item: DndItemData): string[] {
  return [
    item.attackBonus ? `Attack +${item.attackBonus}` : null,
    item.damageBonus ? `Damage +${item.damageBonus}` : null,
    item.armorBonus ? `AC +${item.armorBonus}` : null,
    item.savingThrowBonus ? `Saving Throws +${item.savingThrowBonus}` : null,
    item.speedBonus ? `Speed +${item.speedBonus} ft.` : null,
    item.resistanceDamageType ? `${item.resistanceDamageType} resistance` : null,
    item.healingFormula ? `Healing ${item.healingFormula}` : null,
    item.itemDamageFormula ? `Damage ${item.itemDamageFormula}` : null,
    item.grantedSpellName ? `Spell: ${item.grantedSpellName}` : null,
    item.effectSummary ?? null,
  ].filter((value): value is string => Boolean(value));
}

export function getHomebrewContentRuntime(character: Character, packages: HomebrewPackage[], rulesetData?: RulesetData | null): HomebrewContentRuntime {
  const matched = getHomebrewCharacterEntities(character, packages);
  const matchedIds = new Set(matched.map((entity) => entity.id));
  const blockers: string[] = [];
  const warnings: string[] = [];

  const feats = homebrewEntities(packages, "feat")
    .filter((entity) => character.featIds.includes(entity.id))
    .map((entity) => {
      const feat = entity.payload as DndFeatData;
      const selectedChoices = character.featChoices?.[feat.id] ?? [];
      const required = feat.choiceCount ?? (feat.choiceType ? 1 : 0);
      const choiceComplete = selectedChoices.length >= required;
      if (!choiceComplete) blockers.push(`${feat.name}: ${required - selectedChoices.length} zorunlu feat seçimi eksik.`);
      return { entityId: entity.id, feat, selectedChoices, choiceComplete, passiveSummaries: feat.benefits.length ? feat.benefits : [feat.summary] };
    });

  const spellEntityMap = new Map(homebrewEntities(packages, "spell").map((entity) => [entity.id, entity]));
  const selectedSpellIds = new Set([...character.knownSpellIds, ...character.preparedSpellIds]);
  const spells = [...selectedSpellIds].flatMap((id) => {
    const entity = spellEntityMap.get(id);
    if (!entity) return [];
    const spell = (rulesetData?.spells.find((candidate) => candidate.id === id) ?? entity.payload) as DndSpellData;
    const currentWarnings = spellWarnings(spell);
    warnings.push(...currentWarnings.map((message) => `${spell.name}: ${message}`));
    return [{
      entityId: entity.id,
      spell,
      prepared: character.preparedSpellIds.includes(id),
      known: character.knownSpellIds.includes(id),
      automatic: currentWarnings.length === 0 && Boolean(spell.effectType),
      formula: getSpellFormula(spell),
      warnings: currentWarnings,
    }];
  });

  const itemEntityMap = new Map(homebrewEntities(packages, "item").map((entity) => [entity.id, entity]));
  const attunedCount = character.inventory.filter((entry) => entry.attuned).length;
  const items = character.inventory.flatMap((entry) => {
    const entity = itemEntityMap.get(entry.itemId);
    if (!entity) return [];
    const item = (rulesetData?.items.find((candidate) => candidate.id === entry.itemId) ?? entity.payload) as DndItemData;
    const attuned = Boolean(entry.attuned);
    const attunementReady = !item.requiresAttunement || attuned || attunedCount < 3;
    const chargesRemaining = item.charges === undefined ? undefined : Math.max(0, item.charges - (entry.chargesUsed ?? 0));
    const usable = entry.quantity > 0 && attunementReady && (!item.requiresAttunement || attuned) && (chargesRemaining === undefined || chargesRemaining >= (item.chargeCost ?? 1));
    if (item.requiresAttunement && !attuned) warnings.push(`${item.name}: Kullanım için attunement gerekli.`);
    if (item.charges !== undefined && (item.chargeCost ?? 1) > item.charges) blockers.push(`${item.name}: Charge maliyeti maksimum charge değerini aşıyor.`);
    return [{ entityId: entity.id, item, quantity: entry.quantity, attuned, attunementReady, chargesRemaining, usable, effectSummary: itemEffectSummary(item) }];
  });

  for (const entity of matched) {
    if ((entity.type === "feat" || entity.type === "spell" || entity.type === "item") && !matchedIds.has(entity.id)) blockers.push(`${entity.name}: Homebrew runtime eşleşmesi kurulamadı.`);
  }

  return { feats, spells, items, blockers, warnings, ready: blockers.length === 0 };
}

export function applyHomebrewFeatAbilityBonus(character: Character, featId: string, ability: AbilityKey, amount = 1): Character {
  if (!character.featIds.includes(featId)) throw new Error("Homebrew feat karakterde seçili değil.");
  const current = character.abilities[ability];
  return {
    ...character,
    abilities: { ...character.abilities, [ability]: Math.min(20, current + Math.max(0, amount)) },
    updatedAt: new Date().toISOString(),
  };
}

export function applyHomebrewSpellSelfEffect(character: Character, spell: DndSpellData, total: number): Character {
  const next: Character = { ...character, updatedAt: new Date().toISOString() };
  if (spell.effectType === "healing") next.currentHp = Math.min(character.maxHp, character.currentHp + Math.max(0, total));
  if (spell.conditionEffect && !next.conditions.includes(spell.conditionEffect as CharacterCondition)) {
    next.conditions = [...next.conditions, spell.conditionEffect as CharacterCondition];
  }
  if (spell.concentration && !next.conditions.includes("Concentration")) next.conditions = [...next.conditions, "Concentration"];
  return next;
}

export function spendHomebrewItemCharge(character: Character, itemId: string, cost = 1): Character {
  const entry = character.inventory.find((candidate) => candidate.itemId === itemId);
  if (!entry) throw new Error("Homebrew item envanterde bulunamadı.");
  return {
    ...character,
    inventory: character.inventory.map((candidate) => candidate.itemId === itemId ? { ...candidate, chargesUsed: (candidate.chargesUsed ?? 0) + Math.max(0, cost) } : candidate),
    updatedAt: new Date().toISOString(),
  };
}
