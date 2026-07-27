import type {
  DndFeatData,
  DndItemData,
  DndSpellData,
  DndSubclassData,
} from "../../core/rulesets/ruleset.types";
import type { RuntimeTier } from "../../core/rulesets/runtimeCoverageCertification";

const AUTOMATIC_FEATS = [
  "alert", "mobile", "tough", "lucky", "observant", "defensive duelist",
  "inspiring leader", "shield master", "polearm master", "telekinetic",
  "sentinel", "mage slayer", "dual wielder", "war caster", "crossbow expert",
  "spell sniper", "great weapon master", "sharpshooter", "charger",
  "dungeon delver", "elemental adept", "keen mind", "martial adept",
  "medium armor master", "resilient", "ritual caster", "skulker",
  "weapon master", "fey touched", "piercer", "slasher", "skill expert",
];
const AUTOMATIC_SUBCLASS_FEATURES = [
  "radiance of the dawn", "invoke duplicity", "improved warding flare",
  "projected ward", "branches of the tree", "opportunist", "entropic ward",
  "shadow step", "moonlight step", "transposition", "combat wild shape",
  "circle forms", "tides of chaos", "elder champion", "improved critical",
  "superior critical", "extra attack", "draconic resilience", "spell resistance",
  "avatar of battle", "thought shield", "destructive wrath", "guided strike",
  "touch of death", "arcane abjuration", "path to the grave",
  "twilight sanctuary", "emboldening bond", "order's demand", "war priest",
  "arcane ward", "bend luck", "wild magic surge",
];
const AUTOMATIC_ITEM_IDS = new Set([
  "potion-speed", "potion-invisibility", "potion-heroism", "potion-growth",
  "potion-diminution", "potion-flying", "potion-water-breathing",
  "potion-gaseous-form", "potion-resistance",
]);
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function referenceFeatTier(feat: DndFeatData): RuntimeTier {
  const name = normalize(feat.name);
  if (AUTOMATIC_FEATS.some((candidate) => name.includes(normalize(candidate)))) return "automatic";
  if (feat.choiceType || feat.abilityOptions?.length) return "assisted";
  return feat.benefits.length ? "manual" : "missing";
}

export function referenceSpellTier(spell: DndSpellData): RuntimeTier {
  const resolvable = spell.effectType === "damage" || spell.effectType === "healing";
  if (resolvable && Boolean(spell.damageDice || spell.healingDice || spell.attackType)) return "automatic";
  if (spell.effectType || spell.area || spell.target || spell.concentration || spell.ritual ||
      spell.scaling || spell.tags?.length || spell.conditionEffect || spell.reactionTrigger) return "assisted";
  return spell.description.trim() ? "manual" : "missing";
}

export function referenceItemTier(item: DndItemData): RuntimeTier {
  const mechanical = Boolean(
    item.attackBonus || item.damageBonus || item.extraDamageDice ||
    item.criticalExtraDamageDice || item.resistanceDamageType ||
    item.preventsCriticalDamage || item.abilityMinimums || item.savingThrowBonus ||
    item.skillCheckBonus || item.speedBonus || item.healingFormula ||
    item.curesConditions?.length || item.clearsExhaustion || item.restoresHitDice ||
    item.itemDamageFormula || item.armorBonus || item.grantedSpellName || item.charges ||
    item.damage || item.armorClass || item.armorClassBonus || item.mastery
  );
  if (AUTOMATIC_ITEM_IDS.has(item.id) || mechanical) return "automatic";
  if (["weapon", "armor", "shield", "ammunition", "pack"].includes(item.category) || item.tags?.length) return "assisted";
  return item.description.trim() ? "manual" : "missing";
}

export function referenceSubclassTier(subclass: DndSubclassData): RuntimeTier {
  const features = subclass.features ?? [];
  const names = features.map((feature) => normalize(feature.name));
  if (names.some((name) => AUTOMATIC_SUBCLASS_FEATURES.some((candidate) => name.includes(normalize(candidate))))) return "automatic";
  return features.length ? "assisted" : "missing";
}
