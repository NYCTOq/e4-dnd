import type { CharacterDraft } from "../character/character.types";
import { getAbilityModifier } from "../character/characterCalculator";
import { calculateJourneyArmorClass } from "../character/playerJourneyConsistency";
import type { RulesetData } from "./ruleset.types";

export type LevelOneDefenseReadiness = {
  applicable: boolean;
  ready: boolean;
  blockers: string[];
  notices: string[];
  completedChecks: number;
  totalChecks: number;
  summary: string[];
};

function unique(values: string[]) {
  return [...new Set(values)];
}

export function getLevelOneDefenseReadiness(
  draft: CharacterDraft,
  rulesetData: RulesetData | null,
): LevelOneDefenseReadiness {
  if (!rulesetData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Ruleset verisi yüklenmeden savunma hazırlığı doğrulanamaz."],
      notices: [],
      completedChecks: 0,
      totalChecks: 0,
      summary: [],
    };
  }

  const classData = rulesetData.classes.find((candidate) => candidate.name === draft.className) ?? null;
  if (!classData) {
    return {
      applicable: false,
      ready: false,
      blockers: ["Class seçilmeden savunma hazırlığı doğrulanamaz."],
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

  const conModifier = getAbilityModifier(draft.abilities.con);
  const expectedMinimumHp = Math.max(1, classData.hitDie + conModifier);
  const hpValid = Number.isFinite(draft.maxHp) && draft.maxHp >= expectedMinimumHp;
  checks.push(hpValid);
  if (!hpValid) blockers.push(`Level 1 Max HP en az ${expectedMinimumHp} olmalı (${classData.hitDie} Hit Die + CON modifier).`);
  summary.push(`HP ${draft.maxHp}/${expectedMinimumHp}+`);

  const effectiveArmorClass = calculateJourneyArmorClass({ ...draft, resources: draft.resources ?? [] }, rulesetData.items);
  const acValid = Number.isFinite(effectiveArmorClass) && effectiveArmorClass >= 1 && effectiveArmorClass <= 30;
  checks.push(acValid);
  if (!acValid) blockers.push("Effective Armor Class 1–30 aralığında geçerli bir değer olmalı.");
  summary.push(`AC ${effectiveArmorClass}${draft.armorClassMode === "auto" ? " auto" : " manual"}`);

  const manualAcAligned = draft.armorClassMode !== "manual" || draft.armorClass === effectiveArmorClass;
  checks.push(manualAcAligned);
  if (!manualAcAligned) blockers.push("Manual Armor Class ile kullanılan effective AC birbiriyle uyuşmuyor.");
  if (draft.armorClassMode === "manual") notices.push("Manual AC kullanılıyor; ekipman değişiklikleri AC değerini otomatik güncellemez.");

  const hitDice = draft.hitDice ?? [];
  const expectedPool = hitDice.find((pool) => pool.die === classData.hitDie);
  const hitDieValid = Boolean(expectedPool && expectedPool.max >= 1 && expectedPool.used >= 0 && expectedPool.used <= expectedPool.max);
  checks.push(hitDieValid);
  if (!hitDieValid) blockers.push(`Level 1 için en az 1d${classData.hitDie} geçerli Hit Die havuzu bulunmalı.`);
  summary.push(`Hit Dice ${expectedPool ? `${expectedPool.max - expectedPool.used}/${expectedPool.max}d${expectedPool.die}` : `0/1d${classData.hitDie}`}`);

  const savingThrows = unique(classData.savingThrows ?? []);
  const savingThrowsValid = savingThrows.length === 2 && savingThrows.every((ability) => ability in draft.abilities);
  checks.push(savingThrowsValid);
  if (!savingThrowsValid) blockers.push("Class için iki geçerli saving throw proficiency tanımlanmalı.");
  else summary.push(`Saves ${savingThrows.map((value) => value.toUpperCase()).join(", ")}`);

  const shieldItem = draft.equippedShieldId
    ? rulesetData.items.find((item) => item.id === draft.equippedShieldId)
    : null;
  const twoHandedWeapon = (draft.equippedWeaponIds ?? [])
    .map((id) => rulesetData.items.find((item) => item.id === id))
    .find((item) => item?.properties?.some((property) => /two-handed/i.test(property)));
  const handConflictFree = !(shieldItem && twoHandedWeapon);
  checks.push(handConflictFree);
  if (!handConflictFree) blockers.push(`${twoHandedWeapon?.name ?? "Two-Handed silah"} ile shield aynı anda kullanılamaz.`);

  const lowDefense = effectiveArmorClass < 12;
  if (lowDefense) notices.push("AC 12 altında; düşük seviyede savunma riski yüksek olabilir.");
  if (draft.abilities.con < 10) notices.push("CON 10 altında; HP ve Constitution save dayanıklılığı düşüktür.");

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
