import type { CharacterDraft, CharacterHitDiePool, CharacterResource, CharacterSpellSlot } from "../character/character.types";
import type { RulesetData } from "./ruleset.types";

export type LevelOneRestReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

function validHitDie(pool: CharacterHitDiePool) {
  return Number.isFinite(pool.die)
    && Number.isFinite(pool.max)
    && Number.isFinite(pool.used)
    && [6, 8, 10, 12].includes(pool.die)
    && pool.max >= 0
    && pool.used >= 0
    && pool.used <= pool.max;
}

function validSlot(slot: CharacterSpellSlot) {
  return Number.isFinite(slot.level)
    && Number.isFinite(slot.max)
    && Number.isFinite(slot.used)
    && slot.level >= 1
    && slot.level <= 9
    && slot.max >= 0
    && slot.used >= 0
    && slot.used <= slot.max;
}

function validResource(resource: CharacterResource) {
  const partialShortRecoveryValid = resource.shortRecoveryAmount === undefined
    || (Number.isFinite(resource.shortRecoveryAmount) && resource.shortRecoveryAmount > 0 && resource.shortRecoveryAmount <= Math.max(1, resource.max));
  return Boolean(resource.id.trim() && resource.name.trim())
    && Number.isFinite(resource.max)
    && Number.isFinite(resource.used)
    && resource.max >= 0
    && resource.used >= 0
    && (resource.unlimited || resource.used <= resource.max)
    && ["short", "long", "manual"].includes(resource.recovery)
    && partialShortRecoveryValid;
}

export function getLevelOneRestReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneRestReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden dinlenme ve recovery profili doğrulanamaz."],
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
  const level = Math.max(1, Math.floor(draft.level || 1));

  const selectedClass = rulesetData.classes.find((entry) => normalize(entry.name) === normalize(draft.className));
  const classValid = Boolean(selectedClass);
  checks.push(classValid);
  if (!classValid) blockers.push("Rest kontrolü için geçerli bir class seçilmeli.");

  const hitDice = draft.hitDice ?? [];
  const hitDiceValid = hitDice.every(validHitDie)
    && new Set(hitDice.map((pool) => pool.die)).size === hitDice.length;
  checks.push(hitDiceValid);
  if (!hitDiceValid) blockers.push("Hit Dice havuzları benzersiz ve geçerli kullanım sınırlarında olmalı.");

  const hitDiceCapacity = hitDice.reduce((total, pool) => total + pool.max, 0);
  const hitDiceCountValid = !selectedClass || hitDiceCapacity >= level;
  checks.push(hitDiceCountValid);
  if (!hitDiceCountValid) blockers.push(`Toplam Hit Dice kapasitesi en az karakter seviyesi kadar olmalı (${level}).`);

  const expectedHitDiePresent = !selectedClass || hitDice.some((pool) => pool.die === selectedClass.hitDie && pool.max > 0);
  checks.push(expectedHitDiePresent);
  if (!expectedHitDiePresent && selectedClass) blockers.push(`${selectedClass.name} için d${selectedClass.hitDie} Hit Die havuzu eksik.`);

  const spellSlots = draft.spellSlots ?? [];
  const normalSlotsValid = spellSlots.every(validSlot)
    && new Set(spellSlots.map((slot) => slot.level)).size === spellSlots.length;
  checks.push(normalSlotsValid);
  if (!normalSlotsValid) blockers.push("Normal spell slot kayıtları benzersiz ve geçerli kullanım sınırlarında olmalı.");

  const pactSlots = draft.pactMagicSlots ?? [];
  const pactSlotsValid = pactSlots.every(validSlot)
    && new Set(pactSlots.map((slot) => slot.level)).size === pactSlots.length;
  checks.push(pactSlotsValid);
  if (!pactSlotsValid) blockers.push("Pact Magic slot kayıtları benzersiz ve geçerli kullanım sınırlarında olmalı.");

  const resources = draft.resources ?? [];
  const resourcesValid = resources.every(validResource)
    && new Set(resources.map((resource) => normalize(resource.id))).size === resources.length;
  checks.push(resourcesValid);
  if (!resourcesValid) blockers.push("Rest kaynakları benzersiz, geçerli ve recovery kurallarıyla uyumlu olmalı.");

  const warlockClass = normalize(draft.className) === "warlock" || (draft.classLevels ?? []).some((entry) => normalize(entry.className) === "warlock");
  const pactRecoveryValid = !pactSlots.length || warlockClass;
  checks.push(pactRecoveryValid);
  if (!pactRecoveryValid) blockers.push("Pact Magic slotları yalnız Warlock class kaynağıyla kullanılmalı.");

  const shortResources = resources.filter((resource) => resource.recovery === "short" || resource.shortRecoveryAmount);
  const longResources = resources.filter((resource) => resource.recovery === "long");
  const manualResources = resources.filter((resource) => resource.recovery === "manual");
  const spentHitDice = hitDice.reduce((total, pool) => total + pool.used, 0);
  const remainingHitDice = hitDice.reduce((total, pool) => total + Math.max(0, pool.max - pool.used), 0);
  const spentNormalSlots = spellSlots.reduce((total, slot) => total + slot.used, 0);
  const spentPactSlots = pactSlots.reduce((total, slot) => total + slot.used, 0);

  if (hitDice.length) summary.push(`Hit Dice ${remainingHitDice}/${hitDiceCapacity} hazır`);
  if (spellSlots.length) summary.push(`Normal slots ${spentNormalSlots} harcanmış`);
  if (pactSlots.length) summary.push(`Pact slots ${spentPactSlots} harcanmış · Short Rest`);
  if (resources.length) summary.push(`Recovery SR${shortResources.length} · LR${longResources.length} · Manuel${manualResources.length}`);

  if (!spentHitDice) notices.push("Short Rest iyileşmesi için tüm Hit Dice havuzu hazır.");
  if (!shortResources.length && !pactSlots.length) notices.push("Karakterde Short Rest ile yenilenen özel class kaynağı görünmüyor; bu kurala aykırı değildir.");
  if (manualResources.length) notices.push(`Manuel yenilenen kaynaklar otomatik rest işleminde dolmaz: ${manualResources.map((resource) => resource.name).join(", ")}.`);
  if (draft.exhaustion > 0) notices.push(`Long Rest sonrasında exhaustion azaltma akışı takip edilmeli; mevcut seviye ${draft.exhaustion}.`);

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
