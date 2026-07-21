import type { AbilityKey, CharacterDraft } from "../character/character.types";
import { getAbilityModifier, getProficiencyBonus } from "../character/characterCalculator";
import { getFightingStyles } from "./fightingStyleRules";
import type { DndItemData, RulesetData } from "./ruleset.types";

export type LevelOneOffenseReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

function hasProperty(item: DndItemData, value: string) {
  return item.properties?.some((property) => property.toLowerCase().includes(value)) ?? false;
}

function getWeaponAbility(draft: CharacterDraft, item: DndItemData): AbilityKey {
  const ranged = Boolean(item.range) || hasProperty(item, "ammunition");
  if (ranged) return "dex";
  if (hasProperty(item, "finesse") && draft.abilities.dex > draft.abilities.str) return "dex";
  return "str";
}

function getWeaponAttackProfile(draft: CharacterDraft, item: DndItemData) {
  const ability = getWeaponAbility(draft, item);
  const styles = getFightingStyles(draft.ruleset).filter((style) => draft.fightingStyleIds?.includes(style.id));
  const ranged = ability === "dex" && (Boolean(item.range) || hasProperty(item, "ammunition"));
  const archery = ranged ? (styles.find((style) => style.id === "archery")?.attackBonus ?? 0) : 0;
  const oneHanded = !hasProperty(item, "two-handed") && !hasProperty(item, "two handed");
  const dueling = oneHanded ? (styles.find((style) => style.id === "dueling")?.damageBonus ?? 0) : 0;
  const thrown = hasProperty(item, "thrown") ? (styles.find((style) => style.id === "thrown-weapon-fighting")?.damageBonus ?? 0) : 0;
  return {
    ability,
    attackBonus: getAbilityModifier(draft.abilities[ability]) + getProficiencyBonus(draft.level) + (item.attackBonus ?? 0) + archery,
    damage: item.damage ?? "",
    damageBonus: getAbilityModifier(draft.abilities[ability]) + (item.damageBonus ?? 0) + dueling + thrown,
  };
}

export function getLevelOneOffenseReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneOffenseReadiness {
  if (!rulesetData) {
    return { applicable: false, ready: false, blockers: ["Ruleset verisi yüklenmeden saldırı hazırlığı doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const classData = rulesetData.classes.find((candidate) => candidate.name === draft.className) ?? null;
  if (!classData) {
    return { applicable: false, ready: false, blockers: ["Class seçilmeden saldırı hazırlığı doğrulanamaz."], notices: [], completedChecks: 0, totalChecks: 0, summary: [] };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];
  const inventoryIds = new Set(draft.inventory.filter((entry) => entry.quantity > 0).map((entry) => entry.itemId));
  const itemMap = new Map(rulesetData.items.map((item) => [item.id, item]));
  const equippedWeapons = (draft.equippedWeaponIds ?? [])
    .filter((id) => inventoryIds.has(id))
    .map((id) => itemMap.get(id))
    .filter((item): item is DndItemData => item?.category === "weapon");

  const weaponProfiles = equippedWeapons.map((item) => ({ item, ...getWeaponAttackProfile(draft, item) }));
  const weaponDataValid = weaponProfiles.every(({ item, damage, attackBonus, damageBonus }) => Boolean(damage && item.damageType) && Number.isFinite(attackBonus) && Number.isFinite(damageBonus));
  checks.push(weaponProfiles.length === 0 || weaponDataValid);
  if (!weaponDataValid) blockers.push("Kuşanılmış silahlardan en az birinin damage formülü, damage type veya saldırı hesabı eksik.");
  summary.push(...weaponProfiles.map(({ item, ability, attackBonus, damage, damageBonus }) => `${item.name} ${ability.toUpperCase()} ${attackBonus >= 0 ? "+" : ""}${attackBonus} · ${damage}${damageBonus ? ` ${damageBonus >= 0 ? "+" : ""}${damageBonus}` : ""}`));

  const selectedSpellIds = new Set([...(draft.knownSpellIds ?? []), ...(draft.preparedSpellIds ?? []), ...alwaysPreparedSpellIds]);
  const offensiveSpells = [...selectedSpellIds]
    .map((id) => rulesetData.spells.find((spell) => spell.id === id))
    .filter((spell) => spell && (spell.effectType === "damage" || spell.attackType === "spell-attack" || spell.attackType === "saving-throw" || Boolean(spell.damageDice)));
  const spellcastingAbility = classData.spellcastingAbility ?? undefined;
  const spellMathValid = offensiveSpells.length === 0 || Boolean(spellcastingAbility);
  checks.push(spellMathValid);
  if (!spellMathValid) blockers.push("Saldırı büyüleri seçili ancak class için spellcasting ability tanımlı değil.");
  if (offensiveSpells.length && spellcastingAbility) {
    const spellAttackBonus = getProficiencyBonus(draft.level) + getAbilityModifier(draft.abilities[spellcastingAbility]);
    const spellSaveDc = 8 + spellAttackBonus;
    summary.push(`Spell Attack ${spellAttackBonus >= 0 ? "+" : ""}${spellAttackBonus} · Spell DC ${spellSaveDc}`);
  }

  const hasWeaponOption = weaponProfiles.length > 0;
  const hasSpellOption = offensiveSpells.length > 0;
  const hasUnarmedOption = draft.className === "Monk";
  const hasPrimaryOption = hasWeaponOption || hasSpellOption || hasUnarmedOption;
  checks.push(hasPrimaryOption);
  if (!hasPrimaryOption) blockers.push("Hazır bir silah, saldırı büyüsü veya güvenilir unarmed saldırı seçeneği bulunmalı.");
  if (hasUnarmedOption && !hasWeaponOption) summary.push(`Unarmed Strike ${getAbilityModifier(draft.abilities.dex) + getProficiencyBonus(draft.level) >= 0 ? "+" : ""}${getAbilityModifier(draft.abilities.dex) + getProficiencyBonus(draft.level)}`);

  const primaryAbility = classData.primaryAbilities?.[0];
  const primaryAbilityValid = !primaryAbility || draft.abilities[primaryAbility] >= 10;
  checks.push(primaryAbilityValid);
  if (!primaryAbilityValid) notices.push(`${primaryAbility?.toUpperCase()} 10 altında; ana saldırı isabet ve hasarı düşük kalabilir.`);

  return {
    applicable: true,
    ready: blockers.length === 0,
    blockers,
    notices,
    completedChecks: checks.filter(Boolean).length,
    totalChecks: checks.length,
    summary,
  };
}
