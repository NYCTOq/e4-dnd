import type { CharacterDraft } from "../character/character.types";
import type { DndSpellData, RulesetData } from "./ruleset.types";

export type LevelOneSupportReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isHealingSpell(spell: DndSpellData) {
  return spell.tags?.some((tag) => ["healing", "restoration", "support"].includes(normalize(tag)))
    || /heal|restore hit points|regain hit points|cure wounds|healing word|goodberry/i.test(`${spell.name} ${spell.description}`);
}

function isDefensiveSupportSpell(spell: DndSpellData) {
  return spell.tags?.some((tag) => ["buff", "defense", "support", "protection"].includes(normalize(tag)))
    || /temporary hit points|armor class|saving throw|advantage|bless|protection|resistance/i.test(`${spell.name} ${spell.description}`);
}

function isRecoveryResource(name: string) {
  return /second wind|lay on hands|healing light|celestial revelation|song of rest|wild shape|channel divinity/i.test(name);
}

export function getLevelOneSupportReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
  alwaysPreparedSpellIds: string[] = [],
): LevelOneSupportReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden destek ve iyileştirme profili doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const blockers: string[] = [];
  const notices: string[] = [];
  const summary: string[] = [];
  const checks: boolean[] = [];

  const selectedSpellIds = [...new Set([...(draft.knownSpellIds ?? []), ...(draft.preparedSpellIds ?? []), ...alwaysPreparedSpellIds])];
  const selectedSpells = selectedSpellIds
    .map((id) => rulesetData.spells.find((spell) => spell.id === id))
    .filter((spell): spell is DndSpellData => Boolean(spell));
  const spellReferencesValid = selectedSpells.length === selectedSpellIds.length;
  checks.push(spellReferencesValid);
  if (!spellReferencesValid) blockers.push("Destek profili denetiminde katalogda bulunmayan spell referansı var.");

  const resources = draft.resources ?? [];
  const resourcesValid = resources.every((resource) => resource.max >= 0 && resource.used >= 0 && (resource.unlimited || resource.used <= resource.max));
  checks.push(resourcesValid);
  if (!resourcesValid) blockers.push("Class resource kullanım değerleri geçerli maksimum sınırlar içinde olmalı.");

  const healingSpells = selectedSpells.filter(isHealingSpell);
  const supportSpells = selectedSpells.filter((spell) => !healingSpells.includes(spell) && isDefensiveSupportSpell(spell));
  const recoveryResources = resources.filter((resource) => isRecoveryResource(resource.name));

  if (healingSpells.length) summary.push(`Healing ${healingSpells.slice(0, 3).map((spell) => spell.name).join(", ")}`);
  if (supportSpells.length) summary.push(`Support ${supportSpells.slice(0, 3).map((spell) => spell.name).join(", ")}`);
  if (recoveryResources.length) summary.push(`Recovery resources ${recoveryResources.map((resource) => resource.name).slice(0, 3).join(", ")}`);

  const hasHitDice = (draft.hitDice ?? []).some((pool) => pool.max > 0);
  checks.push(hasHitDice);
  if (!hasHitDice) blockers.push("Short Rest iyileşmesi için geçerli bir Hit Dice havuzu bulunmalı.");
  else summary.push(`Hit Dice ${draft.hitDice.map((pool) => `${pool.max - pool.used}/${pool.max}d${pool.die}`).join(", ")}`);

  const canSelfRecover = healingSpells.length > 0 || recoveryResources.length > 0 || hasHitDice;
  checks.push(canSelfRecover);
  if (!canSelfRecover) notices.push("Karakterde görünür bir iyileştirme büyüsü, recovery resource veya kullanılabilir Hit Dice seçeneği yok.");

  const supportFocusedClass = ["bard", "cleric", "druid", "paladin"].includes(normalize(draft.className));
  if (supportFocusedClass && healingSpells.length === 0 && recoveryResources.length === 0) {
    notices.push(`${draft.className} için level 1 destek veya iyileştirme seçeneği görünmüyor.`);
  }

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
