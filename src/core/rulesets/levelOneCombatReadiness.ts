import type { CharacterDraft } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";

export type LevelOneCombatReadiness = {
  ready: boolean;
  blockers: string[];
  notices: string[];
  primaryOptions: string[];
  completedChecks: number;
  totalChecks: number;
};

function isOffensiveSpellId(spellId: string, rulesetData: RulesetData) {
  const spell = rulesetData.spells.find((candidate) => candidate.id === spellId);
  if (!spell) return false;
  return spell.effectType === "damage" || spell.attackType === "spell-attack" || Boolean(spell.damageDice);
}

export function getLevelOneCombatReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneCombatReadiness {
  const blockers: string[] = [];
  const notices: string[] = [];
  const primaryOptions: string[] = [];

  if (!rulesetData) {
    return {
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden savaş hazırlığı doğrulanamaz."],
      notices,
      primaryOptions,
      completedChecks: 0,
      totalChecks: 4,
    };
  }

  const inventoryIds = new Set(draft.inventory.filter((entry) => entry.quantity > 0).map((entry) => entry.itemId));
  const itemMap = new Map(rulesetData.items.map((item) => [item.id, item]));
  const equippedWeaponIds = draft.equippedWeaponIds ?? [];
  const validEquippedWeapons = equippedWeaponIds
    .filter((itemId) => inventoryIds.has(itemId))
    .map((itemId) => itemMap.get(itemId))
    .filter((item) => item?.category === "weapon");

  const missingEquippedReferences = [draft.equippedArmorId, draft.equippedShieldId, ...equippedWeaponIds]
    .filter((itemId): itemId is string => Boolean(itemId))
    .filter((itemId) => !inventoryIds.has(itemId));

  if (missingEquippedReferences.length) {
    blockers.push(`Kuşanılmış ${missingEquippedReferences.length} eşya envanterde bulunmuyor.`);
  }

  if (validEquippedWeapons.length) {
    primaryOptions.push(...validEquippedWeapons.map((item) => item?.name ?? "Silah"));
  }

  const selectedSpellIds = new Set([
    ...(draft.knownSpellIds ?? []),
    ...(draft.preparedSpellIds ?? []),
    ...alwaysPreparedSpellIds,
  ]);
  const offensiveSpellNames = [...selectedSpellIds]
    .filter((spellId) => isOffensiveSpellId(spellId, rulesetData))
    .map((spellId) => rulesetData.spells.find((spell) => spell.id === spellId)?.name)
    .filter((name): name is string => Boolean(name));

  if (offensiveSpellNames.length) primaryOptions.push(...offensiveSpellNames.slice(0, 3));

  const hasReliableUnarmedOption = draft.className === "Monk";
  if (hasReliableUnarmedOption) primaryOptions.push("Martial Arts / Unarmed Strike");

  const hasPrimaryCombatOption = primaryOptions.length > 0;
  if (!hasPrimaryCombatOption) {
    notices.push("Hazır bir silah veya saldırı büyüsü görünmüyor; ilk çatışma öncesi loadout kontrol edilmeli.");
  }

  const hasDefense = Number.isFinite(draft.armorClass) && draft.armorClass >= 10;
  if (!hasDefense) blockers.push("Armor Class geçerli bir savaş değeri değil.");

  const hasSurvivability = Number.isFinite(draft.maxHp) && draft.maxHp > 0;
  if (!hasSurvivability) blockers.push("Max HP en az 1 olmalı.");

  const hasResourceSource = draft.inventory.some((entry) => entry.quantity > 0) || draft.gold > 0;
  if (!hasResourceSource) notices.push("Ekipman ve altın bulunmuyor; karakter savaş dışı hazırlıkta da eksik kalabilir.");

  const checks = [missingEquippedReferences.length === 0, hasDefense, hasSurvivability, hasPrimaryCombatOption];
  return {
    ready: blockers.length === 0 && hasPrimaryCombatOption,
    blockers,
    notices,
    primaryOptions: [...new Set(primaryOptions)],
    completedChecks: checks.filter(Boolean).length,
    totalChecks: checks.length,
  };
}
